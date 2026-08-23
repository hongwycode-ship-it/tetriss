/**
 * ==========================================================================
 * CYBERPUNK 3D TETRIS - MAIN ENGINE (Three.js 기반 3D 입체 테트리스)
 * - Three.js 3D 공간 렌더링
 * - 🐍 3D 자율 이동 뱀(Cyber Snake) 캐릭터 AI (1칸 점프, 깔림 사망, 피하기 점수)
 * - 5줄 지울 때마다 3D 타워 90도 카메라 회전 (4면 뷰포트 전환)
 * - 한 줄(1 라인) 지울 때마다 낙하 속도 즉시 증가 시스템
 * ==========================================================================
 */

// 1. 테트리스 게임 상수 선언
const COLS = 10;
const ROWS = 20;

// 2. 테트리스 7종 블록(Tetromino) 및 3D 사이버 헥스 컬러 정의
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 0x00f0ff,
    hexStr: '#00f0ff'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 0x0066ff,
    hexStr: '#0066ff'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 0xff6600,
    hexStr: '#ff6600'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 0xffe600,
    hexStr: '#ffe600'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 0x00ff66,
    hexStr: '#00ff66'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 0xaa00ff,
    hexStr: '#aa00ff'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 0xff007f,
    hexStr: '#ff007f'
  }
};

// 🐍 3. 3D 자율 이동 뱀 (Cyber Snake 3D) 클래스
class CyberSnake3D {
  constructor(game) {
    this.game = game;

    // 뱀 마디 데이터 (마디 4개)
    this.segmentCount = 4;
    this.segments = []; // { x, y } 2D 보드 좌표 배열

    this.dirX = 1; // 1: 우측 이동, -1: 좌측 이동
    this.isDead = false;
    this.moveTimer = 0;
    this.moveInterval = 350; // 0.35초마다 1칸 이동

    this.snakeGroup = new THREE.Group();
    this.game.scene.add(this.snakeGroup);

    this.respawnTimer = null;

    // 초기 뱀 위치 스폰
    this.spawn();
  }

