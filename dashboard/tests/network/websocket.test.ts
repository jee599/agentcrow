/**
 * WebSocket 연결 안정성 테스트
 * PRD 기준: 5초 내 재연결, 최대 3회 시도, 300ms 초과 시 경고
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// --- 타입 정의 (PRD 기반) ---

interface ClientInput {
  type: 'input';
  seq: number;
  keys: {
    left: boolean;
    right: boolean;
    up: boolean;
    powerHit: boolean;
  };
  timestamp: number;
}

interface GameState {
  type: 'state';
  seq: number;
  ball: { x: number; y: number; vx: number; vy: number };
  players: [
    { x: number; y: number; vy: number; state: string },
    { x: number; y: number; vy: number; state: string },
  ];
  score: [number, number];
  servingPlayer: 0 | 1;
  phase: 'serving' | 'playing' | 'scoring' | 'gameOver';
  lastInputSeq: [number, number];
}

interface CreateRoom {
  type: 'createRoom';
}

interface JoinRoom {
  type: 'joinRoom';
  roomId: string;
}

interface RoomState {
  type: 'roomState';
  roomId: string;
  players: string[];
  status: 'waiting' | 'ready' | 'playing';
}

type ServerMessage = GameState | RoomState | { type: 'error'; message: string };
type ClientMessage = ClientInput | CreateRoom | JoinRoom;

// --- 목 WebSocket 클라이언트 (테스트용) ---

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

class MockGameClient {
  state: ConnectionState = 'disconnected';
  reconnectAttempts = 0;
  maxReconnectAttempts = 3;
  reconnectTimeoutMs = 5000;
  inputSeq = 0;
  pendingInputs: ClientInput[] = [];
  lastServerState: GameState | null = null;
  latencyMs = 0;
  onLatencyWarning: ((ms: number) => void) | null = null;
  onStateUpdate: ((state: GameState) => void) | null = null;
  onDisconnect: (() => void) | null = null;
  onReconnect: (() => void) | null = null;

  private sendBuffer: ClientMessage[] = [];
  private connected = false;

  connect(): Promise<void> {
    this.state = 'connecting';
    return new Promise((resolve) => {
      setTimeout(() => {
        this.state = 'connected';
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      }, 10);
    });
  }

  disconnect(): void {
    this.state = 'disconnected';
    this.connected = false;
    this.onDisconnect?.();
  }

  async reconnect(): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return false;
    }

    this.state = 'reconnecting';
    this.reconnectAttempts++;

    try {
      await this.connect();
      this.onReconnect?.();
      // 재연결 시 미처리 입력 재전송
      this.flushPendingInputs();
      return true;
    } catch {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        return this.reconnect();
      }
      return false;
    }
  }

  sendInput(keys: ClientInput['keys']): ClientInput {
    this.inputSeq++;
    const input: ClientInput = {
      type: 'input',
      seq: this.inputSeq,
      keys,
      timestamp: Date.now(),
    };

    this.pendingInputs.push(input);

    if (this.connected) {
      this.sendBuffer.push(input);
    }

    return input;
  }

  receiveState(state: GameState): void {
    this.lastServerState = state;

    // lastInputSeq 기반으로 확인된 입력 제거
    const confirmedSeq = state.lastInputSeq[0]; // P1 기준
    this.pendingInputs = this.pendingInputs.filter((i) => i.seq > confirmedSeq);

    // 레이턴시 계산
    if (this.latencyMs > 300) {
      this.onLatencyWarning?.(this.latencyMs);
    }

    this.onStateUpdate?.(state);
  }

  private flushPendingInputs(): void {
    for (const input of this.pendingInputs) {
      this.sendBuffer.push(input);
    }
  }

  getSendBuffer(): ClientMessage[] {
    return [...this.sendBuffer];
  }

  clearSendBuffer(): void {
    this.sendBuffer = [];
  }

  simulateLatency(ms: number): void {
    this.latencyMs = ms;
  }
}

// --- 목 게임 서버 (테스트용) ---

interface Room {
  id: string;
  players: string[];
  status: 'waiting' | 'ready' | 'playing';
  gameState: GameState | null;
}

class MockGameServer {
  rooms: Map<string, Room> = new Map();
  tickRate = 60; // Hz
  broadcastRate = 30; // Hz
  private tickCount = 0;

  createRoom(): string {
    const roomId = `room_${Math.random().toString(36).slice(2, 8)}`;
    this.rooms.set(roomId, {
      id: roomId,
      players: [],
      status: 'waiting',
      gameState: null,
    });
    return roomId;
  }

  joinRoom(roomId: string, playerId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= 2) return null;

    room.players.push(playerId);
    if (room.players.length === 2) {
      room.status = 'ready';
    }

    return {
      type: 'roomState',
      roomId: room.id,
      players: room.players,
      status: room.status,
    };
  }

  startGame(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'ready') return null;

    room.status = 'playing';
    room.gameState = {
      type: 'state',
      seq: 0,
      ball: { x: 108, y: 200, vx: 0, vy: 0 },
      players: [
        { x: 108, y: 264, vy: 0, state: 'idle' },
        { x: 324, y: 264, vy: 0, state: 'idle' },
      ],
      score: [0, 0],
      servingPlayer: 0,
      phase: 'serving',
      lastInputSeq: [0, 0],
    };

    return room.gameState;
  }

  tick(roomId: string, inputs: Map<number, ClientInput>): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room?.gameState) return null;

    this.tickCount++;
    room.gameState.seq = this.tickCount;

    // 입력 적용
    for (const [playerIdx, input] of inputs) {
      room.gameState.lastInputSeq[playerIdx] = input.seq;
    }

    // 30Hz 브로드캐스트 (매 2틱마다)
    if (this.tickCount % 2 === 0) {
      return { ...room.gameState };
    }

    return null;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }
}

// ========================
// 테스트
// ========================

describe('WebSocket 연결 안정성', () => {
  let client: MockGameClient;
  let server: MockGameServer;

  beforeEach(() => {
    client = new MockGameClient();
    server = new MockGameServer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('기본 연결/해제', () => {
    it('클라이언트가 서버에 연결 가능', async () => {
      vi.useRealTimers();
      await client.connect();
      expect(client.state).toBe('connected');
    });

    it('연결 해제 시 상태가 disconnected로 변경', async () => {
      vi.useRealTimers();
      await client.connect();
      client.disconnect();
      expect(client.state).toBe('disconnected');
    });

    it('연결 해제 시 onDisconnect 콜백 호출', async () => {
      vi.useRealTimers();
      const onDisconnect = vi.fn();
      client.onDisconnect = onDisconnect;

      await client.connect();
      client.disconnect();

      expect(onDisconnect).toHaveBeenCalledOnce();
    });
  });

  describe('재연결 로직', () => {
    it('연결 끊김 후 자동 재연결 시도', async () => {
      vi.useRealTimers();
      await client.connect();
      client.disconnect();

      const result = await client.reconnect();
      expect(result).toBe(true);
      expect(client.state).toBe('connected');
    });

    it('재연결 시 시도 횟수 초기화', async () => {
      vi.useRealTimers();
      await client.connect();
      client.disconnect();
      client.reconnectAttempts = 2;

      await client.reconnect();
      expect(client.reconnectAttempts).toBe(0); // connect() 내에서 초기화
    });

    it('최대 3회 재연결 실패 시 포기', async () => {
      client.reconnectAttempts = 3;
      const result = await client.reconnect();
      expect(result).toBe(false);
    });

    it('재연결 성공 시 onReconnect 콜백 호출', async () => {
      vi.useRealTimers();
      const onReconnect = vi.fn();
      client.onReconnect = onReconnect;

      await client.connect();
      client.disconnect();
      await client.reconnect();

      expect(onReconnect).toHaveBeenCalledOnce();
    });

    it('재연결 시 미처리 입력 재전송', async () => {
      vi.useRealTimers();
      await client.connect();

      // 입력 전송
      client.sendInput({ left: true, right: false, up: false, powerHit: false });
      client.sendInput({ left: false, right: true, up: false, powerHit: false });

      client.clearSendBuffer();
      client.disconnect();

      // 재연결
      await client.reconnect();

      // 미처리 입력 2개가 재전송되었는지 확인
      const buffer = client.getSendBuffer();
      expect(buffer.length).toBe(2);
    });
  });

  describe('방 생성/참가', () => {
    it('방 생성 시 고유 roomId 반환', () => {
      const roomId = server.createRoom();
      expect(roomId).toMatch(/^room_/);
    });

    it('방 참가 — 1명 참가 시 waiting 상태', () => {
      const roomId = server.createRoom();
      const state = server.joinRoom(roomId, 'player1');

      expect(state).not.toBeNull();
      expect(state!.status).toBe('waiting');
      expect(state!.players).toHaveLength(1);
    });

    it('방 참가 — 2명 참가 시 ready 상태', () => {
      const roomId = server.createRoom();
      server.joinRoom(roomId, 'player1');
      const state = server.joinRoom(roomId, 'player2');

      expect(state!.status).toBe('ready');
      expect(state!.players).toHaveLength(2);
    });

    it('3번째 플레이어 참가 거부', () => {
      const roomId = server.createRoom();
      server.joinRoom(roomId, 'player1');
      server.joinRoom(roomId, 'player2');
      const result = server.joinRoom(roomId, 'player3');

      expect(result).toBeNull();
    });

    it('존재하지 않는 방 참가 시 null 반환', () => {
      const result = server.joinRoom('nonexistent', 'player1');
      expect(result).toBeNull();
    });
  });

  describe('게임 시작 및 상태 동기화', () => {
    it('2명 ready 시 게임 시작 가능', () => {
      const roomId = server.createRoom();
      server.joinRoom(roomId, 'player1');
      server.joinRoom(roomId, 'player2');

      const state = server.startGame(roomId);
      expect(state).not.toBeNull();
      expect(state!.phase).toBe('serving');
      expect(state!.score).toEqual([0, 0]);
      expect(state!.servingPlayer).toBe(0);
    });

    it('1명만 있는 방에서 게임 시작 불가', () => {
      const roomId = server.createRoom();
      server.joinRoom(roomId, 'player1');

      const state = server.startGame(roomId);
      expect(state).toBeNull();
    });

    it('서버 tick rate 60Hz, 브로드캐스트 30Hz (매 2틱마다 상태 전송)', () => {
      const roomId = server.createRoom();
      server.joinRoom(roomId, 'player1');
      server.joinRoom(roomId, 'player2');
      server.startGame(roomId);

      const inputs = new Map<number, ClientInput>();
      const broadcastedStates: GameState[] = [];

      // 60틱 실행
      for (let i = 0; i < 60; i++) {
        const state = server.tick(roomId, inputs);
        if (state) broadcastedStates.push(state);
      }

      // 30Hz → 60틱에서 30번 브로드캐스트
      expect(broadcastedStates.length).toBe(30);
    });
  });

  describe('입력 전송 및 Reconciliation', () => {
    it('입력 시퀀스 번호 자동 증가', () => {
      const keys = { left: true, right: false, up: false, powerHit: false };
      const input1 = client.sendInput(keys);
      const input2 = client.sendInput(keys);

      expect(input1.seq).toBe(1);
      expect(input2.seq).toBe(2);
    });

    it('서버 상태 수신 시 확인된 입력 제거 (Reconciliation)', async () => {
      vi.useRealTimers();
      await client.connect();

      const keys = { left: true, right: false, up: false, powerHit: false };
      client.sendInput(keys); // seq 1
      client.sendInput(keys); // seq 2
      client.sendInput(keys); // seq 3

      expect(client.pendingInputs).toHaveLength(3);

      // 서버가 seq 2까지 처리했다고 알림
      client.receiveState({
        type: 'state',
        seq: 10,
        ball: { x: 200, y: 200, vx: 0, vy: 0 },
        players: [
          { x: 100, y: 264, vy: 0, state: 'idle' },
          { x: 300, y: 264, vy: 0, state: 'idle' },
        ],
        score: [0, 0],
        servingPlayer: 0,
        phase: 'playing',
        lastInputSeq: [2, 0],
      });

      // seq 3만 남아야 함
      expect(client.pendingInputs).toHaveLength(1);
      expect(client.pendingInputs[0].seq).toBe(3);
    });
  });

  describe('레이턴시 경고', () => {
    it('300ms 초과 시 경고 콜백 호출', async () => {
      vi.useRealTimers();
      const onWarning = vi.fn();
      client.onLatencyWarning = onWarning;

      await client.connect();
      client.simulateLatency(350);

      client.receiveState({
        type: 'state',
        seq: 1,
        ball: { x: 200, y: 200, vx: 0, vy: 0 },
        players: [
          { x: 100, y: 264, vy: 0, state: 'idle' },
          { x: 300, y: 264, vy: 0, state: 'idle' },
        ],
        score: [0, 0],
        servingPlayer: 0,
        phase: 'playing',
        lastInputSeq: [0, 0],
      });

      expect(onWarning).toHaveBeenCalledWith(350);
    });

    it('300ms 이하에서는 경고 없음', async () => {
      vi.useRealTimers();
      const onWarning = vi.fn();
      client.onLatencyWarning = onWarning;

      await client.connect();
      client.simulateLatency(200);

      client.receiveState({
        type: 'state',
        seq: 1,
        ball: { x: 200, y: 200, vx: 0, vy: 0 },
        players: [
          { x: 100, y: 264, vy: 0, state: 'idle' },
          { x: 300, y: 264, vy: 0, state: 'idle' },
        ],
        score: [0, 0],
        servingPlayer: 0,
        phase: 'playing',
        lastInputSeq: [0, 0],
      });

      expect(onWarning).not.toHaveBeenCalled();
    });
  });

  describe('프로토콜 메시지 구조', () => {
    it('ClientInput 메시지 구조 검증', () => {
      const keys = { left: true, right: false, up: true, powerHit: false };
      const input = client.sendInput(keys);

      expect(input).toMatchObject({
        type: 'input',
        seq: expect.any(Number),
        keys: { left: true, right: false, up: true, powerHit: false },
        timestamp: expect.any(Number),
      });
    });

    it('GameState 메시지 구조 검증', () => {
      const roomId = server.createRoom();
      server.joinRoom(roomId, 'p1');
      server.joinRoom(roomId, 'p2');
      const state = server.startGame(roomId);

      expect(state).toMatchObject({
        type: 'state',
        seq: expect.any(Number),
        ball: { x: expect.any(Number), y: expect.any(Number), vx: expect.any(Number), vy: expect.any(Number) },
        players: expect.any(Array),
        score: [0, 0],
        servingPlayer: expect.any(Number),
        phase: expect.any(String),
        lastInputSeq: expect.any(Array),
      });

      expect(state!.players).toHaveLength(2);
    });
  });
});
