/**
 * ==========================================================================
 * CYBERPUNK TETRIS - WEB AUDIO API SYNTHESIZER (오디오 모듈)
 * 외부 음원 파일(MP3/WAV) 없이 브라우저 자체 오디오 신디사이저로 사운드 생성
 * ==========================================================================
 */

class SoundManager {
  constructor() {
    // 브라우저 호환성을 위한 AudioContext 생성
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = null;
    this.enabled = true; // 사운드 켜짐/꺼짐 상태
    this.bgmTimer = null; // BGM 루프 타이머
    this.bgmStep = 0;
  }

  // 사용자 상호작용 후 AudioContext 초기화 (브라우저 자동재생 정책 대응)
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 사운드 토글 (ON/OFF)
  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.enabled;
  }

  // 1. 블록 이동 효과음 (짧은 시선 틱 소리)
  playMove() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // 2. 블록 회전 효과음 (피치 상승음)
  playRotate() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // 3. 하드 드롭 효과음 (묵직한 임팩트음)
  playDrop() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // 4. 일반 라인 지우기 효과음 (화려한 차임음)
  playClear() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.15);
    });
  }

  // 5. 테트리스 (4줄 삭제) 대박 효과음 (사이버 아르페지오 폭발)
  playTetris() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.04);
      osc.stop(this.ctx.currentTime + idx * 0.04 + 0.2);
    });
  }

  // 6. 게임오버 효과음 (다운 피치)
  playGameOver() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  // 7. 사이버펑크 8비트 스타일 BGM 루퍼
  startBGM() {
    if (!this.enabled) return;
    this.stopBGM();
    this.init();

    // 8비트 사이버펑크 루프 음계 주파수 목록
    const melody = [
      110, 0, 110, 164.81, 110, 0, 130.81, 146.83,
      110, 0, 110, 164.81, 110, 0, 196.00, 174.61
    ];

    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.enabled || !this.ctx) return;

      const freq = melody[this.bgmStep % melody.length];
      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      }
      this.bgmStep++;
    }, 150);
  }

  // BGM 정지
  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// 글로벌 사운드 매니저 인스턴스
const audioManager = new SoundManager();
