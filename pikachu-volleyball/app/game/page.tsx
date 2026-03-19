"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import ScoreBoard from "@/components/ScoreBoard";
import { getSocket } from "@/lib/socket/client";
import { InputManager } from "@/lib/game/input";
import { createInitialGameState, tickGameLocally } from "@/lib/game/engine";
import {
  type GameState,
  type PlayerSide,
  type ServerMessage,
} from "@/lib/game/types";

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("roomId");
  const side = searchParams.get("side") as PlayerSide | null;

  const [gameState, setGameState] = useState<GameState>(() => {
    const state = createInitialGameState();
    state.roomId = roomId;
    state.mySide = side;
    state.phase = "waiting";
    return state;
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const inputManagerRef = useRef<InputManager | null>(null);
  const frameRef = useRef<number>(0);
  const lastInputRef = useRef<string>("");

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "gameStart":
          setGameState((prev) => ({ ...prev, phase: "playing" }));
          break;

        case "gameState":
          setGameState((prev) => ({
            ...prev,
            ball: msg.state.ball,
            player1: msg.state.player1,
            player2: msg.state.player2,
            score: msg.state.score,
            phase: msg.state.phase,
            servingSide: msg.state.servingSide,
          }));
          break;

        case "scored":
          setGameState((prev) => ({
            ...prev,
            score: msg.score,
            servingSide: msg.scorer,
            phase: "scored",
          }));
          break;

        case "gameOver":
          setGameState((prev) => ({
            ...prev,
            score: msg.score,
            winner: msg.winner,
            phase: "gameOver",
          }));
          break;

        case "opponentDisconnected":
          setGameState((prev) => ({ ...prev, phase: "waiting" }));
          break;
      }
    },
    [],
  );

  useEffect(() => {
    if (!roomId || !side) {
      router.push("/");
      return;
    }

    const socket = getSocket();
    const unsub = socket.onMessage(handleMessage);

    // 서버에 준비 완료 알림
    socket.send({ type: "ready" });

    const inputManager = new InputManager();
    inputManager.attach();
    inputManagerRef.current = inputManager;

    return () => {
      unsub();
      inputManager.detach();
    };
  }, [roomId, side, router, handleMessage]);

  // 게임 루프
  useEffect(() => {
    const socket = getSocket();

    const tick = () => {
      const input = inputManagerRef.current?.getInput() ?? {
        left: false,
        right: false,
        jump: false,
      };

      const currentState = gameStateRef.current;

      if (currentState.phase === "playing") {
        // 로컬 예측
        const predicted = tickGameLocally(currentState, input);
        setGameState(predicted);

        // 입력 변경 시에만 서버에 전송
        const inputKey = `${input.left}${input.right}${input.jump}`;
        if (inputKey !== lastInputRef.current) {
          socket.send({ type: "input", input });
          lastInputRef.current = inputKey;
        }
      }

      // 게임오버 상태에서 아무 키 누르면 로비로
      if (currentState.phase === "gameOver") {
        if (inputManagerRef.current?.isAnyKeyPressed()) {
          router.push("/");
          return;
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-yellow-400">
          Pikachu Volleyball
        </h1>
        {roomId && (
          <p className="font-mono text-xs text-gray-500">
            Room: {roomId}
          </p>
        )}
      </div>

      <ScoreBoard
        leftScore={gameState.score.left}
        rightScore={gameState.score.right}
        mySide={gameState.mySide}
      />

      <GameCanvas gameState={gameState} />

      {gameState.phase === "waiting" && (
        <p className="animate-pulse text-sm text-gray-400">
          Waiting for opponent to join...
        </p>
      )}

      {gameState.phase === "playing" && (
        <p className="text-xs text-gray-600">
          Arrow Keys / WASD to move | Up / W / Space to jump
        </p>
      )}
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    }>
      <GameContent />
    </Suspense>
  );
}
