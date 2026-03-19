/**
 * 물리엔진 단위테스트 — 충돌 판정 & 반발 계수
 * PRD 기준: 캐릭터 충돌반경 32px, 공 충돌반경 20px
 * 바운스 계수: 바닥 0.7, 네트/벽 1.0
 */
import { describe, it, expect, beforeEach } from 'vitest';

// --- 게임 물리 타입 (구현 전 인터페이스 정의) ---

interface Vec2 {
  x: number;
  y: number;
}

interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  gravity: number;
  maxSpeed: number;
}

interface Player {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  gravity: number;
}

interface Court {
  width: number;
  height: number;
  netX: number;
  netHeight: number;
  groundY: number;
}

// --- PRD 상수 ---

const COURT: Court = {
  width: 432,
  height: 304,
  netX: 216, // 중앙
  netHeight: 176, // 바닥에서 네트 상단까지
  groundY: 264, // 304 - 40(ground tile)
};

const BALL_DEFAULTS = {
  radius: 20,
  gravity: 0.25,
  maxSpeed: 15,
  bounceFloor: 0.7,
  bounceWall: 1.0,
  bounceNet: 1.0,
};

const PLAYER_DEFAULTS = {
  radius: 32,
  moveSpeed: 6,
  jumpSpeed: -16,
  gravity: 0.5,
};

// --- 물리 함수 (TDD: 구현체가 만들어지면 import로 교체) ---

function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function detectCircleCollision(
  posA: Vec2,
  radiusA: number,
  posB: Vec2,
  radiusB: number
): boolean {
  return distance(posA, posB) <= radiusA + radiusB;
}

function resolvePlayerBallCollision(
  player: Player,
  ball: Ball
): Vec2 {
  // 반사 벡터: 플레이어 중심 → 공 중심 방향
  const dx = ball.pos.x - player.pos.x;
  const dy = ball.pos.y - player.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  // 반사 속도 크기는 기존 속도 유지
  const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2) || 5;
  return {
    x: nx * speed,
    y: ny * speed,
  };
}

function applyFloorBounce(ball: Ball, groundY: number): Ball {
  if (ball.pos.y + ball.radius >= groundY) {
    return {
      ...ball,
      pos: { ...ball.pos, y: groundY - ball.radius },
      vel: {
        x: ball.vel.x,
        y: -ball.vel.y * BALL_DEFAULTS.bounceFloor,
      },
    };
  }
  return ball;
}

function applyWallBounce(ball: Ball, courtWidth: number): Ball {
  if (ball.pos.x - ball.radius <= 0) {
    return {
      ...ball,
      pos: { ...ball.pos, x: ball.radius },
      vel: {
        x: -ball.vel.x * BALL_DEFAULTS.bounceWall,
        y: ball.vel.y,
      },
    };
  }
  if (ball.pos.x + ball.radius >= courtWidth) {
    return {
      ...ball,
      pos: { ...ball.pos, x: courtWidth - ball.radius },
      vel: {
        x: -ball.vel.x * BALL_DEFAULTS.bounceWall,
        y: ball.vel.y,
      },
    };
  }
  return ball;
}

function applyNetCollision(ball: Ball, court: Court): Ball {
  const netTop = court.groundY - court.netHeight;
  const netLeft = court.netX - 4; // 네트 반폭 ~8px
  const netRight = court.netX + 4;

  // 공이 네트 영역에 있는지
  if (
    ball.pos.x + ball.radius > netLeft &&
    ball.pos.x - ball.radius < netRight &&
    ball.pos.y + ball.radius > netTop
  ) {
    // 좌측에서 충돌 vs 우측에서 충돌
    if (ball.vel.x > 0) {
      // 왼쪽에서 오른쪽으로 이동 → 왼쪽으로 반사
      return {
        ...ball,
        pos: { ...ball.pos, x: netLeft - ball.radius },
        vel: {
          x: -ball.vel.x * BALL_DEFAULTS.bounceNet,
          y: ball.vel.y,
        },
      };
    } else {
      return {
        ...ball,
        pos: { ...ball.pos, x: netRight + ball.radius },
        vel: {
          x: -ball.vel.x * BALL_DEFAULTS.bounceNet,
          y: ball.vel.y,
        },
      };
    }
  }
  return ball;
}

function applyGravity(ball: Ball): Ball {
  return {
    ...ball,
    vel: {
      x: ball.vel.x,
      y: ball.vel.y + ball.gravity,
    },
  };
}

function clampSpeed(ball: Ball): Ball {
  const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
  if (speed > ball.maxSpeed) {
    const ratio = ball.maxSpeed / speed;
    return {
      ...ball,
      vel: {
        x: ball.vel.x * ratio,
        y: ball.vel.y * ratio,
      },
    };
  }
  return ball;
}

function detectSpike(player: Player, ball: Ball, groundY: number): boolean {
  const isAirborne = player.pos.y < groundY;
  const isAboveBall = player.pos.y < ball.pos.y;
  const isColliding = detectCircleCollision(
    player.pos,
    player.radius,
    ball.pos,
    ball.radius
  );
  return isAirborne && isAboveBall && isColliding;
}

