// ① Firebase 콘솔 → 프로젝트 설정 → 일반 → 내 앱(웹 </>)에 나오는 firebaseConfig 값을 그대로 붙여 넣으세요.
//    이 값은 공개되어도 괜찮아요. 실제 보호는 Firestore 규칙(firestore.rules)이 해 줍니다.
export const firebaseConfig = {
  apiKey: "AIzaSyBiIH7Ftdb2caHvM75Pl3PUXpDikHKw2zw",
  authDomain: "my-family-board-2dc7c.firebaseapp.com",
  projectId: "my-family-board-2dc7c",
  storageBucket: "my-family-board-2dc7c.firebasestorage.app",
  messagingSenderId: "1011047552022",
  appId: "1:1011047552022:web:72b4e5daa73465ece99137"
};

// ② 날씨 지역 (Open-Meteo, 키 필요 없음). 이사하면 위도·경도만 바꾸세요.
export const WEATHER = {
  name: "서울 광진구",
  lat: 37.5385,
  lon: 127.0823
};
