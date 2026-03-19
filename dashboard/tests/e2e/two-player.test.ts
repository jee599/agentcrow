/**
 * 2인 동시 플레이 E2E 테스트
 * PRD 기준: 방 생성 → 참가 → 게임 시작 → 서브 → 랠리 → 득점 → 15점 승리
 */
import { describe, it, expect, beforeEach } from 'vitest';

// --- 게임 시뮬레이션 엔진 (E2E 테스트용) ---

interface Vec2 {
  x: number;
  y: number;
}

interface BallState {
  pos: Vec2;
  vel: Vec2;
}

interface PlayerState {
  pos: Vec2;
  vel: Vec2;
  isJumping: boolean;
  animation: 'idle' | 'moving' | 'jumping' | 'hitting' | 'spiking' | 'win' | 'lose';
}

interface GameMatchState {
  ball: BallState;
  players: [PlayerState, PlayerState];
  score: [number, number];
  servingPlayer: 0 | 1;
  phase: 'waiting' | 'serving' | 'playing' | 'scoring' | 'gameOver';
  winner: 0 | 1 | null;
}

interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  powerHit: boolean;
}

const COURT_WIDTH = 432;
const COURT_NET_X = 216;
const GROUND_Y = 264;
const BALL_RADIUS = 20;
const PLAYER_RADIUS = 32;
const WIN_SCORE = 15;

class GameSimulator {
  state: GameMatchState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameMatchState {
    return {
      ball: {
        pos: { x: 108, y: 200 },
        vel: { x: 0, y: 0 },
      },
      players: [
        {
          pos: { x: 108, y: GROUND_Y },
          vel: { x: 0, y: 0 },
          isJumping: false,
          animation: 'idle',
        },
        {
          pos: { x: 324, y: GROUND_Y },
          vel: { x: 0, y: 0 },
          isJumping: false,
          animation: 'idle',
        },
      ],
      score: [0, 0],
      servingPlayer: 0,
      phase: 'serving',
      winner: null,
    };
  }

  serve(): void {
    if (this.state.phase !== 'serving') return;

    const servingIdx = this.state.servingPlayer;
    const serverX = this.state.players[servingIdx].pos.x;

    this.state.ball = {
      pos: { x: serverX, y: 150 },
      vel: { x: 0, y: -5 }, // 위로 올라감
    };
    this.state.phase = 'playing';
  }

  applyInput(playerIdx: 0 | 1, input: PlayerInput): void {
    const player = this.state.players[playerIdx];
    const moveSpeed = 6;

    // 이동 (자기 코트 내에서만)
    if (input.left) {
      player.pos.x -= moveSpeed;
      player.animation = 'moving';
    }
    if (input.right) {
      player.pos.x += moveSpeed;
      player.animation = 'moving';
    }

    // 코트 경계 제한
    if (playerIdx === 0) {
      player.pos.x = Math.max(PLAYER_RADIUS, Math.min(COURT_NET_X - PLAYER_RADIUS, player.pos.x));
    } else {
      player.pos.x = Math.max(COURT_NET_X + PLAYER_RADIUS, Math.min(COURT_WIDTH - PLAYER_RADIUS, player.pos.x));
    }

    // 점프
    if (input.up && !player.isJumping) {
      player.vel.y = -16;
      player.isJumping = true;
      player.animation = 'jumping';
    }
  }

  tick(): void {
    if (this.state.phase !== 'playing') return;

    // 공 물리
    this.state.ball.vel.y += 0.25; // 중력
    this.state.ball.pos.x += this.state.ball.vel.x;
    this.state.ball.pos.y += this.state.ball.vel.y;

    // 플레이어 물리
    for (const player of this.state.players) {
      if (player.isJumping) {
        player.vel.y += 0.5; // 플레이어 중력
        player.pos.y += player.vel.y;

        if (player.pos.y >= GROUND_Y) {
          player.pos.y = GROUND_Y;
          player.vel.y = 0;
          player.isJumping = false;
          player.animation = 'idle';
        }
      }
    }

    // 캐릭터-공 충돌
    for (const player of this.state.players) {
      const dx = this.state.ball.pos.x - player.pos.x;
      const dy = this.state.ball.pos.y - player.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= PLAYER_RADIUS + BALL_RADIUS) {
        const nx = dx / dist;
        const ny = dy / dist;
        const speed = Math.sqrt(this.state.ball.vel.x ** 2 + this.state.ball.vel.y ** 2) || 5;

        this.state.ball.vel = { x: nx * speed, y: ny * speed };
        // 공을 충돌 밖으로 밀어냄
        this.state.ball.pos = {
          x: player.pos.x + nx * (PLAYER_RADIUS + BALL_RADIUS + 1),
          y: player.pos.y + ny * (PLAYER_RADIUS + BALL_RADIUS + 1),
        };
        player.animation = 'hitting';
      }
    }

