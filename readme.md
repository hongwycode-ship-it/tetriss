# 🎮 사이버펑크 네온 웹 테트리스 (CYBERPUNK TETRIS)

외부 프로그램 설치나 복잡한 설정 없이, 웹 브라우저에서 바로 열어서 즐길 수 있는 **사이버펑크 스타일의 모던 테트리스 게임**입니다.

---

## 🌟 주요 특징 및 기능

1. **🎨 비주얼 테마 (Cyberpunk Neon Glow)**
   - 어두운 사이버 공간 느낌의 배경과 화려한 네온 컬러 체계
   - 라인 삭제 시 방출되는 **파티클(Particle) 폭발 이펙트**
   - 현재 블록의 예측 착지 위치를 보여주는 **Ghost Piece 가이드라인**

2. **🕹️ 모던 테트리스 규칙 스펙**
   - **7-Bag 무작위 시퀀서**: 표준 7개 블록이 균등하게 무작위 출현
   - **Hold 기능**: 급할 때 블록을 보관하고 원할 때 교체 (`Shift` / `C` 키)
   - **Next 3개 미리보기**: 다음에 떨어질 블록 3개를 미리 확인하고 전략 수립
   - **SRS (Super Rotation System) Wall Kick**: 벽에 닿았을 때 부드럽게 회전
   - **콤보 및 보너스 점수 시스템**: 연속 줄 삭제 시 콤보 점수 증폭
   - **레벨업 시스템**: 10줄을 삭제할 때마다 레벨이 오르며 블록 낙하 속도 증가

3. **🔊 브라우저 오디오 엔진 (Web Audio API)**
   - MP3 파일 없이 웹 브라우저가 사운드를 직접 신디사이저로 합성
   - 이동, 회전, 하드드롭, 라인 삭제, 테트리스 4줄 삭제, 게임오버 및 **사이버 BGM 멜로디** 지원

4. **📱 모바일 / 태블릿 온스크린 버튼 지원**
   - 화면 크기가 작은 스마트폰이나 터치 기기에서도 화면 하단의 네온 버튼으로 플레이 가능

5. **💾 기록 자동 저장**
   - `LocalStorage`를 이용해 최고 점수(High Score)를 자동으로 기록하고 보존

---

## 🎮 조작법 (Controls)

| 동작 | 키보드 입력 | 모바일 터치 패드 |
| :--- | :--- | :--- |
| **좌 / 우 이동** | `←` / `→` 또는 `A` / `D` | `◀` / `▶` 버튼 |
| **소프트 드롭** | `↓` 또는 `S` | `▼` 버튼 |
| **하드 드롭** | `Space` (스페이스바) | `DROP` 버튼 |
| **시계방향 회전** | `↑` / `W` / `X` | `↻` 버튼 |
| **반시계방향 회전**| `Z` / `Ctrl` | `↺` 버튼 |
| **블록 보관(Hold)**| `C` / `Shift` | `HOLD` 버튼 |
| **일시정지(Pause)**| `P` / `Esc` | 상단 `PAUSE` 버튼 |
| **소리 켜기/끄기** | - | 상단 `BGM ON/OFF` 버튼 |

---

## 💻 로컬 서버 실행 방법 (localhost)

프로젝트 폴더 터미널에서 다음 명령어를 실행하면 `localhost:3000` 주소로 개발 서버가 실행됩니다:

```bash
npm run dev
```
실행 후 브라우저 주소창에 `http://localhost:3000` 을 입력하여 접속할 수 있습니다.

---

## 🌐 GitHub Pages로 무료 배포하는 방법 (온라인 접속용)

이 프로젝트는 `.github/workflows/deploy.yml` 파일이 포함되어 있어, GitHub 레포지토리에 올려두기만 하면 무료로 웹사이트 주소가 생깁니다!

### 1단계: Git 저장소 초기화 및 커밋
터미널에서 아래 명령어들을 순서대로 실행합니다:

```bash
# 1. git 저장소 생성
git init

# 2. 모든 파일 추가 및 첫 커밋
git add .
git commit -m "Initial commit: Cyberpunk Tetris Game"
```

### 2단계: GitHub 저장소(Repository) 생성 및 연결
1. [GitHub 홈페이지](https://github.com)에 로그인 후, 우측 상단 **[ + ] -> [New repository]** 클릭
2. Repository name에 `tetris` 입력 후 **[Create repository]** 버튼 클릭
3. 생성된 화면에 표시되는 주소를 복사하여 터미널에 입력 (아래 `YOUR_USERNAME`을 본인 계정명으로 변경):

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tetris.git
git push -u origin main
```

### 3단계: GitHub Pages 활성화
1. GitHub 저장소 페이지 상단의 **[Settings]** 탭 클릭
2. 좌측 메뉴에서 **[Pages]** 클릭
3. **Build and deployment** 항목의 **Source**를 **[GitHub Actions]** 로 변경
4. 커밋이 push될 때마다 몇 초 뒤 `https://YOUR_USERNAME.github.io/tetris/` 주소로 게임이 무료 배포됩니다!

---

## 📁 프로젝트 코드 구조 안내

- [`index.html`](file:///c:/codes/tetriss/index.html): 게임 메인 레이아웃 및 캔버스 요소
- [`style.css`](file:///c:/codes/tetriss/style.css): 사이버펑크 네온 비주얼 및 글래스모피즘 CSS
- [`audio.js`](file:///c:/codes/tetriss/audio.js): Web Audio API 사운드합성 오디오 모듈
- [`tetris.js`](file:///c:/codes/tetriss/tetris.js): 테트리스 게임 엔진 & 알고리즘
- [`.github/workflows/deploy.yml`](file:///c:/codes/tetriss/.github/workflows/deploy.yml): GitHub Pages 자동 배포 워크플로우