  // 뱀 3D 메쉬 생성 및 스폰
  spawn() {
    this.isDead = false;
    this.dirX = Math.random() > 0.5 ? 1 : -1;

    // 바닥 행(ROWS - 1) 무작위 컬럼에서 시작
    const startX = Math.floor(Math.random() * (COLS - 3)) + 1;
    const startY = this.game.getTopRowAt(startX);

    this.segments = [];
    for (let i = 0; i < this.segmentCount; i++) {
      this.segments.push({ x: startX, y: startY });
    }

    // 이전 3D 메쉬 제거
    while (this.snakeGroup.children.length > 0) {
      const obj = this.snakeGroup.children[0];
      this.snakeGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }

    // 마디별 3D 구체(Sphere) 메쉬 생성
    this.meshList = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const radius = i === 0 ? 0.42 : 0.32 - i * 0.04; // 머리가 제일 큼
      const geom = new THREE.SphereGeometry(radius, 14, 14);
      const colorHex = i === 0 ? 0x00ff66 : 0xccff00; // 머리는 네온그린, 몸통은 연두색
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        roughness: 0.2
      });

      const mesh = new THREE.Mesh(geom, mat);
      this.snakeGroup.add(mesh);
      this.meshList.push(mesh);
    }

    this.update3DPosition();
    this.game.updateSnakeUI(true);
  }

  // 3D 공간 상의 뱀 위치 갱신
  update3DPosition() {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const pos = this.game.gridTo3D(seg.x, seg.y);
      if (this.meshList[i]) {
        this.meshList[i].position.set(pos.x, pos.y, pos.z + 0.1); // 블록보다 약간 앞으로 돌출
        this.meshList[i].scale.set(1, 1, 1); // 스케일 원복
      }
    }
  }

  // 🐍 자율 이동 AI (1칸 점프 제한 및 지형 탐색)
  updateAI(deltaTime) {
    if (this.isDead || !this.game.isPlaying || this.game.isPaused) return;

    this.moveTimer += deltaTime;
    if (this.moveTimer < this.moveInterval) return;
    this.moveTimer = 0;

    const head = this.segments[0];
    let nextX = head.x + this.dirX;

    // 보드 벽 도착 시 즉시 방향 반전
    if (nextX < 0 || nextX >= COLS) {
      this.dirX *= -1;
      nextX = head.x + this.dirX;
    }

    // 머리가 서 있는 현재 행과 목표 컬럼의 최상단 행 탐색
    const currentTopY = this.game.getTopRowAt(head.x);
    const targetTopY = this.game.getTopRowAt(nextX);

    // 🌟 핵심 요구사항: 점프는 1칸만 가능!
    // 현재 행보다 목표 행이 위쪽에 있는 경우 (targetTopY < currentTopY)
    const heightDifference = currentTopY - targetTopY;

    let canMove = false;
    let nextY = targetTopY;

    if (heightDifference === 1) {
      // 1칸 차이: 깡충 점프 성공!
      canMove = true;
      audioManager.playSnakeJump();
    } else if (heightDifference <= 0) {
      // 동일 높이 또는 아래로 미끄러짐 이동 가능
      canMove = true;
    } else {
      // 높이 차이가 2칸 이상: 점프 불가능! 장애물에 막힘 ➔ 방향 반전
      this.dirX *= -1;
      nextX = head.x + this.dirX;
      const altTargetY = this.game.getTopRowAt(nextX);
      if (currentTopY - altTargetY <= 1) {
        canMove = true;
        nextY = altTargetY;
      }
    }

    if (canMove && nextX >= 0 && nextX < COLS) {
      // 몸통 마디 한 칸씩 밀기
      for (let i = this.segments.length - 1; i > 0; i--) {
        this.segments[i].x = this.segments[i - 1].x;
        this.segments[i].y = this.segments[i - 1].y;
      }
      this.segments[0].x = nextX;
      this.segments[0].y = nextY;

      this.update3DPosition();
    }
  }

  // 💥 뱀이 블록에 눌려 찌그러져 사망하는 처리
  checkCrush(boardGrid) {
    if (this.isDead) return;

    // 뱀 마디 중 하나라도 정착된 블록의 위치와 겹치는 경우
    for (let seg of this.segments) {
      if (seg.y >= 0 && seg.y < ROWS && seg.x >= 0 && seg.x < COLS) {
        if (boardGrid[seg.y][seg.x] !== 0) {
          this.die();
          return;
        }
      }
    }
  }

  // 뱀 사망 애니메이션 및 리스폰
  die() {
    if (this.isDead) return;
    this.isDead = true;

    // 납작하게 찌그러지는 Squish 효과 (Y축 Scale 0.1)
    this.meshList.forEach(mesh => {
      mesh.scale.set(1.5, 0.1, 1.5);
    });

    // 3D 파티클 폭발 이펙트 생성
    const head = this.segments[0];
    const pos = this.game.gridTo3D(head.x, head.y);
    this.game.create3DParticles(pos.x, pos.y, pos.z, 0xff007f);

    audioManager.playSnakeCrush();
    this.game.showSnakeEventBanner("💥 SNAKE CRUSHED!", true);
    this.game.updateSnakeUI(false);

    // 2.5초 후 바닥에서 재스폰
    clearTimeout(this.respawnTimer);
    this.respawnTimer = setTimeout(() => {
      if (this.game.isPlaying && !this.game.isGameOver) {
        this.spawn();
      }
    }, 2500);
  }
}