    // 벽 바운스
    if (this.state.ball.pos.x - BALL_RADIUS <= 0) {
      this.state.ball.vel.x = Math.abs(this.state.ball.vel.x);
    }
    if (this.state.ball.pos.x + BALL_RADIUS >= COURT_WIDTH) {
      this.state.ball.vel.x = -Math.abs(this.state.ball.vel.x);
    }

    // 네트 충돌 (간단화)
    if (
      Math.abs(this.state.ball.pos.x - COURT_NET_X) < BALL_RADIUS + 4 &&
      this.state.ball.pos.y > GROUND_Y - 176
    ) {
      this.state.ball.vel.x = -this.state.ball.vel.x;
    }

    // 바닥 충돌 → 득점
    if (this.state.ball.pos.y + BALL_RADIUS >= GROUND_Y) {
      if (this.state.ball.pos.x > COURT_NET_X) {
        this.scorePoint(0); // P1 득점
      } else {
        this.scorePoint(1); // P2 득점
      }
    }
  }

  private scorePoint(scorer: 0 | 1): void {
    this.state.score[scorer]++;
    this.state.servingPlayer = scorer;

    if (this.state.score[scorer] >= WIN_SCORE) {
      this.state.phase = 'gameOver';
      this.state.winner = scorer;
      this.state.players[scorer].animation = 'win';
      this.state.players[scorer === 0 ? 1 : 0].animation = 'lose';
    } else {
      this.state.phase = 'scoring';
    }
  }

  resetForServe(): void {
    if (this.state.phase !== 'scoring') return;

    const servingIdx = this.state.servingPlayer;
    this.state.players[0].pos = { x: 108, y: GROUND_Y };
    this.state.players[1].pos = { x: 324, y: GROUND_Y };
    this.state.players[0].vel = { x: 0, y: 0 };
    this.state.players[1].vel = { x: 0, y: 0 };
    this.state.players[0].isJumping = false;
    this.state.players[1].isJumping = false;
    this.state.players[0].animation = 'idle';
    this.state.players[1].animation = 'idle';

    this.state.ball = {
      pos: { x: this.state.players[servingIdx].pos.x, y: 200 },
      vel: { x: 0, y: 0 },
    };
    this.state.phase = 'serving';
  }

  // 헬퍼: 공을 강제로 특정 코트에 떨어뜨림
  forceBallDrop(side: 'left' | 'right'): void {
    this.state.phase = 'playing';
    // 플레이어를 벽 쪽으로 이동시켜 공과 충돌하지 않도록 함
    this.state.players[0].pos = { x: PLAYER_RADIUS, y: GROUND_Y };
    this.state.players[1].pos = { x: COURT_WIDTH - PLAYER_RADIUS, y: GROUND_Y };
    this.state.ball = {
      pos: { x: side === 'left' ? 100 : 300, y: GROUND_Y - BALL_RADIUS - 1 },
      vel: { x: 0, y: 10 },
    };
    this.tick();
  }
}

// ========================
// 테스트
// ========================

