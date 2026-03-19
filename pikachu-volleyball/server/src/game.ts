import {
  type BallState,
  type PlayerState,
  type PlayerInput,
  type GameState,
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
} from './types.js';

export class Game {
  state: GameState;
  inputs: [PlayerInput, PlayerInput];
  private roundOver = false;
  private roundOverTimer = 0;
  private static readonly ROUND_OVER_DELAY = 60; // 1 second at 60fps

  constructor() {
    this.inputs = [
      { left: false, right: false, up: false },
      { left: false, right: false, up: false },
    ];
    this.state = this.createInitialState(1);
  }

  private createInitialState(server: 1 | 2): GameState {
    const ballX = server === 1 ? 200 : 600;
    return {
      ball: { x: ballX, y: 100, vx: 0, vy: 0 },
      players: [
        { x: 200, y: PLAYER_GROUND_Y, vy: 0, isJumping: false },
        { x: 600, y: PLAYER_GROUND_Y, vy: 0, isJumping: false },
      ],
      scores: this.state?.scores ?? [0, 0],
      server,
    };
  }

  resetRound(server: 1 | 2): void {
    const scores = this.state.scores;
    this.state = this.createInitialState(server);
    this.state.scores = scores;
    this.roundOver = false;
    this.roundOverTimer = 0;
    this.inputs = [
      { left: false, right: false, up: false },
      { left: false, right: false, up: false },
    ];
  }

  /** Returns scoring event or null */
  tick(): { scorer: 1 | 2 } | null {
    // During round-over delay, just count down
    if (this.roundOver) {
      this.roundOverTimer--;
      if (this.roundOverTimer <= 0) {
        this.roundOver = false;
      }
      return null;
    }

    this.updatePlayer(0);
    this.updatePlayer(1);
    this.updateBall();

    // Check floor collision (scoring)
    const ballBottomY = this.state.ball.y + BALL_RADIUS;
    if (ballBottomY >= COURT_HEIGHT) {
      // Ball hit the floor
      const scorer: 1 | 2 = this.state.ball.x < NET_X ? 2 : 1;
      this.state.scores[scorer - 1]++;
      this.roundOver = true;
      this.roundOverTimer = Game.ROUND_OVER_DELAY;
      return { scorer };
    }

    return null;
  }

  isGameOver(): { winner: 1 | 2 } | null {
    if (this.state.scores[0] >= WIN_SCORE) return { winner: 1 };
    if (this.state.scores[1] >= WIN_SCORE) return { winner: 2 };
    return null;
  }

  private updatePlayer(index: number): void {
    const player = this.state.players[index];
    const input = this.inputs[index];

    // Horizontal movement
    if (input.left) player.x -= PLAYER_SPEED;
    if (input.right) player.x += PLAYER_SPEED;

    // Clamp to own side
    if (index === 0) {
      player.x = Math.max(PLAYER_RADIUS, Math.min(NET_X - NET_HALF_WIDTH - PLAYER_RADIUS, player.x));
    } else {
      player.x = Math.max(NET_X + NET_HALF_WIDTH + PLAYER_RADIUS, Math.min(COURT_WIDTH - PLAYER_RADIUS, player.x));
    }

    // Jump
    if (input.up && !player.isJumping) {
      player.vy = PLAYER_JUMP_VELOCITY;
      player.isJumping = true;
    }

    // Gravity
    player.vy += PLAYER_GRAVITY;
    player.y += player.vy;

    // Ground collision
    if (player.y >= PLAYER_GROUND_Y) {
      player.y = PLAYER_GROUND_Y;
      player.vy = 0;
      player.isJumping = false;
    }
  }

  private updateBall(): void {
    const ball = this.state.ball;

    // Gravity
    ball.vy += BALL_GRAVITY;

    // Move
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions
    if (ball.x - BALL_RADIUS <= 0) {
      ball.x = BALL_RADIUS;
      ball.vx = Math.abs(ball.vx) * BALL_ELASTICITY;
    }
    if (ball.x + BALL_RADIUS >= COURT_WIDTH) {
      ball.x = COURT_WIDTH - BALL_RADIUS;
      ball.vx = -Math.abs(ball.vx) * BALL_ELASTICITY;
    }

    // Ceiling collision
    if (ball.y - BALL_RADIUS <= 0) {
      ball.y = BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * BALL_ELASTICITY;
    }

    // Net collision
    this.handleNetCollision(ball);

    // Player collisions
    this.handlePlayerCollision(ball, this.state.players[0]);
    this.handlePlayerCollision(ball, this.state.players[1]);
  }

  private handleNetCollision(ball: BallState): void {
    const netTopY = COURT_HEIGHT - NET_HEIGHT;

    // Ball must be near the net vertically (below top of net)
    if (ball.y + BALL_RADIUS < netTopY) return;

    // Check horizontal proximity to net
    const distX = Math.abs(ball.x - NET_X);
    if (distX < BALL_RADIUS + NET_HALF_WIDTH) {
      // Top of net collision (ball coming from above)
      if (ball.y - BALL_RADIUS < netTopY && ball.y + BALL_RADIUS > netTopY) {
        if (ball.vy > 0) {
          ball.y = netTopY - BALL_RADIUS;
          ball.vy = -ball.vy * BALL_ELASTICITY;
          return;
        }
      }

      // Side of net collision
      if (ball.x < NET_X) {
        ball.x = NET_X - NET_HALF_WIDTH - BALL_RADIUS;
      } else {
        ball.x = NET_X + NET_HALF_WIDTH + BALL_RADIUS;
      }
      ball.vx = -ball.vx * BALL_ELASTICITY;
    }
  }

  private handlePlayerCollision(ball: BallState, player: PlayerState): void {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = BALL_RADIUS + PLAYER_RADIUS;

    if (dist >= minDist || dist === 0) return;

    // Normalize collision vector
    const nx = dx / dist;
    const ny = dy / dist;

    // Separate ball from player
    ball.x = player.x + nx * minDist;
    ball.y = player.y + ny * minDist;

    // Reflect velocity
    const relVx = ball.vx;
    const relVy = ball.vy - player.vy;
    const dot = relVx * nx + relVy * ny;

    // Only resolve if moving toward each other
    if (dot < 0) return;

    const impulse = dot * (1 + BALL_ELASTICITY);
    ball.vx -= impulse * nx;
    ball.vy -= impulse * ny;

    // Add a slight upward kick when player is rising (headbutt)
    if (player.vy < 0) {
      ball.vy += player.vy * 0.5;
    }

    // Clamp ball speed
    const maxSpeed = 15;
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > maxSpeed) {
      ball.vx = (ball.vx / speed) * maxSpeed;
      ball.vy = (ball.vy / speed) * maxSpeed;
    }
  }
}