// 4. 메인 3D 테트리스 게임 클래스
class Tetris3DGame {
  constructor() {
    this.container = document.getElementById('canvas-3d-container');

    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas.getContext('2d');

    this.next1Canvas = document.getElementById('next1-canvas');
    this.next1Ctx = this.next1Canvas.getContext('2d');
    this.next2Canvas = document.getElementById('next2-canvas');
    this.next2Ctx = this.next2Canvas.getContext('2d');
    this.next3Canvas = document.getElementById('next3-canvas');
    this.next3Ctx = this.next3Canvas.getContext('2d');

    // HTML DOM UI 요소
    this.scoreDisplay = document.getElementById('score-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.speedDisplay = document.getElementById('speed-display');
    this.faceDisplay = document.getElementById('face-display');
    this.linesDisplay = document.getElementById('lines-display');
    this.snakeStatusDisplay = document.getElementById('snake-status-display');
    this.snakeScoreDisplay = document.getElementById('snake-score-display');

    this.rotationBanner = document.getElementById('rotation-banner');
    this.snakeEventBanner = document.getElementById('snake-event-banner');
    this.snakeBannerIcon = document.getElementById('snake-banner-icon');
    this.snakeBannerText = document.getElementById('snake-banner-text');

    // 모달 오버레이
    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.finalScoreText = document.getElementById('final-score');
    this.newHighScoreMsg = document.getElementById('new-high-score-msg');

    // 게임 변수
    this.grid = this.createGrid();
    this.score = 0;
    this.snakeScore = 0;
    this.highScore = parseInt(localStorage.getItem('tetris_high_score')) || 0;
    this.lines = 0;
    this.combo = 0;

    this.bag = [];
    this.currentPiece = null;
    this.nextQueue = [];
    this.holdPiece = null;
    this.canHold = true;

    // 3D 카메라 회전 관련 변수
    this.currentCameraAngle = 0;
    this.targetCameraAngle = 0;
    this.cameraRadius = 24;
    this.lastRotationThreshold = 0;
    this.faceNames = ['FRONT 0°', 'RIGHT 90°', 'BACK 180°', 'LEFT 270°'];
    this.faceIndex = 0;

    // 3D 메쉬 보관 배열
    this.gridMeshes = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.activeBlockMeshes = [];
    this.ghostBlockMeshes = [];
    this.particles3D = [];

    // 속도 설정
    this.dropCounter = 0;
    this.initialDropInterval = 1000;
    this.dropInterval = 1000;
    this.lastTime = 0;
    this.snakeSurvivalTimer = 0;

    this.isPaused = false;
    this.isGameOver = false;
    this.isPlaying = false;

    this.highScoreDisplay.textContent = this.highScore;

    // Three.js 인스턴스 설정
    this.initThreeJS();

    // 🐍 3D 자율 뱀 객체 생성
    this.snake = new CyberSnake3D(this);

    this.bindEvents();
  }

  // 컬럼의 최상단 정착 블록 행(row) 탐색
  getTopRowAt(col) {
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[r][col] !== 0) {
        return r;
      }
    }
    return ROWS - 1; // 블록이 없으면 맨 바닥
  }

  initThreeJS() {
    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04030a);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.8);
    dirLight.position.set(10, 20, 15);
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff007f, 1.2, 50);
    pointLight.position.set(-10, -10, 10);
    this.scene.add(pointLight);

    this.createBoardBoundary3D();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  createBoardBoundary3D() {
    const frameGroup = new THREE.Group();

    const geometry = new THREE.PlaneGeometry(COLS, ROWS);
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.3 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    frameGroup.add(wireframe);

    const wallGeo = new THREE.BoxGeometry(0.25, ROWS + 0.4, 0.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x15102a, emissive: 0x00f0ff, emissiveIntensity: 0.25 });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-COLS / 2 - 0.15, 0, 0);
    frameGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(COLS / 2 + 0.15, 0, 0);
    frameGroup.add(rightWall);

    const bottomGeo = new THREE.BoxGeometry(COLS + 0.5, 0.25, 0.5);
    const bottomWall = new THREE.Mesh(bottomGeo, wallMat);
    bottomWall.position.set(0, -ROWS / 2 - 0.15, 0);
    frameGroup.add(bottomWall);

    this.scene.add(frameGroup);
  }

  updateCameraPosition() {
    this.camera.position.x = this.cameraRadius * Math.sin(this.currentCameraAngle);
    this.camera.position.z = this.cameraRadius * Math.cos(this.currentCameraAngle);
    this.camera.position.y = 1;
    this.camera.lookAt(0, 0, 0);
  }

  gridTo3D(col, row) {
    const x = col - COLS / 2 + 0.5;
    const y = ROWS / 2 - row - 0.5;
    const z = 0;
    return { x, y, z };
  }

  createSingleCube3D(colorHex, isGhost = false) {
    const size = 0.92;
    const geometry = new THREE.BoxGeometry(size, size, size);

    if (isGhost) {
      const edges = new THREE.EdgesGeometry(geometry);
      const material = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.5 });
      return new THREE.LineSegments(edges, material);
    }

    const material = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.4,
      roughness: 0.2,
      emissive: colorHex,
      emissiveIntensity: 0.35
    });

    const cube = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const edgeLines = new THREE.LineSegments(edges, lineMat);
    cube.add(edgeLines);

    return cube;
  }

  createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  generateBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }

  getNextPieceType() {
    if (this.bag.length === 0) {
      this.bag = this.generateBag();
    }
    return this.bag.pop();
  }

  spawnPiece() {
    while (this.nextQueue.length < 4) {
      this.nextQueue.push(this.getNextPieceType());
    }

    const type = this.nextQueue.shift();
    const tetromino = TETROMINOES[type];

    this.currentPiece = {
      type: type,
      shape: tetromino.shape.map(row => [...row]),
      color: tetromino.color,
      hexStr: tetromino.hexStr,
      x: Math.floor(COLS / 2) - Math.ceil(tetromino.shape[0].length / 2),
      y: 0
    };

    this.canHold = true;

    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.gameOver();
    }
  }

  checkCollision(offsetX, offsetY, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = offsetX + c;
          const newY = offsetY + r;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && this.grid[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  moveRelative(directionX) {
    const effectiveDirX = (this.faceIndex === 2 || this.faceIndex === 3) ? -directionX : directionX;
    this.move(effectiveDirX, 0);
  }

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
      this.lockPiece();
    }
    return false;
  }

  softDrop() {
    if (this.move(0, 1)) {
      this.score += 1;
      this.updateScoreUI();
    }
  }

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

  rotate(dir = 1) {
    if (!this.isPlaying || this.isPaused || this.isGameOver) return;

    const shape = this.currentPiece.shape;
    const N = shape.length;
    const rotated = Array.from({ length: N }, () => Array(N).fill(0));

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (dir === 1) {
          rotated[c][N - 1 - r] = shape[r][c];
        } else {
          rotated[N - 1 - c][r] = shape[r][c];
        }
      }
    }

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
      this.currentPiece.hexStr = tetromino.hexStr;
      this.currentPiece.x = Math.floor(COLS / 2) - Math.ceil(tetromino.shape[0].length / 2);
      this.currentPiece.y = 0;
    }

    this.canHold = false;
    this.drawHoldPreview();
  }

  // 블록 고정 및 🐍 뱀 피하기 성공 판정
  lockPiece() {
    const { shape, x, y, color } = this.currentPiece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardY = y + r;
          const boardX = x + c;

          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            this.grid[boardY][boardX] = { color };

            const cubeMesh = this.createSingleCube3D(color);
            const pos = this.gridTo3D(boardX, boardY);
            cubeMesh.position.set(pos.x, pos.y, pos.z);
            this.scene.add(cubeMesh);

            this.gridMeshes[boardY][boardX] = cubeMesh;
          }
        }
      }
    }

    // 🐍 뱀 피하기 성공 보너스 판정
    if (this.snake && !this.snake.isDead) {
      const snakeHead = this.snake.segments[0];
      const dist = Math.abs(snakeHead.x - x);
      // 바로 근처에 블록이 떨어졌지만 뱀이 깔리지 않고 살아남음!
      if (dist <= 2) {
        this.addSnakeScore(150);
        this.showSnakeEventBanner("⚡ SNAKE DODGED! +150", false);
        audioManager.playSnakeDodge();
      }
    }

    // 💥 뱀 깔림 충돌 검사
    if (this.snake) {
      this.snake.checkCrush(this.grid);
    }

    this.clearLines();
    this.spawnPiece();
    this.drawNextPreviews();
    this.drawHoldPreview();
  }

  // 라인 지우기
  clearLines() {
    let linesCleared = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== 0)) {
        linesCleared++;

        for (let c = 0; c < COLS; c++) {
          const cellColor = this.grid[r][c].color;
          const pos = this.gridTo3D(c, r);

          if (this.gridMeshes[r][c]) {
            this.scene.remove(this.gridMeshes[r][c]);
            this.gridMeshes[r][c].geometry.dispose();
            this.gridMeshes[r][c] = null;
          }

          this.create3DParticles(pos.x, pos.y, pos.z, cellColor);
        }

        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(0));

        this.gridMeshes.splice(r, 1);
        this.gridMeshes.unshift(Array(COLS).fill(null));

        for (let rowAbove = 0; rowAbove <= r; rowAbove++) {
          for (let col = 0; col < COLS; col++) {
            if (this.gridMeshes[rowAbove][col]) {
              const newPos = this.gridTo3D(col, rowAbove);
              this.gridMeshes[rowAbove][col].position.y = newPos.y;
            }
          }
        }

        r++;
      }
    }

    if (linesCleared > 0) {
      this.combo++;

      const baseScores = [0, 100, 300, 500, 800];
      let gainedScore = baseScores[linesCleared];
      if (this.combo > 1) gainedScore += (this.combo - 1) * 50;

      // 🐍 뱀이 생존해 있을 때 라인 삭제 시 생존 보너스!
      if (this.snake && !this.snake.isDead) {
        gainedScore += 300;
        this.addSnakeScore(300);
        this.showSnakeEventBanner("🐍 CYBER SNAKE SAVED! +300", false);
      }

      this.score += gainedScore;
      this.lines += linesCleared;

      // 1줄마다 속도 3% 증가
      this.dropInterval = Math.max(60, Math.floor(this.initialDropInterval * Math.pow(0.97, this.lines)));

      // 5줄마다 3D 90도 회전
      const currentRotationCount = Math.floor(this.lines / 5);
      if (currentRotationCount > this.lastRotationThreshold) {
        const rotationSteps = currentRotationCount - this.lastRotationThreshold;
        this.lastRotationThreshold = currentRotationCount;

        this.targetCameraAngle += (Math.PI / 2) * rotationSteps;
        this.faceIndex = (this.faceIndex + rotationSteps) % 4;

        audioManager.play3DRotateWarp();
        this.showRotationBanner();
      }

      if (linesCleared === 4) {
        audioManager.playTetris();
      } else {
        audioManager.playClear();
      }

      this.updateScoreUI();
    } else {
      this.combo = 0;
    }
  }

  addSnakeScore(pts) {
    this.snakeScore += pts;
    this.score += pts;
    this.updateScoreUI();
  }

  showRotationBanner() {
    if (this.rotationBanner) {
      this.rotationBanner.classList.remove('hidden');
      setTimeout(() => {
        this.rotationBanner.classList.add('hidden');
      }, 1500);
    }
  }

  showSnakeEventBanner(text, isCrushed = false) {
    if (this.snakeEventBanner) {
      this.snakeBannerText.textContent = text;
      if (isCrushed) {
        this.snakeEventBanner.classList.add('crushed');
      } else {
        this.snakeEventBanner.classList.remove('crushed');
      }

      this.snakeEventBanner.classList.remove('hidden');
      setTimeout(() => {
        this.snakeEventBanner.classList.add('hidden');
      }, 1600);
    }
  }

  updateSnakeUI(isAlive) {
    if (this.snakeStatusDisplay) {
      if (isAlive) {
        this.snakeStatusDisplay.textContent = 'ALIVE 🐍';
        this.snakeStatusDisplay.classList.remove('dead');
      } else {
        this.snakeStatusDisplay.textContent = 'CRUSHED 💥';
        this.snakeStatusDisplay.classList.add('dead');
      }
    }
  }

  create3DParticles(x, y, z, colorHex) {
    const particleCount = 4;
    const geom = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });

    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(geom, mat.clone());
      pMesh.position.set(x, y, z);
      this.scene.add(pMesh);

      this.particles3D.push({
        mesh: pMesh,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.2) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        life: 30
      });
    }
  }

  update3DParticles() {
    for (let i = this.particles3D.length - 1; i >= 0; i--) {
      const p = this.particles3D[i];
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;
      p.life--;

      p.mesh.material.opacity = p.life / 30;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles3D.splice(i, 1);
      }
    }
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
      ghostY++;
    }
    return ghostY;
  }

  updateActivePieceMeshes3D() {
    this.activeBlockMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
    });
    this.activeBlockMeshes = [];

    this.ghostBlockMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
    });
    this.ghostBlockMeshes = [];

    if (!this.currentPiece || !this.isPlaying || this.isGameOver) return;

    const { shape, x, y, color } = this.currentPiece;
    const ghostY = this.getGhostY();

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const ghostMesh = this.createSingleCube3D(color, true);
          const pos = this.gridTo3D(x + c, ghostY + r);
          ghostMesh.position.set(pos.x, pos.y, pos.z);
          this.scene.add(ghostMesh);
          this.ghostBlockMeshes.push(ghostMesh);
        }
      }
    }

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const cubeMesh = this.createSingleCube3D(color, false);
          const pos = this.gridTo3D(x + c, y + r);
          cubeMesh.position.set(pos.x, pos.y, pos.z);
          this.scene.add(cubeMesh);
          this.activeBlockMeshes.push(cubeMesh);
        }
      }
    }
  }

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

  drawHoldPreview() {
    this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    if (this.holdPiece) {
      this.drawMiniPreview(this.holdCtx, this.holdCanvas, this.holdPiece);
    }
  }

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
          ctx.shadowColor = tetromino.hexStr;
          ctx.fillStyle = tetromino.hexStr;
          ctx.fillRect(offsetX + c * miniSize + 1, offsetY + r * miniSize + 1, miniSize - 2, miniSize - 2);
          ctx.restore();
        }
      }
    }
  }

  updateScoreUI() {
    this.scoreDisplay.textContent = this.score;
    this.snakeScoreDisplay.textContent = this.snakeScore;
    this.linesDisplay.textContent = this.lines;
    this.faceDisplay.textContent = this.faceNames[this.faceIndex];

    const speedMultiplier = (1000 / this.dropInterval).toFixed(1);
    this.speedDisplay.textContent = `${speedMultiplier}x`;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreDisplay.textContent = this.highScore;
      localStorage.setItem('tetris_high_score', this.highScore);
    }
  }

  // 16. 3D 메인 게임 렌더 루프
  update(time = 0) {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (this.isPlaying && !this.isPaused && !this.isGameOver) {
      // 테트리스 블록 자동 낙하 연산
      this.dropCounter += deltaTime;
      if (this.dropCounter > this.dropInterval) {
        this.move(0, 1);
        this.dropCounter = 0;
      }

      // 🐍 3D 자율 뱀 AI 업데이트
      if (this.snake) {
        this.snake.updateAI(deltaTime);

        // 뱀 실시간 생존 보너스 (매 초마다 +10pts)
        if (!this.snake.isDead) {
          this.snakeSurvivalTimer += deltaTime;
          if (this.snakeSurvivalTimer >= 1000) {
            this.snakeSurvivalTimer = 0;
            this.addSnakeScore(10);
          }
        }
      }
    }

    // 3D 카메라 보간 회전
    this.currentCameraAngle += (this.targetCameraAngle - this.currentCameraAngle) * 0.06;
    this.updateCameraPosition();

    this.updateActivePieceMeshes3D();
    this.update3DParticles();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }

  clearBoard3DMeshes() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.gridMeshes[r][c]) {
          this.scene.remove(this.gridMeshes[r][c]);
          this.gridMeshes[r][c].geometry.dispose();
          this.gridMeshes[r][c] = null;
        }
      }
    }
  }

  start() {
    this.clearBoard3DMeshes();
    this.grid = this.createGrid();
    this.score = 0;
    this.snakeScore = 0;
    this.lines = 0;
    this.combo = 0;
    this.dropInterval = this.initialDropInterval;
    this.bag = [];
    this.nextQueue = [];
    this.holdPiece = null;
    this.canHold = true;

    this.currentCameraAngle = 0;
    this.targetCameraAngle = 0;
    this.lastRotationThreshold = 0;
    this.faceIndex = 0;

    this.isPaused = false;
    this.isGameOver = false;
    this.isPlaying = true;

    // 🐍 뱀 리스폰
    if (this.snake) {
      this.snake.spawn();
    }

    this.updateScoreUI();
    this.spawnPiece();
    this.drawNextPreviews();
    this.drawHoldPreview();

    this.startOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameoverOverlay.classList.add('hidden');

    audioManager.startBGM();
  }

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

  onWindowResize() {
    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (this.isGameOver) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.moveRelative(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRelative(1);
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
          this.rotate(1);
          break;
        case 'KeyZ':
        case 'ControlLeft':
        case 'ControlRight':
          this.rotate(-1);
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

    document.getElementById('start-btn').addEventListener('click', () => this.start());
    document.getElementById('restart-btn').addEventListener('click', () => this.start());
    document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
    document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());

    const soundBtn = document.getElementById('sound-btn');
    soundBtn.addEventListener('click', () => {
      const isEnabled = audioManager.toggleSound();
      soundBtn.textContent = isEnabled ? '🔊 BGM ON' : '🔇 BGM OFF';
    });

    document.getElementById('btn-left').addEventListener('click', () => this.moveRelative(-1));
    document.getElementById('btn-right').addEventListener('click', () => this.moveRelative(1));
    document.getElementById('btn-down').addEventListener('click', () => this.softDrop());
    document.getElementById('btn-hard-drop').addEventListener('click', () => this.hardDrop());
    document.getElementById('btn-rotate-cw').addEventListener('click', () => this.rotate(1));
    document.getElementById('btn-rotate-ccw').addEventListener('click', () => this.rotate(-1));
    document.getElementById('btn-hold').addEventListener('click', () => this.hold());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Tetris3DGame();
  game.update();
});
