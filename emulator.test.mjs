// Firestore 에뮬레이터에서 실제 트랜잭션 + 보안 규칙 검증. 실행: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, runTransaction, writeBatch } from "firebase/firestore";
import { toggleTask } from "./pet.js";

// 실제 규칙 파일을 쓰되, 가족 이메일 목록만 테스트 계정으로 바꿈
const rules = readFileSync(new URL("./firestore.rules", import.meta.url), "utf8")
  .replace(/email in \[[^\]]*\]/, "email in ['family@test.dev']");
const env = await initializeTestEnvironment({ projectId: "demo-family", firestore: { rules } });
const fam = () => env.authenticatedContext("fam", { email: "family@test.dev" }).firestore();
const F = { doc, runTransaction };
const D = "2026-11-21";
const pet = async (db, c) => (await getDoc(doc(db, "pets/" + c))).data() || {};
const chk = async (db) => (await getDoc(doc(db, "checks/" + D))).data() || {};
const t = (name, fn) => fn().then(() => console.log("ok  " + name), (e) => { console.error("FAIL " + name); throw e; });

const pc = fam(), tablet = fam();
await env.withSecurityRulesDisabled(async (c) => {           // 기존 데이터(펫 기능 전 체크) 흉내
  await setDoc(doc(c.firestore(), "checks/" + D), { d: D, kid1am9: true, t1: true });
});

