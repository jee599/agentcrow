import {
  type Ball,
  type Pikachu,
  type InputState,
  type GameState,
  type PlayerSide,
  CANVAS_WIDTH,
  GROUND_Y,
  NET_X,
  NET_WIDTH,
  NET_TOP,
  BALL_RADIUS,
  BALL_GRAVITY,
  BALL_BOUNCE,
  PIKACHU_HEAD_RADIUS,
  PIKACHU_SPEED,
  PIKACHU_JUMP_POWER,
  PIKACHU_GRAVITY,
  PIKACHU_WIDTH,
  WINNING_SCORE,
} from "./types";

export function createInitialBall(servingSide: PlayerSide): Ball {
  return {
    x: servingSide === "left" ? 200 : 600,
    y: 100,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
  };
}

export function createPikachu(side: PlayerSide): Pikachu {
  return {
    x: side === "left" ? 200 : 600,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    isJumping: false,
    side,
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: "lobby",
    ball: createInitialBall("left"),
    player1: createPikachu("left"),
    player2: createPikachu("right"),
    score: { left: 0, right: 0 },
    servingSide: "left",
    roomId: null,
    mySide: null,
    winner: null,
  };
}

export function updatePikachu(pikachu: Pikachu, input: InputState): Pikachu {
  const next = { ...pikachu };

  // 좌우 이동
  next.vx = 0;
  if (input.left) next.vx = -PIKACHU_SPEED;
  if (input.right) next.vx = PIKACHU_SPEED;

  // 점프
  if (input.jump && !next.isJumping) {
    next.vy = PIKACHU_JUMP_POWER;
    next.isJumping = true;
  }

  // 중력
  next.vy += PIKACHU_GRAVITY;
  next.x += next.vx;
  next.y += next.vy;

  // 바닥 충돌
  if (next.y >= GROUND_Y) {
    next.y = GROUND_Y;
    next.vy = 0;
    next.isJumping = false;
  }

  // 자기 코트 영역 제한
  const halfWidth = PIKACHU_WIDTH / 2;
  if (next.side === "left") {
    next.x = Math.max(halfWidth, Math.min(NET_X - NET_WIDTH / 2 - halfWidth, next.x));
  } else {
    next.x = Math.max(NET_X + NET_WIDTH / 2 + halfWidth, Math.min(CANVAS_WIDTH - halfWidth, next.x));
  }

  return next;
}

export function updateBall(ball: Ball): Ball {
  const next = { ...ball };

  next.vy += BALL_GRAVITY;
  next.x += next.vx;
  next.y += next.vy;

  // 좌우 벽 바운스
  if (next.x - next.radius < 0) {
    next.x = next.radius;
    next.vx = Math.abs(next.vx) * BALL_BOUNCE;
  }
  if (next.x + next.radius > CANVAS_WIDTH) {
    next.x = CANVAS_WIDTH - next.radius;
    next.vx = -Math.abs(next.vx) * BALL_BOUNCE;
  }

  // 천장 바운스
  if (next.y - next.radius < 0) {
    next.y = next.radius;
    next.vy = Math.abs(next.vy) * BALL_BOUNCE;
  }

  // 네트 충돌
  const netLeft = NET_X - NET_WIDTH / 2;
  const netRight = NET_X + NET_WIDTH / 2;

  if (
    next.x + next.radius > netLeft &&
    next.x - next.radius < netRight &&
    next.y + next.radius > NET_TOP
  ) {
    // 공이 네트 위에서 오는 경우 — 위로 바운스
    if (ball.y + ball.radius <= NET_TOP) {
      next.y = NET_TOP - next.radius;
      next.vy = -Math.abs(next.vy) * BALL_BOUNCE;
    } else {
      // 옆에서 오는 경우
      if (ball.x < NET_X) {
        next.x = netLeft - next.radius;
        next.vx = -Math.abs(next.vx) * BALL_BOUNCE;
      } else {
        next.x = netRight + next.radius;
        next.vx = Math.abs(next.vx) * BALL_BOUNCE;
      }
    }
  }

  return next;
}

function checkBallPikachuCollision(ball: Ball, pikachu: Pikachu): Ball | null {
  // 피카츄 머리(상반신)를 원으로 근사
  const headCenterX = pikachu.x;
  const headCenterY = pikachu.y - 30;

  const dx = ball.x - headCenterX;
  const dy = ball.y - headCenterY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.radius + PIKACHU_HEAD_RADIUS;

  if (dist < minDist && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;

    // 공을 겹침 해소
    const overlap = minDist - dist;
    const newBall = { ...ball };
    newBall.x += nx * overlap;
    newBall.y += ny * overlap;

    // 반사 속도 — 피카츄의 속도 반영
    const relVx = ball.vx - pikachu.vx;
    const relVy = ball.vy - pikachu.vy;
    const dot = relVx * nx + relVy * ny;

    if (dot < 0) {
      const bounce = 1.2;
      newBall.vx = ball.vx - (1 + bounce) * dot * nx + pikachu.vx * 0.5;
      newBall.vy = ball.vy - (1 + bounce) * dot * ny + pikachu.vy * 0.5;

      // 속도 제한
      const maxSpeed = 15;
      const speed = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy);
      if (speed > maxSpeed) {
        newBall.vx = (newBall.vx / speed) * maxSpeed;
        newBall.vy = (newBall.vy / speed) * maxSpeed;
      }
    }

    return newBall;
  }

  return null;
}

export function checkScoring(ball: Ball): PlayerSide | null {
  if (ball.y + ball.radius >= GROUND_Y) {
    // 공이 바닥에 닿으면 해당 코트의 상대에게 점수
    return ball.x < NET_X ? "right" : "left";
  }
  return null;
}

// 클라이언트 로컬 예측용 (서버에서 최종 상태를 받기 전까지)
export function tickGameLocally(state: GameState, myInput: InputState): GameState {
  if (state.phase !== "playing") return state;

  const next = { ...state };

  // 내 피카츄만 로컬에서 업데이트 (상대는 서버에서 받음)
  if (state.mySide === "left") {
    next.player1 = updatePikachu(state.player1, myInput);
  } else {
    next.player2 = updatePikachu(state.player2, myInput);
  }

  // 공 물리
  let newBall = updateBall(state.ball);

  // 충돌 판정
  const hit1 = checkBallPikachuCollision(newBall, next.player1);
  if (hit1) newBall = hit1;

  const hit2 = checkBallPikachuCollision(newBall, next.player2);
  if (hit2) newBall = hit2;

  next.ball = newBall;

  return next;
}

export function resetForServe(state: GameState): GameState {
  return {
    ...state,
    ball: createInitialBall(state.servingSide),
    player1: createPikachu("left"),
    player2: createPikachu("right"),
    phase: "playing",
  };
}

export function handleScore(state: GameState, scorer: PlayerSide): GameState {
  const next = { ...state };
  next.score = { ...state.score };
  next.score[scorer] += 1;
  next.servingSide = scorer;

  if (next.score[scorer] >= WINNING_SCORE) {
    next.phase = "gameOver";
    next.winner = scorer;
  } else {
    next.phase = "scored";
  }

  return next;
}
