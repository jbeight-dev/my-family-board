# 우리 가족 할 일 대시보드 (GitHub Pages + Firebase)

태블릿 브라우저에서 쓰는 가족 대시보드예요. 아침·저녁 할 일 체크, 날씨, 가족 일정·달력, 메모가 들어 있어요.
체크·일정·메모는 Firebase(Firestore)에 저장돼서 여러 기기에서 바로 똑같이 보여요. 날씨는 Open-Meteo에서 30분마다 새로 불러와요(키 필요 없음).

## 파일 구성

| 파일 | 설명 |
| --- | --- |
| `index.html` | 대시보드 본체 |
| `firebase-config.js` | Firebase 설정값과 날씨 지역 (직접 채워야 해요) |
| `firestore.rules` | 가족 계정만 읽고 쓰게 하는 보안 규칙 |
| `fonts/` | 갈무리 도트 글꼴 (OFL 라이선스, `fonts/LICENSE.txt`) |

---

## 1. Firebase 프로젝트 만들기 (약 10분)

1. https://console.firebase.google.com 에 구글 계정으로 들어가 **프로젝트 추가**를 눌러요. 이름은 예를 들어 `family-dashboard`로 지어요. Google 애널리틱스는 꺼도 돼요.
2. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
   - 위치: `asia-northeast3 (서울)`
   - **프로덕션 모드**로 시작
3. 왼쪽 메뉴 **빌드 → Authentication → 시작하기 → 로그인 방법**에서 **Google**을 사용 설정으로 바꾸고 저장해요.

## 2. 설정값 넣기

1. Firebase 콘솔 **⚙️ 프로젝트 설정 → 일반 → 내 앱**에서 웹 아이콘 `</>`을 눌러 앱을 등록해요. 호스팅 설정은 체크하지 않아요.
2. 화면에 나오는 `firebaseConfig = { ... }` 값을 `firebase-config.js`의 같은 자리에 붙여 넣어요.
3. 날씨 지역을 바꾸려면 같은 파일의 `WEATHER`에서 위도·경도를 고쳐요.

## 3. 보안 규칙 넣기 (꼭 하세요)

1. `firestore.rules`를 열어 `dad@gmail.com`, `mom@gmail.com`을 **실제로 로그인할 가족 구글 계정**으로 바꿔요. 태블릿 전용 계정이 있다면 함께 넣어요.
2. Firebase 콘솔 **Firestore Database → 규칙** 탭에 파일 내용을 통째로 붙여 넣고 **게시**를 눌러요.

이 규칙 덕분에 웹 주소를 아는 사람이 있어도 목록에 없는 계정은 아무것도 보거나 바꿀 수 없어요.

## 4. GitHub에 올리기

1. GitHub에서 새 저장소를 만들어요. 예: `family-dashboard`, Public.
2. 이 폴더의 파일을 모두 올려요. `fonts` 폴더도 함께 올려야 해요.
   - 웹에서 올릴 때: 저장소 → **Add file → Upload files** → 파일과 폴더를 끌어다 놓기 → **Commit changes**
3. 저장소 **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / **/(root)** → **Save**
4. 1~2분 뒤 `https://아이디.github.io/family-dashboard/` 주소가 생겨요.

## 5. 로그인 허용 도메인 추가

Firebase 콘솔 **Authentication → 설정 → 승인된 도메인 → 도메인 추가**에 `아이디.github.io`를 넣어요.
이걸 빠뜨리면 구글 로그인 창이 `auth/unauthorized-domain` 오류로 닫혀요.

## 6. 태블릿에서 쓰기

1. 태블릿 브라우저로 주소를 열고 **▶ 가족 구글 계정으로 시작**을 눌러 로그인해요. 한 번 로그인하면 계속 유지돼요.
2. 처음 로그인하면 기본 할 일 목록이 자동으로 만들어져요. 이후에는 ✏️ 편집에서 바꿔요.
3. 브라우저 메뉴의 **홈 화면에 추가**를 쓰면 앱처럼 전체 화면으로 열 수 있어요.

---

## 자주 겪는 문제

- **"firebase-config.js에 Firebase 설정값을 넣어 주세요"가 나와요:** 2단계 값이 아직 `YOUR_...`로 남아 있어요.
- **"이 계정은 허용되지 않았어요"가 나와요:** `firestore.rules`의 이메일 목록에 그 계정을 넣고 다시 게시하세요.
- **로그인 창이 바로 닫혀요:** 5단계의 승인된 도메인을 확인하세요.
- **파일을 고쳤는데 그대로예요:** GitHub Pages 반영에 1~2분 걸려요. 브라우저를 새로고침하세요.

## 비용

가족 4명이 쓰는 정도는 Firebase 무료(Spark) 요금제 한도 안에 넉넉히 들어가요. Open-Meteo 날씨도 비상업적 사용은 무료예요.
