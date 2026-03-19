import { WebSocketServer } from 'ws';
import { createRoom, joinRoom, handleInput, listRooms, handleDisconnect } from './room.js';
import type { ClientMessage } from './types.js';

const PORT = 3001;

const wss = new WebSocketServer({ port: PORT });

console.log(`Pikachu Volleyball server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log(`Client connected (total: ${wss.clients.size})`);

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    switch (msg.type) {
      case 'create_room':
        createRoom(ws);
        break;
      case 'join_room':
        joinRoom(ws, msg.roomId);
        break;
      case 'input':
        handleInput(ws, msg.keys);
        break;
      case 'list_rooms':
        listRooms(ws);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type` }));
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected (total: ${wss.clients.size})`);
    handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    handleDisconnect(ws);
  });
});
