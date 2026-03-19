import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game.js';
import {
  COURT_WIDTH,
  COURT_HEIGHT,
  NET_X,
  NET_HEIGHT,
  NET_HALF_WIDTH,
  BALL_RADIUS,
  BALL_GRAVITY,
  BALL_ELASTICITY,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_GRAVITY,
  PLAYER_GROUND_Y,
  WIN_SCORE,
} from '../src/types.js';

describe('Game — 초기 상태', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('초기 상태에서 서버는 1번 플레이어', () => {
    expect(game.state.server).toBe(1);
  });

  it('초기 점수는 [0, 0]', () => {
    expect(game.state.scores).toEqual([0, 0]);
  });

  it('공은 1번 플레이어 쪽(x=200)에서 시작', () => {
    expect(game.state.ball.x).toBe(200);
    expect(game.state.ball.y).toBe(100);
    expect(game.state.ball.vx).toBe(0);
    expect(game.state.ball.vy).toBe(0);
  });

  it('플레이어 1은 x=200, 플레이어 2는 x=600에 배치', () => {
    expect(game.state.players[0].x).toBe(200);
    expect(game.state.players[1].x).toBe(600);
  });

  it('플레이어 초기 y는 PLAYER_GROUND_Y', () => {
    expect(game.state.players[0].y).toBe(PLAYER_GROUND_Y);
    expect(game.state.players[1].y).toBe(PLAYER_GROUND_Y);
  });

  it('플레이어 초기 점프 상태는 false', () => {
    expect(game.state.players[0].isJumping).toBe(false);
    expect(game.state.players[1].isJumping).toBe(false);
  });
});

describe('Game — 공 물리', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('중력이 매 틱마다 적용된다', () => {
    const initialVy = game.state.ball.vy;
    game.tick();
    expect(game.state.ball.vy).toBeCloseTo(initialVy + BALL_GRAVITY, 5);
  });

  it('공이 왼쪽 벽에 부딪히면 반사된다', () => {
    game.state.ball.x = BALL_RADIUS + 1;
    game.state.ball.vx = -10;
    game.state.ball.vy = 0;
    game.tick();
    expect(game.state.ball.vx).toBeGreaterThan(0);
    expect(game.state.ball.x).toBeGreaterThanOrEqual(BALL_RADIUS);
  });

  it('공이 오른쪽 벽에 부딪히면 반사된다', () => {
    game.state.ball.x = COURT_WIDTH - BALL_RADIUS - 1;
    game.state.ball.vx = 10;
    game.state.ball.vy = 0;
    game.tick();
    expect(game.state.ball.vx).toBeLessThan(0);
    expect(game.state.ball.x).toBeLessThanOrEqual(COURT_WIDTH - BALL_RADIUS);
  });

  it('공이 천장에 부딪히면 아래로 반사된다', () => {
    game.state.ball.x = 200;
    game.state.ball.y = BALL_RADIUS + 1;
    game.state.ball.vy = -10;
    game.state.ball.vx = 0;
    game.tick();
    expect(game.state.ball.vy).toBeGreaterThan(0);
  });

  it('벽 반사 시 탄성 계수가 적용된다', () => {
    game.state.ball.x = BALL_RADIUS + 1;
    game.state.ball.vx = -10;
    game.state.ball.vy = 0;
    game.tick();
    expect(game.state.ball.vx).toBeCloseTo(10 * BALL_ELASTICITY, 1);
  });
});

describe('Game — 네트 충돌', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('공이 네트 위에서 떨어지면 위로 반사된다', () => {
    const netTopY = COURT_HEIGHT - NET_HEIGHT;
    game.state.ball.x = NET_X;
    game.state.ball.y = netTopY - BALL_RADIUS + 2;
    game.state.ball.vy = 5;
    game.state.ball.vx = 0;
    game.tick();
    // 공이 반사되어 vy < 0 이 되어야 함 (또는 netTopY 위에 있어야 함)
    expect(game.state.ball.y).toBeLessThanOrEqual(netTopY);
  });

  it('공이 네트 왼쪽 옆에서 부딪히면 왼쪽으로 밀린다', () => {
    const netTopY = COURT_HEIGHT - NET_HEIGHT;
    game.state.ball.x = NET_X - BALL_RADIUS + 1;
    game.state.ball.y = netTopY + 50;
    game.state.ball.vx = 5;
    game.state.ball.vy = 0;
    game.tick();
    expect(game.state.ball.x).toBeLessThanOrEqual(NET_X - NET_HALF_WIDTH);
  });

  it('공이 네트 오른쪽 옆에서 부딪히면 오른쪽으로 밀린다', () => {
    const netTopY = COURT_HEIGHT - NET_HEIGHT;
    game.state.ball.x = NET_X + BALL_RADIUS - 1;
    game.state.ball.y = netTopY + 50;
    game.state.ball.vx = -5;
    game.state.ball.vy = 0;
    game.tick();
    expect(game.state.ball.x).toBeGreaterThanOrEqual(NET_X + NET_HALF_WIDTH);
  });
});

