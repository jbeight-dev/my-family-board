// 실행: node clock.test.mjs
import assert from "node:assert/strict";
import { seoul, themeOf, hhmm, readKo, handDeg } from "./clock.js";

// 기기 시간대와 무관하게 서울 기준 (UTC 2026-11-20 23:35 = 서울 11/21 토 08:35)
assert.deepEqual(seoul(new Date(Date.UTC(2026, 10, 20, 23, 35))), { y: 2026, mo: 11, d: 21, dow: 6, h: 8, mi: 35 });
assert.deepEqual(seoul(new Date(Date.UTC(2026, 10, 20, 15, 0))), { y: 2026, mo: 11, d: 21, dow: 6, h: 0, mi: 0 });   // 자정 = 0시
assert.equal(seoul(new Date(Date.UTC(2026, 11, 31, 15, 0))).y, 2027);                                                     // 연도 넘김

const th = (h) => themeOf(h);
assert.equal(th(5), "night"); assert.equal(th(6), "morning"); assert.equal(th(10), "morning");
assert.equal(th(11), "day"); assert.equal(th(16), "day"); assert.equal(th(17), "evening");
assert.equal(th(19), "evening"); assert.equal(th(20), "night"); assert.equal(th(0), "night");

assert.equal(hhmm(8, 5), "08:05"); assert.equal(hhmm(21, 45), "21:45"); assert.equal(hhmm(0, 0), "00:00");
assert.equal(readKo(8, 0), "오전 8시"); assert.equal(readKo(8, 30), "오전 8시 30분");
assert.equal(readKo(15, 15), "오후 3시 15분"); assert.equal(readKo(21, 45), "오후 9시 45분");
assert.equal(readKo(0, 0), "오전 12시"); assert.equal(readKo(12, 0), "오후 12시"); assert.equal(readKo(12, 5), "오후 12시 5분");

assert.deepEqual(handDeg(3, 0), { h: 90, m: 0 });
assert.deepEqual(handDeg(8, 30), { h: 255, m: 180 });     // 8시 반: 시침은 8과 9 사이
assert.deepEqual(handDeg(15, 15), { h: 97.5, m: 90 });
assert.deepEqual(handDeg(12, 0), { h: 0, m: 0 });
console.log("clock.test OK");
