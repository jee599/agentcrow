"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Lobby from "@/components/Lobby";
import { getSocket } from "@/lib/socket/client";
import { type RoomInfo, type ServerMessage } from "@/lib/game/types";

export default function Home() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "roomCreated":
        case "roomJoined":
          // 방에 입장하면 게임 페이지로 이동, side/roomId를 쿼리로 전달
          router.push(`/game?roomId=${msg.roomId}&side=${msg.side}`);
          break;
        case "roomList":
          setRooms(msg.rooms);
          break;
        case "error":
          alert(msg.message);
          break;
      }
    },
    [router],
  );

  useEffect(() => {
    const socket = getSocket();

    socket.onConnect(() => setConnected(true));
    socket.onDisconnect(() => setConnected(false));
    const unsub = socket.onMessage(handleMessage);

    socket.connect();

    return () => {
      unsub();
    };
  }, [handleMessage]);

  const handleCreateRoom = () => {
    getSocket().send({ type: "createRoom" });
  };

  const handleJoinRoom = (roomId: string) => {
    getSocket().send({ type: "joinRoom", roomId });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="mb-1 text-4xl font-bold text-yellow-400">
          Pikachu Volleyball
        </h1>
        <p className="text-sm text-gray-400">Multiplayer — First to 15 wins!</p>
      </div>

      <Lobby
        rooms={rooms}
        connected={connected}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    </main>
  );
}
