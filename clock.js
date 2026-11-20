// 레트로 픽셀 시계: 서울 시간 계산·테마·읽기 문장 (화면과 무관한 순수 로직)
const FMT = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric",
  weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" });
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 기기 시계(UTC 기준 순간)를 서울 벽시계로. 기기 시간 자체가 틀리면 그만큼 틀림.
export function seoul(d = new Date()) {
  const p = {};
  for (const x of FMT.formatToParts(d)) p[x.type] = x.value;
  return { y: +p.year, mo: +p.month, d: +p.day, dow: WD.indexOf(p.weekday), h: +p.hour % 24, mi: +p.minute };
}

export const THEMES = {
  morning: { name: "아침", msg: "좋은 아침!" },
  day:     { name: "낮",   msg: "즐거운 하루!" },
  evening: { name: "저녁", msg: "오늘도 수고했어!" },
  night:   { name: "밤",   msg: "편안한 밤 보내!" }
};
export function themeOf(h) {
  return h >= 6 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 20 ? "evening" : "night";
}

export const hhmm = (h, m) => String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");

// 08:30 → "오전 8시 30분", 00:00 → "오전 12시", 12:00 → "오후 12시"
export function readKo(h, m) {
  return (h < 12 ? "오전 " : "오후 ") + (h % 12 || 12) + "시" + (m ? " " + m + "분" : "");
}

// 12시 방향 0°, 시계 방향. 시침은 분에 따라 조금씩 이동
export function handDeg(h, m) {
  return { h: (h % 12) * 30 + m / 2, m: m * 6 };
}
