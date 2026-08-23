/**
 * ==========================================================================
 * CYBERPUNK NEON TETRIS - MAIN GAME ENGINE (메인 게임 로직)
 * 7-Bag 시스템, SRS 회전, 파티클 이펙트, Ghost piece, 홀드 및 Next 3개 지원
 * ==========================================================================
 */

// 1. 테트리스 게임 상수 선언
const COLS = 10; // 보드 가로 칸 수
const ROWS = 20; // 보드 세로 칸 수
const BLOCK_SIZE = 30; // 블록 1개의 픽셀 크기 (30px * 10 = 300px)

// 2. 테트리스 7종 블록(Tetromino) 형상 및 사이버 네온 색상 정의
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0ff', // 시안 (Neon Cyan)
    glow: 'rgba(0, 240, 255, 0.8)'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0066ff', // 블루 (Neon Blue)
    glow: 'rgba(0, 102, 255, 0.8)'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff6600', // 오렌지 (Neon Orange)
    glow: 'rgba(255, 102, 0, 0.8)'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#ffe600', // 옐로우 (Neon Yellow)
    glow: 'rgba(255, 230, 0, 0.8)'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00ff66', // 그린 (Neon Green)
    glow: 'rgba(0, 255, 102, 0.8)'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#aa00ff', // 퍼플 (Neon Purple)
    glow: 'rgba(170, 0, 255, 0.8)'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff007f', // 마젠타/핑크 (Neon Magenta)
    glow: 'rgba(255, 0, 127, 0.8)'
  }
};

// 3. 메인 게임 클래스 (Game Engine)
class TetrisGame {
  constructor() {
    // 캔버스 요소 가져오기
    this.canvas = document.getElementById('tetris-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Hold 및 Next 캔버스
    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas.getContext('2d');

    this.next1Canvas = document.getElementById('next1-canvas');
    this.next1Ctx = this.next1Canvas.getContext('2d');
    this.next2Canvas = document.getElementById('next2-canvas');
    this.next2Ctx = this.next2Canvas.getContext('2d');
    this.next3Canvas = document.getElementById('next3-canvas');
    this.next3Ctx = this.next3Canvas.getContext('2d');

    // HTML DOM UI 엘리먼트
    this.scoreDisplay = document.getElementById('score-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.levelDisplay = document.getElementById('level-display');
    this.linesDisplay = document.getElementById('lines-display');

    // 모달 오버레이
    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.finalScoreText = document.getElementById('final-score');
    this.newHighScoreMsg = document.getElementById('new-high-score-msg');

    // 게임 변수 초기화
    this.grid = this.createGrid();
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('tetris_high_score')) || 0;
    this.level = 1;
    this.lines = 0;
    this.combo = 0;
    
    this.bag = [];
    this.currentPiece = null;
    this.nextQueue = [];
    this.holdPiece = null;
    this.canHold = true;

    this.particles = []; // 라인 삭제 파티클 이펙트 저장 배열

    // 루프 및 상태 관련
    this.dropCounter = 0;
    this.dropInterval = 1000; // 낙하 속도 (밀리초)
    this.lastTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isPlaying = false;

    // 최고 점수 표시 업데이트
    this.highScoreDisplay.textContent = this.highScore;

    // 이벤트 리스너 등록
    this.bindEvents();
  }

  // 10x20 보드 배열 생성 (0: 빈 칸, 객체: 픽셀 정보)
  createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  // 7-Bag 시스템: 7개 종류의 블록을 무작위 순서로 섞어 공급
  generateBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    // 피셔-예이츠 셔플 알고리즘
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }

  // 다음 블록 가져오기
  getNextPieceType() {
    if (this.bag.length === 0) {
      this.bag = this.generateBag();
    }
    return this.bag.pop();
  }