function detectFloorScore(
  ball: Ball,
  groundY: number,
  netX: number
): 'p1_scores' | 'p2_scores' | null {
  if (ball.pos.y + ball.radius >= groundY) {
    // 공이 오른쪽 코트(P2 코트)에 떨어지면 P1 득점
    if (ball.pos.x > netX) return 'p1_scores';
    // 공이 왼쪽 코트(P1 코트)에 떨어지면 P2 득점
    return 'p2_scores';
  }
  return null;
}

// ========================
// 테스트
// ========================

describe('물리엔진 — 충돌 판정', () => {
  let ball: Ball;
  let player: Player;

  beforeEach(() => {
    ball = {
      pos: { x: 200, y: 200 },
      vel: { x: 3, y: -2 },
      radius: BALL_DEFAULTS.radius,
      gravity: BALL_DEFAULTS.gravity,
      maxSpeed: BALL_DEFAULTS.maxSpeed,
    };

    player = {
      pos: { x: 100, y: COURT.groundY },
      vel: { x: 0, y: 0 },
      radius: PLAYER_DEFAULTS.radius,
      gravity: PLAYER_DEFAULTS.gravity,
    };
  });

  describe('원 충돌 감지 (Circle-Circle)', () => {
    it('캐릭터와 공이 충돌 반경 내일 때 충돌 감지', () => {
      // 거리 = 32 + 20 = 52px 이내
      player.pos = { x: 200, y: 200 };
      ball.pos = { x: 240, y: 200 }; // 거리 40 < 52
      expect(detectCircleCollision(player.pos, player.radius, ball.pos, ball.radius)).toBe(true);
    });

    it('캐릭터와 공이 충돌 반경 밖일 때 충돌 미감지', () => {
      player.pos = { x: 100, y: 200 };
      ball.pos = { x: 200, y: 200 }; // 거리 100 > 52
      expect(detectCircleCollision(player.pos, player.radius, ball.pos, ball.radius)).toBe(false);
    });

    it('정확히 반경 합과 같은 거리에서 충돌 감지 (경계값)', () => {
      player.pos = { x: 100, y: 200 };
      ball.pos = { x: 152, y: 200 }; // 거리 = 52 = 32 + 20
      expect(detectCircleCollision(player.pos, player.radius, ball.pos, ball.radius)).toBe(true);
    });
  });

  describe('캐릭터-공 충돌 반사', () => {
    it('공이 캐릭터 오른쪽에서 충돌하면 오른쪽으로 반사', () => {
      player.pos = { x: 100, y: 200 };
      ball.pos = { x: 140, y: 200 };
      ball.vel = { x: -3, y: 0 };

      const newVel = resolvePlayerBallCollision(player, ball);
      expect(newVel.x).toBeGreaterThan(0); // 오른쪽으로 반사
    });

    it('공이 캐릭터 위에서 충돌하면 위로 반사', () => {
      player.pos = { x: 200, y: 220 };
      ball.pos = { x: 200, y: 180 };
      ball.vel = { x: 0, y: 3 };

      const newVel = resolvePlayerBallCollision(player, ball);
      expect(newVel.y).toBeLessThan(0); // 위로 반사
    });

    it('반사 벡터 방향이 캐릭터→공 방향과 일치', () => {
      player.pos = { x: 100, y: 200 };
      ball.pos = { x: 130, y: 170 }; // 우상단
      ball.vel = { x: -5, y: 2 };

      const newVel = resolvePlayerBallCollision(player, ball);
      // 반사 방향은 (30, -30) 정규화 → 우상단
      expect(newVel.x).toBeGreaterThan(0);
      expect(newVel.y).toBeLessThan(0);
    });
  });

  describe('바닥 바운스 (계수 0.7)', () => {
    it('공이 바닥에 닿으면 y 속도가 반전되고 0.7배로 감소', () => {
      ball.pos = { x: 200, y: COURT.groundY - ball.radius + 5 }; // 바닥 관통
      ball.vel = { x: 3, y: 10 };

      const bounced = applyFloorBounce(ball, COURT.groundY);
      expect(bounced.vel.y).toBeCloseTo(-10 * 0.7);
      expect(bounced.pos.y).toBe(COURT.groundY - ball.radius);
    });

    it('바닥 위에 있는 공은 바운스 미발생', () => {
      ball.pos = { x: 200, y: 100 };
      ball.vel = { x: 3, y: 5 };

      const result = applyFloorBounce(ball, COURT.groundY);
      expect(result.vel.y).toBe(5); // 변화 없음
    });

    it('반복 바운스 시 에너지 감쇠 (0.7^n)', () => {
      let b = { ...ball, pos: { x: 200, y: COURT.groundY }, vel: { x: 0, y: 10 } };

      // 1차 바운스
      b = applyFloorBounce(b, COURT.groundY);
      expect(Math.abs(b.vel.y)).toBeCloseTo(7);

      // 공을 다시 바닥에 놓기
      b.pos.y = COURT.groundY;
      b.vel.y = Math.abs(b.vel.y); // 다시 아래로

      // 2차 바운스
      b = applyFloorBounce(b, COURT.groundY);
      expect(Math.abs(b.vel.y)).toBeCloseTo(4.9);
    });
  });

  describe('벽 바운스 (계수 1.0)', () => {
    it('왼쪽 벽 충돌 시 x 속도 완전 반전', () => {
      ball.pos = { x: 5, y: 200 }; // 왼쪽 벽 근처
      ball.vel = { x: -8, y: 3 };

      const bounced = applyWallBounce(ball, COURT.width);
      expect(bounced.vel.x).toBe(8); // 완전 반전 (계수 1.0)
    });

    it('오른쪽 벽 충돌 시 x 속도 완전 반전', () => {
      ball.pos = { x: COURT.width - 5, y: 200 };
      ball.vel = { x: 8, y: 3 };

      const bounced = applyWallBounce(ball, COURT.width);
      expect(bounced.vel.x).toBe(-8);
    });

    it('벽 바운스 시 에너지 손실 없음', () => {
      ball.pos = { x: 5, y: 200 };
      ball.vel = { x: -10, y: 5 };

      const bounced = applyWallBounce(ball, COURT.width);
      const speedBefore = Math.sqrt(10 ** 2 + 5 ** 2);
      const speedAfter = Math.sqrt(bounced.vel.x ** 2 + bounced.vel.y ** 2);
      expect(speedAfter).toBeCloseTo(speedBefore);
    });
  });

  describe('네트 충돌 (계수 1.0)', () => {
    it('좌→우 이동 중 네트 충돌 시 왼쪽으로 반사', () => {
      ball.pos = { x: COURT.netX - 10, y: 150 }; // 네트 근처
      ball.vel = { x: 8, y: 2 };

      const bounced = applyNetCollision(ball, COURT);
      expect(bounced.vel.x).toBe(-8);
    });

    it('네트 높이 위의 공은 네트 충돌 미발생', () => {
      const netTop = COURT.groundY - COURT.netHeight; // = 88
      ball.pos = { x: COURT.netX, y: netTop - ball.radius - 10 }; // 네트 위
      ball.vel = { x: 5, y: -3 };

      const result = applyNetCollision(ball, COURT);
      expect(result.vel.x).toBe(5); // 변화 없음
    });
  });

  describe('중력 적용', () => {
    it('공에 매 프레임 0.25px/frame² 중력 적용', () => {
      ball.vel = { x: 5, y: 0 };

      const after = applyGravity(ball);
      expect(after.vel.y).toBe(0.25);

      // 10프레임 후
      let b = ball;
      for (let i = 0; i < 10; i++) {
        b = applyGravity(b);
      }
      expect(b.vel.y).toBeCloseTo(2.5);
    });
  });

  describe('최대 속도 제한', () => {
    it('속도가 15px/frame 초과 시 클램핑', () => {
      ball.vel = { x: 20, y: 0 };

      const clamped = clampSpeed(ball);
      const speed = Math.sqrt(clamped.vel.x ** 2 + clamped.vel.y ** 2);
      expect(speed).toBeCloseTo(15);
    });

    it('속도가 15px/frame 이하면 변화 없음', () => {
      ball.vel = { x: 10, y: 5 };

      const result = clampSpeed(ball);
      expect(result.vel.x).toBe(10);
      expect(result.vel.y).toBe(5);
    });
  });

  describe('스파이크 판정', () => {
    it('공중 + 공 위 + 충돌 시 스파이크 판정', () => {
      player.pos = { x: 200, y: 150 }; // 공중 (groundY=264보다 위)
      ball.pos = { x: 210, y: 175 }; // 플레이어보다 아래

      expect(detectSpike(player, ball, COURT.groundY)).toBe(true);
    });

    it('지상에 있으면 스파이크 미발동', () => {
      player.pos = { x: 200, y: COURT.groundY }; // 지상
      ball.pos = { x: 210, y: COURT.groundY - 20 };

      expect(detectSpike(player, ball, COURT.groundY)).toBe(false);
    });

    it('공이 플레이어보다 위에 있으면 스파이크 미발동', () => {
      player.pos = { x: 200, y: 180 }; // 공중이지만
      ball.pos = { x: 210, y: 150 }; // 공이 더 위

      expect(detectSpike(player, ball, COURT.groundY)).toBe(false);
    });
  });

  describe('득점 판정', () => {
    it('공이 P2 코트 바닥에 닿으면 P1 득점', () => {
      ball.pos = { x: 300, y: COURT.groundY }; // 오른쪽 코트
      expect(detectFloorScore(ball, COURT.groundY, COURT.netX)).toBe('p1_scores');
    });

    it('공이 P1 코트 바닥에 닿으면 P2 득점', () => {
      ball.pos = { x: 100, y: COURT.groundY }; // 왼쪽 코트
      expect(detectFloorScore(ball, COURT.groundY, COURT.netX)).toBe('p2_scores');
    });

    it('공이 바닥에 닿지 않으면 득점 없음', () => {
      ball.pos = { x: 300, y: 200 }; // 공중
      expect(detectFloorScore(ball, COURT.groundY, COURT.netX)).toBeNull();
    });
  });
});