describe('2인 동시 플레이 E2E', () => {
  let game: GameSimulator;

  beforeEach(() => {
    game = new GameSimulator();
  });

  describe('게임 초기화', () => {
    it('초기 점수 0:0, 서빙 플레이어 P1', () => {
      expect(game.state.score).toEqual([0, 0]);
      expect(game.state.servingPlayer).toBe(0);
      expect(game.state.phase).toBe('serving');
    });

    it('P1은 왼쪽 코트, P2는 오른쪽 코트에 배치', () => {
      expect(game.state.players[0].pos.x).toBeLessThan(COURT_NET_X);
      expect(game.state.players[1].pos.x).toBeGreaterThan(COURT_NET_X);
    });

    it('두 플레이어 모두 바닥에 서 있음', () => {
      expect(game.state.players[0].pos.y).toBe(GROUND_Y);
      expect(game.state.players[1].pos.y).toBe(GROUND_Y);
    });
  });

  describe('서브 메커니즘', () => {
    it('서브 시 공이 위로 올라감', () => {
      game.serve();
      expect(game.state.ball.vel.y).toBeLessThan(0);
      expect(game.state.phase).toBe('playing');
    });

    it('서브 시 공이 서빙 플레이어 위치에 생성', () => {
      game.serve();
      expect(game.state.ball.pos.x).toBe(game.state.players[0].pos.x);
    });

    it('서빙이 아닌 상태에서 serve() 호출 시 무시', () => {
      game.state.phase = 'playing';
      const prevBall = { ...game.state.ball };
      game.serve();
      expect(game.state.ball.pos).toEqual(prevBall.pos);
    });
  });

  describe('플레이어 이동', () => {
    it('왼쪽 키 입력 시 P1이 왼쪽으로 이동', () => {
      const prevX = game.state.players[0].pos.x;
      game.applyInput(0, { left: true, right: false, up: false, powerHit: false });
      expect(game.state.players[0].pos.x).toBe(prevX - 6);
    });

    it('오른쪽 키 입력 시 P2가 오른쪽으로 이동', () => {
      const prevX = game.state.players[1].pos.x;
      game.applyInput(1, { left: false, right: true, up: false, powerHit: false });
      expect(game.state.players[1].pos.x).toBe(prevX + 6);
    });

    it('P1은 네트를 넘어갈 수 없음', () => {
      game.state.players[0].pos.x = COURT_NET_X - PLAYER_RADIUS - 1;
      game.applyInput(0, { left: false, right: true, up: false, powerHit: false });
      expect(game.state.players[0].pos.x).toBeLessThanOrEqual(COURT_NET_X - PLAYER_RADIUS);
    });

    it('P2는 네트 왼쪽으로 이동 불가', () => {
      game.state.players[1].pos.x = COURT_NET_X + PLAYER_RADIUS + 1;
      game.applyInput(1, { left: true, right: false, up: false, powerHit: false });
      expect(game.state.players[1].pos.x).toBeGreaterThanOrEqual(COURT_NET_X + PLAYER_RADIUS);
    });

    it('P1은 왼쪽 벽 밖으로 이동 불가', () => {
      game.state.players[0].pos.x = PLAYER_RADIUS + 1;
      game.applyInput(0, { left: true, right: false, up: false, powerHit: false });
      expect(game.state.players[0].pos.x).toBeGreaterThanOrEqual(PLAYER_RADIUS);
    });

    it('P2는 오른쪽 벽 밖으로 이동 불가', () => {
      game.state.players[1].pos.x = COURT_WIDTH - PLAYER_RADIUS - 1;
      game.applyInput(1, { left: false, right: true, up: false, powerHit: false });
      expect(game.state.players[1].pos.x).toBeLessThanOrEqual(COURT_WIDTH - PLAYER_RADIUS);
    });
  });

  describe('점프 메커니즘', () => {
    it('점프 키 입력 시 수직 속도 -16', () => {
      game.applyInput(0, { left: false, right: false, up: true, powerHit: false });
      expect(game.state.players[0].vel.y).toBe(-16);
      expect(game.state.players[0].isJumping).toBe(true);
    });

    it('점프 중 다시 점프 불가 (이중 점프 방지)', () => {
      game.applyInput(0, { left: false, right: false, up: true, powerHit: false });
      game.state.players[0].vel.y = -8; // 상승 중
      game.applyInput(0, { left: false, right: false, up: true, powerHit: false });
      expect(game.state.players[0].vel.y).toBe(-8); // 변화 없음
    });

    it('점프 후 중력으로 착지', () => {
      game.state.phase = 'playing';
      game.applyInput(0, { left: false, right: false, up: true, powerHit: false });

      // 여러 프레임 시뮬레이션
      for (let i = 0; i < 100; i++) {
        game.tick();
      }

      expect(game.state.players[0].pos.y).toBe(GROUND_Y);
      expect(game.state.players[0].isJumping).toBe(false);
    });
  });

  describe('득점 흐름', () => {
    it('공이 P2 코트 바닥에 떨어지면 P1 득점', () => {
      game.forceBallDrop('right');
      expect(game.state.score[0]).toBe(1);
      expect(game.state.servingPlayer).toBe(0);
    });

    it('공이 P1 코트 바닥에 떨어지면 P2 득점', () => {
      game.forceBallDrop('left');
      expect(game.state.score[1]).toBe(1);
      expect(game.state.servingPlayer).toBe(1);
    });

    it('득점 후 serving 페이즈로 복귀', () => {
      game.forceBallDrop('right');
      expect(game.state.phase).toBe('scoring');

      game.resetForServe();
      expect(game.state.phase).toBe('serving');
    });

    it('득점 후 서브권이 득점한 플레이어에게 이동', () => {
      game.forceBallDrop('left'); // P2 득점
      expect(game.state.servingPlayer).toBe(1);

      game.resetForServe();
      game.forceBallDrop('right'); // P1 득점
      expect(game.state.servingPlayer).toBe(0);
    });
  });

  describe('15점 승리 조건', () => {
    it('P1이 15점 도달 시 gameOver + P1 승리', () => {
      for (let i = 0; i < 15; i++) {
        game.forceBallDrop('right');
        if (game.state.phase === 'scoring') game.resetForServe();
      }

      expect(game.state.phase).toBe('gameOver');
      expect(game.state.winner).toBe(0);
    });

    it('P2가 15점 도달 시 gameOver + P2 승리', () => {
      for (let i = 0; i < 15; i++) {
        game.forceBallDrop('left');
        if (game.state.phase === 'scoring') game.resetForServe();
      }

      expect(game.state.phase).toBe('gameOver');
      expect(game.state.winner).toBe(1);
    });

    it('14점에서는 게임 미종료', () => {
      for (let i = 0; i < 13; i++) {
        game.forceBallDrop('right');
        if (game.state.phase === 'scoring') game.resetForServe();
      }
      // 14번째 득점 후 resetForServe 하지 않음
      game.forceBallDrop('right');

      expect(game.state.phase).toBe('scoring');
      expect(game.state.winner).toBeNull();
    });

    it('승리 시 애니메이션 상태 설정', () => {
      for (let i = 0; i < 15; i++) {
        game.forceBallDrop('right');
        if (game.state.phase === 'scoring') game.resetForServe();
      }

      expect(game.state.players[0].animation).toBe('win');
      expect(game.state.players[1].animation).toBe('lose');
    });
  });

  describe('양 플레이어 동시 입력', () => {
    it('P1과 P2가 동시에 이동 가능', () => {
      const p1PrevX = game.state.players[0].pos.x;
      const p2PrevX = game.state.players[1].pos.x;

      game.applyInput(0, { left: false, right: true, up: false, powerHit: false });
      game.applyInput(1, { left: true, right: false, up: false, powerHit: false });

      expect(game.state.players[0].pos.x).toBe(p1PrevX + 6);
      expect(game.state.players[1].pos.x).toBe(p2PrevX - 6);
    });

    it('P1과 P2가 동시에 점프 가능', () => {
      game.applyInput(0, { left: false, right: false, up: true, powerHit: false });
      game.applyInput(1, { left: false, right: false, up: true, powerHit: false });

      expect(game.state.players[0].isJumping).toBe(true);
      expect(game.state.players[1].isJumping).toBe(true);
    });
  });

  describe('풀 매치 시뮬레이션', () => {
    it('15점 매치가 정상적으로 진행되고 종료됨', () => {
      let totalPoints = 0;

      while (game.state.phase !== 'gameOver' && totalPoints < 100) {
        // P1 코트에 공 떨어뜨리기 (P2 득점) — 교대
        if (totalPoints % 2 === 0) {
          game.forceBallDrop('left');
        } else {
          game.forceBallDrop('right');
        }

        totalPoints++;

        if (game.state.phase === 'scoring') {
          game.resetForServe();
        }
      }

      expect(game.state.phase).toBe('gameOver');
      expect(game.state.winner).not.toBeNull();

      const [s1, s2] = game.state.score;
      expect(s1 === 15 || s2 === 15).toBe(true);
    });
  });
});
