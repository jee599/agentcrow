import {
  type Ball,
  type Pikachu,
  type GameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  NET_X,
  NET_WIDTH,
  NET_TOP,
  PIKACHU_HEAD_RADIUS,
} from "./types";

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  // 하늘
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, "#87CEEB");
  skyGrad.addColorStop(1, "#B0E0FF");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

  // 바닥
  ctx.fillStyle = "#5B8C5A";
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

  // 코트 라인
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
  ctx.stroke();
}

export function drawNet(ctx: CanvasRenderingContext2D) {
  // 네트 기둥
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(NET_X - NET_WIDTH / 2, NET_TOP, NET_WIDTH, GROUND_Y - NET_TOP);

  // 네트 줄
  ctx.strokeStyle = "#D4AA50";
  ctx.lineWidth = 1;
  const meshSize = 10;
  for (let y = NET_TOP; y < GROUND_Y; y += meshSize) {
    ctx.beginPath();
    ctx.moveTo(NET_X - NET_WIDTH / 2, y);
    ctx.lineTo(NET_X + NET_WIDTH / 2, y);
    ctx.stroke();
  }

  // 네트 상단 볼
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(NET_X, NET_TOP, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPikachu(
  ctx: CanvasRenderingContext2D,
  pikachu: Pikachu,
  isMe: boolean,
) {
  const { x, y, side } = pikachu;
  const dir = side === "left" ? 1 : -1;

  ctx.save();

  // 몸통 (타원)
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.ellipse(x, y - 15, 18, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#CC9900";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 갈색 등줄무늬
  ctx.fillStyle = "#CC8800";
  ctx.beginPath();
  ctx.ellipse(x - dir * 3, y - 18, 6, 10, dir * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 머리 (원)
  const headY = y - 35;
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc(x, headY, PIKACHU_HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#CC9900";
  ctx.stroke();

  // 귀 (삼각형)
  const earBaseY = headY - 18;
  // 왼쪽 귀
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.moveTo(x - 14, earBaseY);
  ctx.lineTo(x - 22, earBaseY - 28);
  ctx.lineTo(x - 4, earBaseY - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 귀 끝 검정
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(x - 18, earBaseY - 18);
  ctx.lineTo(x - 22, earBaseY - 28);
  ctx.lineTo(x - 12, earBaseY - 14);
  ctx.closePath();
  ctx.fill();

  // 오른쪽 귀
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.moveTo(x + 14, earBaseY);
  ctx.lineTo(x + 22, earBaseY - 28);
  ctx.lineTo(x + 4, earBaseY - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(x + 18, earBaseY - 18);
  ctx.lineTo(x + 22, earBaseY - 28);
  ctx.lineTo(x + 12, earBaseY - 14);
  ctx.closePath();
  ctx.fill();

  // 눈 (방향에 따라)
  const eyeOffX = dir * 8;
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(x + eyeOffX - 4, headY - 3, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + eyeOffX + 8, headY - 3, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 눈 하이라이트
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.arc(x + eyeOffX - 3, headY - 4.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + eyeOffX + 9, headY - 4.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 볼 (빨간 동그라미)
  ctx.fillStyle = "#FF6B6B";
  ctx.beginPath();
  ctx.ellipse(x + dir * 18, headY + 5, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 입
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + dir * 5, headY + 7, 3, 0, Math.PI);
  ctx.stroke();

  // 꼬리 (번개 모양)
  const tailX = x - dir * 22;
  const tailY = y - 20;
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#CC9900";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tailX - dir * 10, tailY - 15);
  ctx.lineTo(tailX - dir * 4, tailY - 12);
  ctx.lineTo(tailX - dir * 14, tailY - 30);
  ctx.lineTo(tailX - dir * 6, tailY - 18);
  ctx.lineTo(tailX - dir * 12, tailY - 20);
  ctx.lineTo(tailX, tailY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 내 피카츄 표시
  if (isMe) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("YOU", x, headY - PIKACHU_HEAD_RADIUS - 18);

    // 화살표
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.moveTo(x, headY - PIKACHU_HEAD_RADIUS - 6);
    ctx.lineTo(x - 5, headY - PIKACHU_HEAD_RADIUS - 12);
    ctx.lineTo(x + 5, headY - PIKACHU_HEAD_RADIUS - 12);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  const { x, y, radius } = ball;

  // 그림자
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y + 2, radius * 0.8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 공 본체 (흰색)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 외곽선
  ctx.strokeStyle = "#CCCCCC";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 배구공 줄무늬
  ctx.strokeStyle = "#DDDDDD";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, -0.3, Math.PI + 0.3);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, Math.PI / 2 - 0.3, Math.PI * 1.5 + 0.3);
  ctx.stroke();

  // 하이라이트
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

export function drawScore(
  ctx: CanvasRenderingContext2D,
  score: { left: number; right: number },
) {
  ctx.save();

  // 배경
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  const boxW = 160;
  const boxH = 40;
  const boxX = CANVAS_WIDTH / 2 - boxW / 2;
  ctx.beginPath();
  ctx.roundRect(boxX, 8, boxW, boxH, 8);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${score.left}`, CANVAS_WIDTH / 2 - 35, 28);
  ctx.fillText("-", CANVAS_WIDTH / 2, 28);
  ctx.fillText(`${score.right}`, CANVAS_WIDTH / 2 + 35, 28);

  ctx.restore();
}

export function drawWaiting(ctx: CanvasRenderingContext2D, message: string) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.restore();
}

export function drawScoredOverlay(
  ctx: CanvasRenderingContext2D,
  scorer: string,
) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${scorer} SCORED!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Ready for next serve...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  ctx.restore();
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  winner: string,
  score: { left: number; right: number },
) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 42px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(`${winner} WINS!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.font = "24px monospace";
  ctx.fillText(`${score.left} - ${score.right}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#AAA";
  ctx.fillText("Press any key to return to lobby", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
  ctx.restore();
}

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  clearCanvas(ctx);
  drawNet(ctx);

  if (state.phase === "playing" || state.phase === "scored" || state.phase === "gameOver") {
    drawPikachu(ctx, state.player1, state.mySide === "left");
    drawPikachu(ctx, state.player2, state.mySide === "right");
    drawBall(ctx, state.ball);
    drawScore(ctx, state.score);
  }

  if (state.phase === "waiting") {
    drawWaiting(ctx, "Waiting for opponent...");
  }

  if (state.phase === "scored") {
    // 누가 득점했는지 표시
    const lastScorer = state.servingSide === "left" ? "P1" : "P2";
    drawScoredOverlay(ctx, lastScorer);
  }

  if (state.phase === "gameOver" && state.winner) {
    const winnerLabel = state.winner === state.mySide ? "YOU" : "OPPONENT";
    drawGameOver(ctx, winnerLabel, state.score);
  }
}
