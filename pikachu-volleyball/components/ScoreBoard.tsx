"use client";

interface ScoreBoardProps {
  leftScore: number;
  rightScore: number;
  mySide: "left" | "right" | null;
}

export default function ScoreBoard({ leftScore, rightScore, mySide }: ScoreBoardProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-2">
      <div className={`flex flex-col items-center ${mySide === "left" ? "text-yellow-400" : "text-white"}`}>
        <span className="text-xs font-medium uppercase tracking-wide">
          {mySide === "left" ? "You" : "Opponent"}
        </span>
        <span className="text-3xl font-bold tabular-nums">{leftScore}</span>
      </div>
      <span className="text-2xl text-gray-400">:</span>
      <div className={`flex flex-col items-center ${mySide === "right" ? "text-yellow-400" : "text-white"}`}>
        <span className="text-xs font-medium uppercase tracking-wide">
          {mySide === "right" ? "You" : "Opponent"}
        </span>
        <span className="text-3xl font-bold tabular-nums">{rightScore}</span>
      </div>
    </div>
  );
}
