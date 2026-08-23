# 🐍 3D CYBER SNAKE SURVIVAL TETRIS (3D 사이버 뱀 생존 테트리스)

외부 프로그램 설치 없이 웹 브라우저에서 바로 열어서 즐길 수 있는 **Three.js 기반의 3D 자율 이동 뱀 생존 & 4면 회전 타워 테트리스 게임**입니다.

---

## 🌟 이번 신규 업그레이드 핵심 재미 요소

1. **🐍 3D 자율 이동 뱀 캐릭터 (Cyber Snake AI)**
   - 3D 테트리스 보드의 바닥 및 정착된 블록 표면 위를 매 0.35초마다 **스스로 기어 다니며 움직이는 네온 뱀**이 등장합니다.
   - **1칸 점프 이동**: 뱀이 가려는 길 앞에 1칸 높이 차이의 블록이 있으면 깡충 점프하여 넘어갑니다.
   - **2칸 이상 벽 장애물 감지**: 블록 높이 차이가 2칸 이상이면 장애물로 판단하여 스스로 180도 회전하여 도망칩니다.

2. **💥 블록에 깔렸을 때의 찌그러짐 사망 이펙트 (Squished / Crushed)**
   - 플레이어가 떨어뜨리는 테트리스 블록이 뱀의 위치 위로 내려앉거나 깔릴 경우, 뱀 메쉬가 **납작하게 찌그러지며 (Squished Scale 0.1) 파티클 폭발 이펙트**와 함께 사망합니다.
   - 사망 시 **`💥 SNAKE CRUSHED!`** 오디오 효과음 및 알림 배너가 출력되며, 2.5초 후 바닥 무작위 위치에서 뱀이 다시 스폰됩니다.

3. **🏆 뱀 피하기 생존 & 보너스 점수 시스템 (Snake Score)**
   - **실시간 생존 보너스**: 뱀이 무사히 살아있는 동안 매 초마다 `+10pts` 자동 획득!
   - **아슬아슬 피하기 성공 (DODGE!)**: 떨어지는 블록이 뱀 근처(1~2칸 거리)에 착지했지만 뱀이 안 깔리고 살아남으면 **`⚡ SNAKE DODGED! +150pts`** 보너스!
   - **뱀과 함께 라인 클리어**: 뱀이 살아있는 상태에서 라인을 삭제하면 **`🐍 CYBER SNAKE SAVED! +300pts`** 대박 보너스!
   - UI 좌측의 **`SNAKE STATUS`** (`ALIVE 🐍` / `CRUSHED 💥`) 및 **`SNAKE BONUS`** 지표에서 확인 가능합니다.

4. **🌀 5줄마다 3D 카메라 90° 회전 & ⚡ 1줄마다 속도 상승**
   - 5줄 지울 때마다 3D 카메라 90도 회전 (`FRONT 0°` ➔ `RIGHT 90°` ➔ `BACK 180°` ➔ `LEFT 270°`).
   - 1줄 지울 때마다 블록 낙하 속도 약 3%씩 누적 증가.

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

터미널에서 아래 명령어로 서버를 띄우고 접속합니다:

```bash
npm run dev
```
접속 주소: **`http://localhost:8080`**

---

## 🌐 GitHub Pages 무료 배포 방법

```bash
git init
git add .
git commit -m "Update: Add 3D Auto-moving Cyber Snake AI & Survival Dodge Score"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tetris.git
git push -u origin main
```
GitHub 저장소의 **Settings -> Pages -> Source를 [GitHub Actions]** 로 지정하면 배포됩니다.
