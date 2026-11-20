// 픽셀 펫 경험치·성장 계산 (화면·저장소와 무관한 순수 로직)
export const XP_PER_TASK = 10;
export const STAGES = [
  { min: 0,   name: "알" },
  { min: 50,  name: "아기 드래곤" },
  { min: 200, name: "성장 중" },
  { min: 500, name: "완전체" }
];

export function stageOf(xp) {
  let s = 0;
  for (let i = 0; i < STAGES.length; i++) if (xp >= STAGES[i].min) s = i;
  return s;
}

// 화면에 보일 단계: 한 번 도달한 단계는 XP가 줄어도 유지
export function shownStage(pet) {
  return Math.max(stageOf(pet.totalXp || 0), pet.highestUnlockedStage || 0);
}

// 다음 단계까지 남은 XP (완전체면 null)
export function toNext(pet) {
  const next = STAGES[shownStage(pet) + 1];
  return next ? Math.max(next.min - (pet.totalXp || 0), 0) : null;
}

// 현재 단계 안에서의 진행률 0~100
export function stagePct(pet) {
  const s = shownStage(pet), next = STAGES[s + 1];
  if (!next) return 100;
  const lo = STAGES[s].min, xp = pet.totalXp || 0;
  return Math.max(0, Math.min(100, Math.round((xp - lo) / (next.min - lo) * 100)));
}

// 체크(on=true)/해제(on=false) 한 번을 반영한 새 상태. 중복 판단은 호출하는 쪽(지급 기록 존재 여부)이 한다.
export function applyXp(pet, on, amount = XP_PER_TASK) {
  const totalXp = Math.max(0, (pet.totalXp || 0) + (on ? amount : -amount));
  return { totalXp, highestUnlockedStage: Math.max(pet.highestUnlockedStage || 0, stageOf(totalXp)) };
}

// 루틴 체크/해제 1회를 한 트랜잭션으로 저장: checks/{date}의 체크 상태 + 지급 기록(xpAwarded) + pets/{childId}.
// 지급 기록이 이미 원하는 상태면 XP는 건드리지 않음 → 중복 클릭·여러 기기 동시 변경에도 XP는 정확히 한 번.
// F = { doc, runTransaction } (브라우저는 CDN 모듈, 테스트는 npm 모듈을 넘김)
export function toggleTask(F, fs, date, childId, taskId, on) {
  const cr = F.doc(fs, "checks/" + date), pr = F.doc(fs, "pets/" + childId);
  return F.runTransaction(fs, async (tx) => {
    const [c, p] = await Promise.all([tx.get(cr), tx.get(pr)]);
    const awarded = ((c.exists() && c.data().xpAwarded) || {})[taskId] === childId;
    if (awarded === on) { tx.set(cr, { d: date, [taskId]: on }, { merge: true }); return null; }
    const now = Date.now();
    const before = p.exists() ? p.data() : { childId, petId: "dragon", petName: "", totalXp: 0, highestUnlockedStage: 0, createdAt: now };
    const after = { ...before, ...applyXp(before, on), xpSeq: (before.xpSeq || 0) + 1, lastXp: { d: date, t: taskId }, updatedAt: now };
    tx.set(cr, { d: date, [taskId]: on, xpAwarded: { [taskId]: on ? childId : false }, xpLast: { t: taskId, c: childId } }, { merge: true });
    tx.set(pr, after);
    return { before, after };
  });
}