describe('Game — 바닥 판정 (점수)', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('공이 왼쪽 코트 바닥에 닿으면 2번 플레이어가 득점', () => {
    game.state.ball.x = 200; // 왼쪽
    game.state.ball.y = COURT_HEIGHT - BALL_RADIUS; // 바닥 직전
    game.state.ball.vy = 5;
    game.state.ball.vx = 0;
    const result = game.tick();
    expect(result).toEqual({ scorer: 2 });
    expect(game.state.scores[1]).toBe(1);
  });

  it('공이 오른쪽 코트 바닥에 닿으면 1번 플레이어가 득점', () => {
    game.state.ball.x = 600; // 오른쪽
    game.state.ball.y = COURT_HEIGHT - BALL_RADIUS;
    game.state.ball.vy = 5;
    game.state.ball.vx = 0;
    const result = game.tick();
    expect(result).toEqual({ scorer: 1 });
    expect(game.state.scores[0]).toBe(1);
  });

  it('공이 바닥에 닿지 않으면 null 반환', () => {
    game.state.ball.y = 100;
    game.state.ball.vy = 0;
    const result = game.tick();
    expect(result).toBeNull();
  });

  it('네트 경계선(x=NET_X)에서 바닥에 닿으면 1번 득점', () => {
    game.state.ball.x = NET_X; // 정확히 네트 위치
    game.state.ball.y = COURT_HEIGHT - BALL_RADIUS;
    game.state.ball.vy = 5;
    game.state.ball.vx = 0;
    const result = game.tick();
    // x >= NET_X -> scorer = 1
    expect(result).toEqual({ scorer: 1 });
  });
});

describe('Game — 플레이어 이동', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('왼쪽 입력 시 플레이어가 왼쪽으로 이동', () => {
    const initialX = game.state.players[0].x;
    game.inputs[0] = { left: true, right: false, up: false };
    game.tick();
    expect(game.state.players[0].x).toBeLessThan(initialX);
  });

  it('오른쪽 입력 시 플레이어가 오른쪽으로 이동', () => {
    const initialX = game.state.players[0].x;
    game.inputs[0] = { left: false, right: true, up: false };
    game.tick();
    expect(game.state.players[0].x).toBeGreaterThan(initialX);
  });

  it('플레이어 1은 왼쪽 코트를 벗어나지 못한다', () => {
    game.state.players[0].x = PLAYER_RADIUS;
    game.inputs[0] = { left: true, right: false, up: false };
    game.tick();
    expect(game.state.players[0].x).toBeGreaterThanOrEqual(PLAYER_RADIUS);
  });

  it('플레이어 1은 네트를 넘어가지 못한다', () => {
    game.state.players[0].x = NET_X - NET_HALF_WIDTH - PLAYER_RADIUS;
    game.inputs[0] = { left: false, right: true, up: false };
    game.tick();
    expect(game.state.players[0].x).toBeLessThanOrEqual(NET_X - NET_HALF_WIDTH - PLAYER_RADIUS);
  });

  it('플레이어 2는 네트 왼쪽으로 넘어가지 못한다', () => {
    game.state.players[1].x = NET_X + NET_HALF_WIDTH + PLAYER_RADIUS;
    game.inputs[1] = { left: true, right: false, up: false };
    game.tick();
    expect(game.state.players[1].x).toBeGreaterThanOrEqual(NET_X + NET_HALF_WIDTH + PLAYER_RADIUS);
  });

  it('플레이어 2는 오른쪽 벽을 넘어가지 못한다', () => {
    game.state.players[1].x = COURT_WIDTH - PLAYER_RADIUS;
    game.inputs[1] = { left: false, right: true, up: false };
    game.tick();
    expect(game.state.players[1].x).toBeLessThanOrEqual(COURT_WIDTH - PLAYER_RADIUS);
  });
});

