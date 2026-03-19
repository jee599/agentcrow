// ─── Game Constants ───

export const COURT_WIDTH = 800;
export const COURT_HEIGHT = 400;
export const NET_X = COURT_WIDTH / 2;
export const NET_HEIGHT = 180;
export const NET_TOP_Y = COURT_HEIGHT - NET_HEIGHT; // y=0 is top
export const NET_HALF_WIDTH = 5;

export const BALL_RADIUS = 20;
export const BALL_GRAVITY = 0.5;
export const BALL_ELASTICITY = 0.75;

export const PLAYER_RADIUS = 30;
export const PLAYER_SPEED = 5;
export const PLAYER_JUMP_VELOCITY = -12;
export const PLAYER_GRAVITY = 0.5;
export const PLAYER_GROUND_Y = COURT_HEIGHT - PLAYER_RADIUS;

export const WIN_SCORE = 15;
export const TICK_RATE = 60;
export const TICK_INTERVAL = 1000 / TICK_RATE; // ~16.67ms

// ─── Game State Types ───

export interface Vec2 {
  x: number;
  y: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vy: number;
  isJumping: boolean;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
}

export interface GameState {
  ball: BallState;
  players: [PlayerState, PlayerState];
  scores: [number, number];
  server: 1 | 2;
}

// ─── Message Protocol ───

// Client → Server
export type ClientMessage =
  | { type: 'create_room' }
  | { type: 'join_room'; roomId: string }
  | { type: 'input'; keys: PlayerInput }
  | { type: 'list_rooms' };

// Server → Client
export type ServerMessage =
  | { type: 'room_created'; roomId: string }
  | { type: 'room_joined'; roomId: string; playerNumber: 1 | 2 }
  | { type: 'game_start' }
  | { type: 'game_state'; state: GameState }
  | { type: 'score'; scores: [number, number]; server: 1 | 2 }
  | { type: 'game_over'; winner: 1 | 2 }
  | { type: 'opponent_disconnected' }
  | { type: 'room_list'; rooms: RoomInfo[] }
  | { type: 'error'; message: string };

export interface RoomInfo {
  roomId: string;
  playerCount: number;
}
