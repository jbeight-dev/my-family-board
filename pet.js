// 픽셀 펫 경험치·성장 계산 (화면·저장소와 무관한 순수 로직)
export const XP_PER_TASK = 10;
export const STAGES = [
  { min: 0,   name: "알" },
  { min: 50,  name: "아기 펫" },
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

// 지급 기록 문서 id: 날짜·아이·아침/저녁·작업이 같으면 같은 id → 중복 지급 불가
export function xpKey(date, childId, slot, taskId) {
  return [date, childId, slot, taskId].join("_");
}
