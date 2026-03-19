"use client";

import { useState } from "react";
import { type RoomInfo } from "@/lib/game/types";

interface LobbyProps {
  rooms: RoomInfo[];
  connected: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function Lobby({ rooms, connected, onCreateRoom, onJoinRoom }: LobbyProps) {
  const [joinCode, setJoinCode] = useState("");

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* 연결 상태 */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
        />
        <span className={connected ? "text-green-400" : "text-red-400"}>
          {connected ? "Connected" : "Connecting..."}
        </span>
      </div>

      {/* 방 만들기 */}
      <button
        onClick={onCreateRoom}
        disabled={!connected}
        className="w-full rounded-lg bg-yellow-500 px-6 py-3 text-lg font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create Room
      </button>

      {/* 코드로 참가 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Room code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          className="flex-1 rounded-lg bg-gray-800 px-4 py-3 text-center font-mono text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-500"
          maxLength={6}
        />
        <button
          onClick={() => {
            if (joinCode.trim()) onJoinRoom(joinCode.trim());
          }}
          disabled={!connected || !joinCode.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Join
        </button>
      </div>

      {/* 방 목록 */}
      {rooms.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-400">
            Open Rooms
          </h3>
          <div className="space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onJoinRoom(room.id)}
                disabled={!connected}
                className="flex w-full items-center justify-between rounded-lg bg-gray-800 px-4 py-3 text-left transition hover:bg-gray-700 disabled:opacity-50"
              >
                <span className="font-mono text-white">{room.id}</span>
                <span className="text-sm text-gray-400">
                  {room.playerCount}/2
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 조작법 */}
      <div className="rounded-lg bg-gray-800/50 p-4 text-sm text-gray-400">
        <p className="mb-2 font-medium text-gray-300">Controls</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span>Move</span>
          <span className="font-mono text-gray-300">Arrow Keys / A, D</span>
          <span>Jump</span>
          <span className="font-mono text-gray-300">Up / W / Space</span>
        </div>
      </div>
    </div>
  );
}
