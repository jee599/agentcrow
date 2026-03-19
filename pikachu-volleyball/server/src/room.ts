import type { WebSocket } from 'ws';
import { Game } from './game.js';
import type { PlayerInput, ServerMessage, RoomInfo } from './types.js';
import { TICK_INTERVAL } from './types.js';

interface Player {
  ws: WebSocket;
  playerNumber: 1 | 2;
}

interface Room {
  id: string;
  players: Player[];
  game: Game | null;
  tickInterval: ReturnType<typeof setInterval> | null;
}

const rooms = new Map<string, Room>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 to avoid confusion
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  // Avoid collision
  if (rooms.has(id)) return generateRoomId();
  return id;
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: ServerMessage): void {
  for (const player of room.players) {
    send(player.ws, msg);
  }
}

function startGameLoop(room: Room): void {
  if (!room.game || room.tickInterval) return;

  room.tickInterval = setInterval(() => {
    if (!room.game) return;

    const scoreEvent = room.game.tick();

    // Broadcast game state every tick
    broadcast(room, {
      type: 'game_state',
      state: room.game.state,
    });

    if (scoreEvent) {
      const gameOver = room.game.isGameOver();
      if (gameOver) {
        broadcast(room, { type: 'game_over', winner: gameOver.winner });
        stopGameLoop(room);
        // Clean up room after game over
        setTimeout(() => destroyRoom(room.id), 5000);
      } else {
        // Switch server to scorer
        const newServer = scoreEvent.scorer;
        broadcast(room, {
          type: 'score',
          scores: room.game.state.scores,
          server: newServer,
        });
        room.game.resetRound(newServer);
      }
    }
  }, TICK_INTERVAL);
}

function stopGameLoop(room: Room): void {
  if (room.tickInterval) {
    clearInterval(room.tickInterval);
    room.tickInterval = null;
  }
}

function destroyRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  stopGameLoop(room);
  rooms.delete(roomId);
}

export function createRoom(ws: WebSocket): void {
  const roomId = generateRoomId();
  const room: Room = {
    id: roomId,
    players: [{ ws, playerNumber: 1 }],
    game: null,
    tickInterval: null,
  };
  rooms.set(roomId, room);
  send(ws, { type: 'room_created', roomId });
  send(ws, { type: 'room_joined', roomId, playerNumber: 1 });
}

export function joinRoom(ws: WebSocket, roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) {
    send(ws, { type: 'error', message: `Room ${roomId} not found` });
    return;
  }
  if (room.players.length >= 2) {
    send(ws, { type: 'error', message: 'Room is full' });
    return;
  }

  room.players.push({ ws, playerNumber: 2 });
  send(ws, { type: 'room_joined', roomId, playerNumber: 2 });

  // Both players joined — start game
  room.game = new Game();
  broadcast(room, { type: 'game_start' });
  startGameLoop(room);
}

export function handleInput(ws: WebSocket, keys: PlayerInput): void {
  const room = findRoomBySocket(ws);
  if (!room || !room.game) return;

  const player = room.players.find((p) => p.ws === ws);
  if (!player) return;

  room.game.inputs[player.playerNumber - 1] = keys;
}

export function listRooms(ws: WebSocket): void {
  const roomList: RoomInfo[] = [];
  for (const [roomId, room] of rooms) {
    if (room.players.length < 2) {
      roomList.push({ roomId, playerCount: room.players.length });
    }
  }
  send(ws, { type: 'room_list', rooms: roomList });
}

export function handleDisconnect(ws: WebSocket): void {
  const room = findRoomBySocket(ws);
  if (!room) return;

  // Notify remaining player
  const remaining = room.players.find((p) => p.ws !== ws);
  if (remaining) {
    send(remaining.ws, { type: 'opponent_disconnected' });
  }

  stopGameLoop(room);
  rooms.delete(room.id);
}

function findRoomBySocket(ws: WebSocket): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.ws === ws)) {
      return room;
    }
  }
  return undefined;
}
