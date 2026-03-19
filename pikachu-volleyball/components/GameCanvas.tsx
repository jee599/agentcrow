"use client";

import { useEffect, useRef, useCallback } from "react";
import { type GameState } from "@/lib/game/types";
import { render } from "@/lib/game/renderer";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/game/types";

interface GameCanvasProps {
  gameState: GameState;
}

export default function GameCanvas({ gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const scale = Math.min(containerWidth / CANVAS_WIDTH, 1);

    canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    render(ctx, gameState);
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      className="flex w-full items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-lg shadow-2xl"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