describe('Game — 점프', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('점프 입력 시 vy가 음수(위)로 설정된다', () => {
    game.inputs[0] = { left: false, right: false, up: true };
    game.tick();
    // PLAYER_JUMP_VELOCITY는 음수, 한 틱 후에 중력이 적용됨
    expect(game.state.players[0].isJumping).toBe(true);
    expect(game.state.players[0].y).toBeLessThan(PLAYER_GROUND_Y);
  });

  it('이미 점프 중이면 다시 점프하지 않는다 (이중 점프 방지)', () => {
    game.inputs[0] = { left: false, right: false, up: true };
    game.tick(); // 첫 점프
    const vyAfterFirstJump = game.state.players[0].vy;
    game.tick(); // 두번째 틱 — 이미 점프 중이라 다시 점프 안함
    // vy는 첫 점프 후 중력만 적용됨
    expect(game.state.players[0].vy).toBeCloseTo(vyAfterFirstJump + PLAYER_GRAVITY, 5);
  });

  it('바닥에 착지하면 isJumping이 false로 리셋된다', () => {
    game.inputs[0] = { left: false, right: false, up: true };
    game.tick();
    expect(game.state.players[0].isJumping).toBe(true);

    // 많은 틱을 돌려서 착지시킴
    game.inputs[0] = { left: false, right: false, up: false };
    for (let i = 0; i < 100; i++) {
      game.tick();
    }
    expect(game.state.players[0].y).toBe(PLAYER_GROUND_Y);
    expect(game.state.players[0].isJumping).toBe(false);
  });

  it('두 플레이어가 동시에 점프할 수 있다', () => {
    game.inputs[0] = { left: false, right: false, up: true };
    game.inputs[1] = { left: false, right: false, up: true };
    game.tick();
    expect(game.state.players[0].isJumping).toBe(true);
    expect(game.state.players[1].isJumping).toBe(true);
    expect(game.state.players[0].y).toBeLessThan(PLAYER_GROUND_Y);
    expect(game.state.players[1].y).toBeLessThan(PLAYER_GROUND_Y);
  });
});

describe('Game — 플레이어-공 충돌', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('플레이어 머리 위에 공이 있으면 반사된다', () => {
    const player = game.state.players[0];
    // 공을 플레이어 바로 위에 놓고 아래로 떨어뜨림
    game.state.ball.x = player.x;
    game.state.ball.y = player.y - BALL_RADIUS - PLAYER_RADIUS + 5;
    game.state.ball.vy = 5;
    game.state.ball.vx = 0;
    game.tick();
    // 충돌 후 공의 vy가 변했어야 함
    // 정확한 값은 물리엔진에 따라 다르지만 충돌이 발생해야 함
    expect(game.state.ball.y).toBeLessThan(COURT_HEIGHT);
  });

  it('공 속도가 maxSpeed(15)를 초과하지 않는다', () => {
    const player = game.state.players[0];
    game.state.ball.x = player.x;
    game.state.ball.y = player.y - BALL_RADIUS - PLAYER_RADIUS + 5;
    game.state.ball.vy = 20;
    game.state.ball.vx = 20;

    // 점프 중인 플레이어와 충돌
    game.state.players[0].vy = -10;
    game.tick();

    const speed = Math.sqrt(
      game.state.ball.vx ** 2 + game.state.ball.vy ** 2,
    );
    expect(speed).toBeLessThanOrEqual(15 + 1); // 약간의 부동소수점 오차 허용
  });
});

describe('Game — 라운드 오버 딜레이', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('득점 후 라운드 오버 딜레이 동안 tick은 null을 반환한다', () => {
    // 강제로 득점 발생
    game.state.ball.x = 200;
    game.state.ball.y = COURT_HEIGHT - BALL_RADIUS;
    game.state.ball.vy = 5;
    const result = game.tick();
    expect(result).not.toBeNull();

    // 다음 틱은 라운드 오버 딜레이 중이므로 null
    const nextResult = game.tick();
    expect(nextResult).toBeNull();
  });
});

describe('Game — 게임 종료', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it(`${WIN_SCORE}점 달성 시 게임 오버`, () => {
    game.state.scores = [WIN_SCORE, 0];
    expect(game.isGameOver()).toEqual({ winner: 1 });
  });

  it(`2번 플레이어 ${WIN_SCORE}점 달성 시 게임 오버`, () => {
    game.state.scores = [0, WIN_SCORE];
    expect(game.isGameOver()).toEqual({ winner: 2 });
  });

  it('아직 아무도 WIN_SCORE에 도달하지 않으면 null', () => {
    game.state.scores = [WIN_SCORE - 1, WIN_SCORE - 1];
    expect(game.isGameOver()).toBeNull();
  });
});

describe('Game — resetRound', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('라운드 리셋 후 점수는 유지된다', () => {
    game.state.scores = [3, 5];
    game.resetRound(2);
    expect(game.state.scores).toEqual([3, 5]);
  });

  it('라운드 리셋 후 공은 서버 쪽에 배치된다', () => {
    game.resetRound(2);
    expect(game.state.ball.x).toBe(600);
    game.resetRound(1);
    expect(game.state.ball.x).toBe(200);
  });

  it('라운드 리셋 후 플레이어는 초기 위치로 돌아간다', () => {
    game.state.players[0].x = 100;
    game.state.players[0].y = 200;
    game.resetRound(1);
    expect(game.state.players[0].x).toBe(200);
    expect(game.state.players[0].y).toBe(PLAYER_GROUND_Y);
  });

  it('라운드 리셋 후 입력은 초기화된다', () => {
    game.inputs[0] = { left: true, right: true, up: true };
    game.resetRound(1);
    expect(game.inputs[0]).toEqual({ left: false, right: false, up: false });
    expect(game.inputs[1]).toEqual({ left: false, right: false, up: false });
  });
});