  // 새 피스 생성
  spawnPiece() {
    // 큐에서 새 피스 꺼내기
    while (this.nextQueue.length < 4) {
      this.nextQueue.push(this.getNextPieceType());
    }

    const type = this.nextQueue.shift();
    const tetromino = TETROMINOES[type];

    this.currentPiece = {
      type: type,
      shape: tetromino.shape.map(row => [...row]),
      color: tetromino.color,
      glow: tetromino.glow,
      x: Math.floor(COLS / 2) - Math.ceil(tetromino.shape[0].length / 2),
      y: 0
    };

    this.canHold = true; // 홀드 기회 리셋

    // 생성 직후 충돌 검사 -> 충돌 시 게임 오버
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.gameOver();
    }
  }

  // 충돌 검사 (벽 또는 기존 정착 블록과의 충돌 여부)
  checkCollision(offsetX, offsetY, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = offsetX + c;
          const newY = offsetY + r;

          // 보드 좌우/하단 경과 검사
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          // 천장 위는 무시, 보드 내부의 기존 정착 블록과 충돌 검사
          if (newY >= 0 && this.grid[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // 피스 이동 (좌, 우, 아래)
  move(dirX, dirY) {
    if (!this.isPlaying || this.isPaused || this.isGameOver) return false;

    const newX = this.currentPiece.x + dirX;
    const newY = this.currentPiece.y + dirY;

    if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      if (dirX !== 0) audioManager.playMove();
      return true;
    } else if (dirY > 0) {
      // 아래로 이동 중 충돌 발생 시 블록 고정 (Lock)
      this.lockPiece();
    }
    return false;
  }

  // 소프트 드롭 (아래로 빠른 이동)
  softDrop() {
    if (this.move(0, 1)) {
      this.score += 1;
      this.updateScoreUI();
    }
  }

  // 하드 드롭 (순식간에 바닥까지 떨어뜨림)
  hardDrop() {
    if (!this.isPlaying || this.isPaused || this.isGameOver) return;

    let dropDistance = 0;
    while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      dropDistance++;
    }
    this.score += dropDistance * 2;
    this.updateScoreUI();
    audioManager.playDrop();
    this.lockPiece();
  }

  // 회전 (시계 방향 / 반시계 방향)
  rotate(dir = 1) {
    if (!this.isPlaying || this.isPaused || this.isGameOver) return;

    const shape = this.currentPiece.shape;
    const N = shape.length;
    // 매트릭스 회전 계산
    const rotated = Array.from({ length: N }, () => Array(N).fill(0));

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (dir === 1) {
          rotated[c][N - 1 - r] = shape[r][c]; // 시계 방향
        } else {
          rotated[N - 1 - c][r] = shape[r][c]; // 반시계 방향
        }
      }
    }

    // 회전 후 충돌 발생 시 SRS Kick 테스트 (좌우 밀기 처리)
    const kicks = [0, 1, -1, 2, -2];
    for (let kick of kicks) {
      if (!this.checkCollision(this.currentPiece.x + kick, this.currentPiece.y, rotated)) {
        this.currentPiece.x += kick;
        this.currentPiece.shape = rotated;
        audioManager.playRotate();
        return;
      }
    }
  }

  // Hold (블록 교체) 기능
  hold() {
    if (!this.isPlaying || this.isPaused || this.isGameOver || !this.canHold) return;

    audioManager.playMove();

    if (!this.holdPiece) {
      this.holdPiece = this.currentPiece.type;
      this.spawnPiece();
    } else {
      const temp = this.currentPiece.type;
      this.currentPiece.type = this.holdPiece;
      this.holdPiece = temp;

      const tetromino = TETROMINOES[this.currentPiece.type];
      this.currentPiece.shape = tetromino.shape.map(row => [...row]);
      this.currentPiece.color = tetromino.color;
      this.currentPiece.glow = tetromino.glow;
      this.currentPiece.x = Math.floor(COLS / 2) - Math.ceil(tetromino.shape[0].length / 2);
      this.currentPiece.y = 0;
    }

    this.canHold = false; // 한 라운드 중복 홀드 방지
    this.drawHoldPreview();
  }

  // 블록 보드에 고정 (Lock Piece)
  lockPiece() {
    const { shape, x, y, color, glow } = this.currentPiece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardY = y + r;
          const boardX = x + c;

          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            this.grid[boardY][boardX] = { color, glow };
          }
        }
      }
    }

    // 라인 삭제 검사
    this.clearLines();
    
    // 다음 피스 스폰
    this.spawnPiece();
    this.drawNextPreviews();
    this.drawHoldPreview();
  }

  // 완성된 라인 지우기 및 점수/레벨 계산
  clearLines() {
    let linesCleared = 0;
    const clearedRows = [];

    for (let r = ROWS - 1; r >= 0; r--) {
      // 행의 모든 칸이 채워져 있는지 확인
      if (this.grid[r].every(cell => cell !== 0)) {
        linesCleared++;
        clearedRows.push(r);
        
        // 라인 삭제 시 파티클 폭발 이펙트 생성
        for (let c = 0; c < COLS; c++) {
          const cellColor = this.grid[r][c].color;
          this.createParticles(c * BLOCK_SIZE + BLOCK_SIZE / 2, r * BLOCK_SIZE + BLOCK_SIZE / 2, cellColor);
        }

        // 행 제거 및 맨 위에 빈 행 추가
        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(0));
        r++; // 행 순서 조정
      }
    }

    if (linesCleared > 0) {
      // 콤보 계산
      this.combo++;

      // 점수 테이블 (1줄: 100, 2줄: 300, 3줄: 500, 4줄 Tetris: 800)
      const baseScores = [0, 100, 300, 500, 800];
      let gainedScore = baseScores[linesCleared] * this.level;
      if (this.combo > 1) {
        gainedScore += (this.combo - 1) * 50 * this.level; // 콤보 보너스
      }

      this.score += gainedScore;
      this.lines += linesCleared;

      // 오디오 효과음 재생
      if (linesCleared === 4) {
        audioManager.playTetris();
      } else {
        audioManager.playClear();
      }

      // 10줄 지울 때마다 레벨업
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        // 낙하 속도 증가 (최저 100ms)
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
      }

      this.updateScoreUI();
    } else {
      this.combo = 0; // 콤보 리셋
    }
  }

  // 라인 지우기 파티클 방출 함수
  createParticles(x, y, color) {
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        color: color,
        alpha: 1,
        life: Math.random() * 20 + 20
      });
    }
  }

  // 파티클 업데이트 및 렌더링
  updateAndDrawParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 1 / p.life;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
      this.ctx.restore();
    }
  }

  // Ghost Piece (하드드롭 예상 착지 지점) Y 좌표 계산
  getGhostY() {
    if (!this.currentPiece) return 0;
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
      ghostY++;
    }
    return ghostY;
  }

  // 메인 렌더링 루프
  draw() {
    // 1. 메인 보드 배경 클리어
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 격자 배경 가이드 라인 긋기
    this.drawGridLines();

    // 2. 보드 정착된 블록들 렌더링
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] !== 0) {
          const { color, glow } = this.grid[r][c];
          this.drawBlock(this.ctx, c, r, color, glow);
        }
      }
    }

    // 3. Ghost Piece (착지 가이드) 렌더링
    if (this.currentPiece && this.isPlaying && !this.isGameOver) {
      const ghostY = this.getGhostY();
      const { shape, x, color } = this.currentPiece;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            this.drawGhostBlock(this.ctx, x + c, ghostY + r, color);
          }
        }
      }

      // 4. 현재 조종 중인 테트리스 블록 렌더링
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            this.drawBlock(this.ctx, x + c, this.currentPiece.y + r, color, this.currentPiece.glow);
          }
        }
      }
    }

    // 5. 파티클 이펙트 렌더링
    this.updateAndDrawParticles();
  }

  // 보드 백그라운드 구획 선 (그리드)
  drawGridLines() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    for (let c = 0; c <= COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * BLOCK_SIZE, 0);
      this.ctx.lineTo(c * BLOCK_SIZE, this.canvas.height);
      this.ctx.stroke();
    }

    for (let r = 0; r <= ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * BLOCK_SIZE);
      this.ctx.lineTo(this.canvas.width, r * BLOCK_SIZE);
      this.ctx.stroke();
    }
  }

  // 일반 블록 그리기 (네온 서광 효과)
  drawBlock(ctx, x, y, color, glowColor, size = BLOCK_SIZE) {
    const px = x * size;
    const py = y * size;

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = glowColor || color;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

    // 블록 내부 베벨 경사 입체감
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(px + 1, py + 1, size - 2, 3);
    ctx.fillRect(px + 1, py + 1, 3, size - 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
    ctx.fillRect(px + size - 4, py + 1, 3, size - 2);

    ctx.restore();
  }

  // Ghost Block 그리기 (투명한 네온 테두리)
  drawGhostBlock(ctx, x, y, color) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.strokeRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
    ctx.restore();
  }

  // Next 블록 3개 프리뷰 렌더링
  drawNextPreviews() {
    const canvases = [
      { ctx: this.next1Ctx, canvas: this.next1Canvas },
      { ctx: this.next2Ctx, canvas: this.next2Canvas },
      { ctx: this.next3Ctx, canvas: this.next3Canvas }
    ];

    canvases.forEach(({ ctx, canvas }, index) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pieceType = this.nextQueue[index];
      if (pieceType) {
        this.drawMiniPreview(ctx, canvas, pieceType);
      }
    });
  }

  // Hold 블록 프리뷰 렌더링
  drawHoldPreview() {
    this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    if (this.holdPiece) {
      this.drawMiniPreview(this.holdCtx, this.holdCanvas, this.holdPiece);
    }
  }

  // 서브 미니 캔버스용 프리뷰 그리기
  drawMiniPreview(ctx, canvas, type) {
    const tetromino = TETROMINOES[type];
    const shape = tetromino.shape;
    const miniSize = Math.floor(canvas.width / 5);

    const offsetX = (canvas.width - shape[0].length * miniSize) / 2;
    const offsetY = (canvas.height - shape.length * miniSize) / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          ctx.save();
          ctx.shadowBlur = 6;
          ctx.shadowColor = tetromino.glow;
          ctx.fillStyle = tetromino.color;
          ctx.fillRect(offsetX + c * miniSize + 1, offsetY + r * miniSize + 1, miniSize - 2, miniSize - 2);
          ctx.restore();
        }
      }
    }
  }

  // UI 스코어 및 레벨 정보 업데이트
  updateScoreUI() {
    this.scoreDisplay.textContent = this.score;
    this.levelDisplay.textContent = this.level;
    this.linesDisplay.textContent = this.lines;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreDisplay.textContent = this.highScore;
      localStorage.setItem('tetris_high_score', this.highScore);
    }
  }

  // 게임 메인 루프 (RequestAnimationFrame)
  update(time = 0) {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (this.isPlaying && !this.isPaused && !this.isGameOver) {
      this.dropCounter += deltaTime;
      if (this.dropCounter > this.dropInterval) {
        this.move(0, 1);
        this.dropCounter = 0;
      }
    }

    this.draw();
    requestAnimationFrame(this.update.bind(this));
  }

  // 게임 시작
  start() {
    this.grid = this.createGrid();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = 0;
    this.dropInterval = 1000;
    this.bag = [];
    this.nextQueue = [];
    this.holdPiece = null;
    this.canHold = true;

    this.isPaused = false;
    this.isGameOver = false;
    this.isPlaying = true;

    this.updateScoreUI();
    this.spawnPiece();
    this.drawNextPreviews();
    this.drawHoldPreview();

    // 모달 오버레이 숨기기
    this.startOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameoverOverlay.classList.add('hidden');

    // BGM 자동 시작
    audioManager.startBGM();
  }

  // 게임 일시정지 / 재개
  togglePause() {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.pauseOverlay.classList.remove('hidden');
      audioManager.stopBGM();
    } else {
      this.pauseOverlay.classList.add('hidden');
      audioManager.startBGM();
    }
  }

  // 게임 오버
  gameOver() {
    this.isGameOver = true;
    this.isPlaying = false;

    audioManager.stopBGM();
    audioManager.playGameOver();

    this.finalScoreText.textContent = this.score;

    if (this.score >= this.highScore && this.score > 0) {
      this.newHighScoreMsg.classList.remove('hidden');
    } else {
      this.newHighScoreMsg.classList.add('hidden');
    }

    this.gameoverOverlay.classList.remove('hidden');
  }

  // 키보드 및 이벤트 리스너 바인딩
  bindEvents() {
    // 키보드 조작 이벤트
    document.addEventListener('keydown', (e) => {
      // 화살표 방향키 등으로 브라우저 스크롤되는 현상 방지
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (this.isGameOver) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.move(-1, 0);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.move(1, 0);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.softDrop();
          break;
        case 'Space':
          this.hardDrop();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyX':
          this.rotate(1); // 시계 방향
          break;
        case 'KeyZ':
        case 'ControlLeft':
        case 'ControlRight':
          this.rotate(-1); // 반시계 방향
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.hold();
          break;
        case 'KeyP':
        case 'Escape':
          this.togglePause();
          break;
      }
    });

    // 버튼 이벤트 연결
    document.getElementById('start-btn').addEventListener('click', () => this.start());
    document.getElementById('restart-btn').addEventListener('click', () => this.start());
    document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
    document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());

    // 사운드 토글 버튼
    const soundBtn = document.getElementById('sound-btn');
    soundBtn.addEventListener('click', () => {
      const isEnabled = audioManager.toggleSound();
      soundBtn.textContent = isEnabled ? '🔊 BGM ON' : '🔇 BGM OFF';
    });

    // 모바일 터치 온스크린 버튼 이벤트 연결
    document.getElementById('btn-left').addEventListener('click', () => this.move(-1, 0));
    document.getElementById('btn-right').addEventListener('click', () => this.move(1, 0));
    document.getElementById('btn-down').addEventListener('click', () => this.softDrop());
    document.getElementById('btn-hard-drop').addEventListener('click', () => this.hardDrop());
    document.getElementById('btn-rotate-cw').addEventListener('click', () => this.rotate(1));
    document.getElementById('btn-rotate-ccw').addEventListener('click', () => this.rotate(-1));
    document.getElementById('btn-hold').addEventListener('click', () => this.hold());
  }
}

// 브라우저 DOM 로드 완료 시 게임 인스턴스 생성 및 프레임 매니저 실행
window.addEventListener('DOMContentLoaded', () => {
  const game = new TetrisGame();
  game.update();
});
