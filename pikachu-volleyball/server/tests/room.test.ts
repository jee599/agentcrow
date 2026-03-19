import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createRoom,
  joinRoom,
  handleInput,
  handleDisconnect,
  listRooms,
} from '../src/room.js';
import type { WebSocket } from 'ws';

// WebSocket mock
function createMockWs(): WebSocket {
  const messages: string[] = [];
  return {
    readyState: 1, // OPEN
    OPEN: 1,
    send: vi.fn((data: string) => {
      messages.push(data);
    }),
    _messages: messages,
  } as unknown as WebSocket & { _messages: string[] };
}

function getMessages(ws: WebSocket): any[] {
  return (ws as any)._messages.map((m: string) => JSON.parse(m));
}

function getLastMessage(ws: WebSocket): any {
  const msgs = getMessages(ws);
  return msgs[msgs.length - 1];
}

describe('Room — 방 생성', () => {
  it('createRoom 호출 시 room_created 메시지를 보낸다', () => {
    const ws = createMockWs();
    createRoom(ws);
    const msgs = getMessages(ws);
    expect(msgs.some((m) => m.type === 'room_created')).toBe(true);
  });

  it('createRoom 호출 시 room_joined 메시지(playerNumber=1)를 보낸다', () => {
    const ws = createMockWs();
    createRoom(ws);
    const msgs = getMessages(ws);
    const joined = msgs.find((m) => m.type === 'room_joined');
    expect(joined).toBeDefined();
    expect(joined.playerNumber).toBe(1);
  });

  it('room_created 메시지에 6자리 roomId가 포함된다', () => {
    const ws = createMockWs();
    createRoom(ws);
    const msgs = getMessages(ws);
    const created = msgs.find((m) => m.type === 'room_created');
    expect(created.roomId).toMatch(/^[A-Z0-9]{6}$/);
  });
});

describe('Room — 방 참가', () => {
  it('존재하지 않는 방에 참가하면 에러 메시지', () => {
    const ws = createMockWs();
    joinRoom(ws, 'NOROOM');
    const msgs = getMessages(ws);
    expect(msgs.some((m) => m.type === 'error')).toBe(true);
  });

  it('2번째 플레이어 참가 시 game_start 메시지를 브로드캐스트', () => {
    const ws1 = createMockWs();
    const ws2 = createMockWs();
    createRoom(ws1);
    const roomId = getMessages(ws1).find((m) => m.type === 'room_created').roomId;

    joinRoom(ws2, roomId);

    const msgs2 = getMessages(ws2);
    expect(msgs2.some((m) => m.type === 'room_joined')).toBe(true);
    expect(msgs2.some((m) => m.type === 'game_start')).toBe(true);

    // 1번 플레이어도 game_start를 받아야 함
    const msgs1 = getMessages(ws1);
    expect(msgs1.some((m) => m.type === 'game_start')).toBe(true);
  });

  it('2번째 참가자는 playerNumber=2를 받는다', () => {
    const ws1 = createMockWs();
    const ws2 = createMockWs();
    createRoom(ws1);
    const roomId = getMessages(ws1).find((m) => m.type === 'room_created').roomId;

    joinRoom(ws2, roomId);
    const joined = getMessages(ws2).find((m) => m.type === 'room_joined');
    expect(joined.playerNumber).toBe(2);
  });
});

describe('Room — 최대 인원 제한', () => {
  it('이미 2명인 방에 참가하면 에러', () => {
    const ws1 = createMockWs();
    const ws2 = createMockWs();
    const ws3 = createMockWs();

    createRoom(ws1);
    const roomId = getMessages(ws1).find((m) => m.type === 'room_created').roomId;

    joinRoom(ws2, roomId);
    joinRoom(ws3, roomId);

    const msgs3 = getMessages(ws3);
    const error = msgs3.find((m) => m.type === 'error');
    expect(error).toBeDefined();
    expect(error.message).toContain('full');
  });
});

describe('Room — 연결 해제', () => {
  it('한 플레이어가 나가면 상대에게 opponent_disconnected 메시지', () => {
    const ws1 = createMockWs();
    const ws2 = createMockWs();

    createRoom(ws1);
    const roomId = getMessages(ws1).find((m) => m.type === 'room_created').roomId;
    joinRoom(ws2, roomId);

    handleDisconnect(ws1);

    const msgs2 = getMessages(ws2);
    expect(msgs2.some((m) => m.type === 'opponent_disconnected')).toBe(true);
  });

  it('연결 해제 후 listRooms에 해당 방이 나오지 않는다', () => {
    const ws1 = createMockWs();
    const ws2 = createMockWs();
    const wsLister = createMockWs();

    createRoom(ws1);
    const roomId = getMessages(ws1).find((m) => m.type === 'room_created').roomId;

    handleDisconnect(ws1);
    listRooms(wsLister);

    const roomList = getMessages(wsLister).find((m) => m.type === 'room_list');
    expect(roomList.rooms.every((r: any) => r.roomId !== roomId)).toBe(true);
  });
});

describe('Room — 입력 처리', () => {
  it('handleInput은 올바른 플레이어의 입력을 갱신한다', () => {
    const ws1 = createMockWs();
    const ws2 = createMockWs();

    createRoom(ws1);
    const roomId = getMessages(ws1).find((m) => m.type === 'room_created').roomId;
    joinRoom(ws2, roomId);

    // handleInput은 에러 없이 실행되어야 함
    expect(() =>
      handleInput(ws1, { left: true, right: false, up: false }),
    ).not.toThrow();
    expect(() =>
      handleInput(ws2, { left: false, right: true, up: true }),
    ).not.toThrow();
  });

  it('방에 없는 소켓의 입력은 무시된다', () => {
    const wsUnknown = createMockWs();
    expect(() =>
      handleInput(wsUnknown, { left: true, right: false, up: false }),
    ).not.toThrow();
  });
});

describe('Room — 방 목록', () => {
  it('대기 중인 방만 목록에 표시된다', () => {
    const ws1 = createMockWs();
    const ws2 = createMockWs();
    const wsLister = createMockWs();

    createRoom(ws1);
    const roomId = getMessages(ws1).find((m) => m.type === 'room_created').roomId;

    // 1명만 있을 때 목록에 나와야 함
    listRooms(wsLister);
    let roomList = getMessages(wsLister).find((m) => m.type === 'room_list');
    expect(roomList.rooms.some((r: any) => r.roomId === roomId)).toBe(true);

    // 2명이 되면 목록에서 사라짐
    joinRoom(ws2, roomId);
    const wsLister2 = createMockWs();
    listRooms(wsLister2);
    roomList = getMessages(wsLister2).find((m) => m.type === 'room_list');
    expect(roomList.rooms.every((r: any) => r.roomId !== roomId)).toBe(true);
  });
});