await t("2. 체크 +10, 체크 상태 저장", async () => {
  const r = await toggleTask(F, pc, D, "kid1", "kid1am1", true);
  assert.equal(r.after.totalXp, 10);
  assert.equal((await pet(pc, "kid1")).totalXp, 10);
  const c = await chk(pc);
  assert.equal(c.kid1am1, true); assert.equal(c.xpAwarded.kid1am1, "kid1"); assert.equal(c.t1, true);
});
await t("4. 중복 체크는 XP 그대로", async () => {
  assert.equal(await toggleTask(F, pc, D, "kid1", "kid1am1", true), null);
  assert.equal((await pet(pc, "kid1")).totalXp, 10);
});
await t("1. 도은·도영 분리", async () => {
  await toggleTask(F, pc, D, "kid2", "kid2am1", true);
  assert.equal((await pet(pc, "kid1")).totalXp, 10);
  assert.equal((await pet(pc, "kid2")).totalXp, 10);
});
await t("3. 해제 -10, 체크 해제 저장", async () => {
  await toggleTask(F, pc, D, "kid1", "kid1am1", false);
  assert.equal((await pet(pc, "kid1")).totalXp, 0);
  assert.equal((await chk(pc)).kid1am1, false);
  assert.equal(await toggleTask(F, pc, D, "kid1", "kid1am1", false), null);   // 중복 해제
  assert.equal((await pet(pc, "kid1")).totalXp, 0);
});
await t("기존(펫 이전) 체크 해제는 XP 차감 없음", async () => {
  assert.equal(await toggleTask(F, pc, D, "kid1", "kid1am9", false), null);
  assert.equal((await chk(pc)).kid1am9, false);
  assert.equal((await pet(pc, "kid1")).totalXp, 0);
});
await t("5. 성장 단계 + 하락 없음", async () => {
  for (let i = 0; i < 5; i++) await toggleTask(F, pc, D, "kid1", "s" + i, true);
  let p = await pet(pc, "kid1");
  assert.equal(p.totalXp, 50); assert.equal(p.highestUnlockedStage, 1);
  await toggleTask(F, pc, D, "kid1", "s0", false);
  p = await pet(pc, "kid1");
  assert.equal(p.totalXp, 40); assert.equal(p.highestUnlockedStage, 1);
});
await t("6. 새로고침(새 연결)·날짜 변경 후에도 누적 유지", async () => {
  const fresh = fam();
  assert.equal((await pet(fresh, "kid1")).totalXp, 40);
  await toggleTask(F, fresh, "2026-11-22", "kid1", "s0", true);   // 다음 날 같은 루틴은 다시 지급
  assert.equal((await pet(fresh, "kid1")).totalXp, 50);
});
await t("7. PC·태블릿 동시 변경: 체크 상태와 XP 일치", async () => {
  const before = (await pet(pc, "kid2")).totalXp;
  const jobs = [];
  for (let i = 0; i < 12; i++) jobs.push(toggleTask(F, i % 2 ? pc : tablet, D, "kid2", "kid2pm1", i % 3 !== 2));
  await Promise.all(jobs);
  const c = await chk(pc), p = await pet(pc, "kid2");
  const awarded = c.xpAwarded.kid2pm1 === "kid2";
  assert.equal(c.kid2pm1, awarded);
  assert.equal(p.totalXp, before + (awarded ? 10 : 0));
  // 같은 체크를 동시에 여러 번 → 한 번만 지급
  await toggleTask(F, pc, D, "kid2", "kid2pm2", false);
  const b2 = (await pet(pc, "kid2")).totalXp;
  await Promise.all([1, 2, 3, 4].map((i) => toggleTask(F, i % 2 ? pc : tablet, D, "kid2", "kid2pm2", true)));
  assert.equal((await pet(pc, "kid2")).totalXp, b2 + 10);
});
await t("펫 이름 변경", async () => {
  const p = await pet(pc, "kid1");
  await assertSucceeds(setDoc(doc(pc, "pets/kid1"), { petName: "용용이", updatedAt: Date.now() }, { merge: true }));
  assert.equal((await pet(pc, "kid1")).totalXp, p.totalXp);
  await assertSucceeds(setDoc(doc(pc, "pets/kid9"), { childId: "kid9", petName: "새펫", createdAt: 1, updatedAt: 1 }, { merge: true }));
});
await t("11. 권한: 비로그인·다른 계정 차단", async () => {
  const anon = env.unauthenticatedContext().firestore();
  const other = env.authenticatedContext("x", { email: "other@family.dev" }).firestore();
  for (const db of [anon, other]) {
    await assertFails(getDoc(doc(db, "pets/kid1")));
    await assertFails(setDoc(doc(db, "pets/kid1"), { petName: "해킹" }, { merge: true }));
    await assertFails(toggleTask(F, db, D, "kid1", "zz", true));
    await assertFails(getDoc(doc(db, "config/main")));
  }
});
await t("11. 권한: XP 임의 변경 차단", async () => {
  const p = await pet(pc, "kid1");
  await assertFails(setDoc(doc(pc, "pets/kid1"), { totalXp: 9999 }, { merge: true }));
  await assertFails(setDoc(doc(pc, "pets/kid1"), { totalXp: p.totalXp + 10, xpSeq: p.xpSeq + 1, lastXp: { d: D, t: "fake" } }, { merge: true }));
  await assertFails(setDoc(doc(pc, "pets/kid1"), { highestUnlockedStage: 3 }, { merge: true }));
  await assertFails(setDoc(doc(pc, "pets/kid1"), { highestUnlockedStage: 0 }, { merge: true }));  // 단계 하락 금지
  // 지급 기록만 지워서 재지급 노리기
  await assertFails(setDoc(doc(pc, "checks/" + D), { xpAwarded: { s1: false } }, { merge: true }));
  // 체크 안 하고 XP만 +10
  const b = writeBatch(pc);
  b.set(doc(pc, "checks/" + D), { xpAwarded: { fake: "kid1" }, xpLast: { t: "fake", c: "kid1" } }, { merge: true });
  b.set(doc(pc, "pets/kid1"), { totalXp: p.totalXp + 10, xpSeq: p.xpSeq + 1, lastXp: { d: D, t: "fake" }, highestUnlockedStage: p.highestUnlockedStage }, { merge: true });
  await assertFails(b.commit());
  // 지급 기록이 있는 checks 문서 삭제 금지
  const b2 = writeBatch(pc); b2.delete(doc(pc, "checks/" + D)); await assertFails(b2.commit());
  assert.equal((await pet(pc, "kid1")).totalXp, p.totalXp);
});
await t("10. 기존 컬렉션 쓰기(부모 체크·설정·일정·메모) 유지", async () => {
  await assertSucceeds(setDoc(doc(pc, "checks/" + D), { d: D, t2: true }, { merge: true }));
  await assertSucceeds(setDoc(doc(pc, "checks/2026-11-30"), { d: "2026-11-30", t2: true }));
  await assertSucceeds(setDoc(doc(pc, "config/main"), { members: [], tasks: [] }));
  await assertSucceeds(setDoc(doc(pc, "events/e1"), { d: D, t: "x" }));
  await assertSucceeds(setDoc(doc(pc, "memos/m1"), { text: "hi", at: 1 }));
});
await t("8. 서버 연결 불가 → 트랜잭션 unavailable 실패(화면은 되돌리고 오류 토스트)", async () => {
  // disableNetwork()는 트랜잭션 RPC를 막지 못해 닫힌 포트로 실제 연결 실패를 재현
  const dead = getFirestore(initializeApp({ projectId: "demo-family", apiKey: "x" }, "dead"));
  connectFirestoreEmulator(dead, "127.0.0.1", 9);
  await assert.rejects(toggleTask(F, dead, D, "kid1", "net1", true), (e) => e.code === "unavailable");
  assert.equal((await chk(pc)).net1, undefined);
});

await env.cleanup();
console.log("emulator.test OK");
process.exit(0);
