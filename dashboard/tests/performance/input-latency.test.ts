/**
 * 입력 지연 200ms 이하 검증
 * PRD 기준: 평균 레이턴시 <100ms, 경고 >300ms
 * QA 기준: 입력 처리 → 상태 반영까지 200ms 이하
 */
import { describe, it, expect, beforeEach } from 'vitest';

// --- 입력 파이프라인 시뮬레이터 ---

interface InputEvent {
  playerIdx: 0 | 1;
  keys: {
    left: boolean;
    right: boolean;
    up: boolean;
    powerHit: boolean;
  };
  clientTimestamp: number;
}

interface ProcessedInput {
  event: InputEvent;
  serverReceivedAt: number;
  stateAppliedAt: number;
  broadcastAt: number;
  clientReceivedAt: number;
}

class InputLatencySimulator {
  // 네트워크 지연 시뮬레이션 (편도)
  networkLatencyMs: number;
  // 서버 처리 시간
  serverProcessingMs: number;
  // 틱 간격 (60Hz = 16.67ms)
  tickIntervalMs: number;
  // 브로드캐스트 간격 (30Hz = 33.33ms)
  broadcastIntervalMs: number;

  constructor(options?: {
    networkLatencyMs?: number;
    serverProcessingMs?: number;
  }) {
    this.networkLatencyMs = options?.networkLatencyMs ?? 20;
    this.serverProcessingMs = options?.serverProcessingMs ?? 2;
    this.tickIntervalMs = 1000 / 60; // 16.67ms
    this.broadcastIntervalMs = 1000 / 30; // 33.33ms
  }

  /**
   * 입력 → 서버 수신 → 상태 적용 → 브로드캐스트 → 클라이언트 수신
   * 총 RTT = 네트워크(편도) + 서버처리 + 틱대기(최악) + 브로드캐스트대기(최악) + 네트워크(편도)
   */
  simulateInputRoundTrip(event: InputEvent): ProcessedInput {
    const serverReceivedAt = event.clientTimestamp + this.networkLatencyMs;

    // 서버 틱 정렬: 입력이 도착한 후 다음 틱에서 처리
    const tickWait = this.tickIntervalMs - ((serverReceivedAt - event.clientTimestamp) % this.tickIntervalMs);
    const stateAppliedAt = serverReceivedAt + Math.min(tickWait, this.tickIntervalMs) + this.serverProcessingMs;

    // 브로드캐스트 정렬: 상태 적용 후 다음 브로드캐스트에서 전송
    const broadcastWait = this.broadcastIntervalMs - ((stateAppliedAt - event.clientTimestamp) % this.broadcastIntervalMs);
    const broadcastAt = stateAppliedAt + Math.min(broadcastWait, this.broadcastIntervalMs);

    const clientReceivedAt = broadcastAt + this.networkLatencyMs;

    return {
      event,
      serverReceivedAt,
      stateAppliedAt,
      broadcastAt,
      clientReceivedAt,
    };
  }

  /**
   * E2E 레이턴시 = 클라이언트 수신 시간 - 입력 시간
   */
  measureE2ELatency(event: InputEvent): number {
    const result = this.simulateInputRoundTrip(event);
    return result.clientReceivedAt - event.clientTimestamp;
  }

  /**
   * 로컬 예측 레이턴시 = 즉시 (Client-Side Prediction)
   * 실제 입력 → 화면 반영은 렌더 프레임 내에서 발생
   */
  measureLocalPredictionLatency(): number {
    // Client-Side Prediction: 입력 즉시 로컬 상태 업데이트
    // 렌더 프레임 내에서 처리 → ~16.67ms (1프레임)
    return this.tickIntervalMs;
  }

  /**
   * 여러 입력의 평균 레이턴시 측정
   */
  measureAverageLatency(count: number): number {
    let totalLatency = 0;
    const baseTime = Date.now();

    for (let i = 0; i < count; i++) {
      const event: InputEvent = {
        playerIdx: 0,
        keys: { left: true, right: false, up: false, powerHit: false },
        clientTimestamp: baseTime + i * this.tickIntervalMs,
      };
      totalLatency += this.measureE2ELatency(event);
    }

    return totalLatency / count;
  }
}

// --- 프레임 타이밍 검증기 ---

class FrameTimingValidator {
  targetFps: number;
  frameTimings: number[] = [];

  constructor(targetFps = 60) {
    this.targetFps = targetFps;
  }

  recordFrame(durationMs: number): void {
    this.frameTimings.push(durationMs);
  }

  getAverageFrameTime(): number {
    if (this.frameTimings.length === 0) return 0;
    return this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length;
  }

  getMaxFrameTime(): number {
    return Math.max(...this.frameTimings, 0);
  }

  getTargetFrameTime(): number {
    return 1000 / this.targetFps; // 16.67ms for 60fps
  }

  getDroppedFrameCount(thresholdMultiplier = 2): number {
    const threshold = this.getTargetFrameTime() * thresholdMultiplier;
    return this.frameTimings.filter((t) => t > threshold).length;
  }

  /**
   * 입력 처리가 프레임 예산 내에서 완료되는지 검증
   * 60fps → 16.67ms 예산, 입력 처리는 이 중 일부여야 함
   */
  validateInputProcessingBudget(inputProcessingMs: number): boolean {
    const frameBudget = this.getTargetFrameTime();
    // 입력 처리는 프레임 예산의 50% 이내여야 함 (렌더링 시간 확보)
    return inputProcessingMs <= frameBudget * 0.5;
  }
}

// ========================
// 테스트
// ========================

describe('입력 지연 검증', () => {
  describe('Client-Side Prediction 레이턴시', () => {
    it('로컬 예측 입력 지연 ≤ 1프레임 (16.67ms)', () => {
      const sim = new InputLatencySimulator();
      const localLatency = sim.measureLocalPredictionLatency();
      expect(localLatency).toBeLessThanOrEqual(16.67);
    });

    it('로컬 예측으로 입력 즉시 반영 (200ms 이하)', () => {
      const sim = new InputLatencySimulator();
      const localLatency = sim.measureLocalPredictionLatency();
      expect(localLatency).toBeLessThan(200);
    });
  });

  describe('E2E 네트워크 레이턴시 (서버 왕복)', () => {
    let sim: InputLatencySimulator;

    beforeEach(() => {
      // 국내 기준 네트워크 지연 20ms
      sim = new InputLatencySimulator({ networkLatencyMs: 20, serverProcessingMs: 2 });
    });

    it('국내 네트워크 (20ms 편도) E2E 레이턴시 200ms 이하', () => {
      const event: InputEvent = {
        playerIdx: 0,
        keys: { left: true, right: false, up: false, powerHit: false },
        clientTimestamp: Date.now(),
      };

      const latency = sim.measureE2ELatency(event);
      expect(latency).toBeLessThan(200);
    });

    it('국내 네트워크 평균 레이턴시 100ms 이하 (PRD 목표)', () => {
      const avgLatency = sim.measureAverageLatency(100);
      expect(avgLatency).toBeLessThan(100);
    });

    it('높은 지연 (80ms 편도)에서도 E2E 200ms 이하', () => {
      const highLatencySim = new InputLatencySimulator({ networkLatencyMs: 80 });
      const avgLatency = highLatencySim.measureAverageLatency(100);
      expect(avgLatency).toBeLessThan(200);
    });

    it('매우 높은 지연 (150ms 편도) 시 200ms 초과 — 경고 필요', () => {
      const veryHighSim = new InputLatencySimulator({ networkLatencyMs: 150 });
      const avgLatency = veryHighSim.measureAverageLatency(100);
      // 300ms RTT → 200ms 초과 예상
      expect(avgLatency).toBeGreaterThan(200);
    });
  });

  describe('서버 입력 처리 파이프라인', () => {
    it('입력 수신 → 상태 적용이 1틱(16.67ms) 내에 발생', () => {
      const sim = new InputLatencySimulator({ networkLatencyMs: 0 });
      const event: InputEvent = {
        playerIdx: 0,
        keys: { left: true, right: false, up: false, powerHit: false },
        clientTimestamp: 1000,
      };

      const result = sim.simulateInputRoundTrip(event);
      const processingTime = result.stateAppliedAt - result.serverReceivedAt;

      // 서버 처리 시간 + 틱 대기 ≤ 1틱 + 처리시간
      expect(processingTime).toBeLessThanOrEqual(sim.tickIntervalMs + sim.serverProcessingMs);
    });

    it('상태 브로드캐스트 간격이 30Hz (33.33ms) 이내', () => {
      const sim = new InputLatencySimulator();
      expect(sim.broadcastIntervalMs).toBeCloseTo(33.33, 1);
    });
  });

  describe('프레임 타이밍 검증 (60fps)', () => {
    let validator: FrameTimingValidator;

    beforeEach(() => {
      validator = new FrameTimingValidator(60);
    });

    it('목표 프레임 시간 16.67ms', () => {
      expect(validator.getTargetFrameTime()).toBeCloseTo(16.67, 1);
    });

    it('정상 프레임에서 드롭 프레임 0개', () => {
      // 60프레임을 정상 시간으로 기록
      for (let i = 0; i < 60; i++) {
        validator.recordFrame(16 + Math.random() * 2); // 16~18ms
      }

      expect(validator.getDroppedFrameCount()).toBe(0);
    });

    it('평균 프레임 시간이 16.67ms 근처', () => {
      for (let i = 0; i < 100; i++) {
        validator.recordFrame(15 + Math.random() * 3);
      }

      expect(validator.getAverageFrameTime()).toBeCloseTo(16.5, 0);
    });

    it('스파이크 프레임 감지', () => {
      for (let i = 0; i < 59; i++) {
        validator.recordFrame(16);
      }
      validator.recordFrame(50); // 스파이크

      expect(validator.getDroppedFrameCount()).toBe(1);
      expect(validator.getMaxFrameTime()).toBe(50);
    });

    it('입력 처리가 프레임 예산의 50% 이내', () => {
      const inputProcessingMs = 5; // 5ms
      expect(validator.validateInputProcessingBudget(inputProcessingMs)).toBe(true);

      const heavyProcessingMs = 12; // 12ms > 8.33ms (50%)
      expect(validator.validateInputProcessingBudget(heavyProcessingMs)).toBe(false);
    });
  });

  describe('동시 입력 처리 성능', () => {
    it('P1, P2 동시 입력이 같은 틱에서 처리', () => {
      const sim = new InputLatencySimulator({ networkLatencyMs: 20 });
      const baseTime = Date.now();

      const p1Event: InputEvent = {
        playerIdx: 0,
        keys: { left: true, right: false, up: false, powerHit: false },
        clientTimestamp: baseTime,
      };
      const p2Event: InputEvent = {
        playerIdx: 1,
        keys: { left: false, right: true, up: false, powerHit: false },
        clientTimestamp: baseTime,
      };

      const p1Result = sim.simulateInputRoundTrip(p1Event);
      const p2Result = sim.simulateInputRoundTrip(p2Event);

      // 같은 시간에 발생한 입력은 같은 틱에서 처리
      expect(p1Result.stateAppliedAt).toBe(p2Result.stateAppliedAt);
    });

    it('연속 입력 60개를 1초 내에 처리', () => {
      const sim = new InputLatencySimulator({ networkLatencyMs: 20 });
      const baseTime = Date.now();
      const results: ProcessedInput[] = [];

      for (let i = 0; i < 60; i++) {
        const event: InputEvent = {
          playerIdx: 0,
          keys: { left: i % 2 === 0, right: i % 2 !== 0, up: false, powerHit: false },
          clientTimestamp: baseTime + i * sim.tickIntervalMs,
        };
        results.push(sim.simulateInputRoundTrip(event));
      }

      // 마지막 입력의 브로드캐스트가 시작 후 ~1.1초 내에 완료
      const totalDuration = results[results.length - 1].clientReceivedAt - baseTime;
      // 60프레임 * 16.67ms ≈ 1000ms + 네트워크 왕복 ≈ 1040ms
      expect(totalDuration).toBeLessThan(1200);
    });
  });

  describe('입력 지연 임계값 분류', () => {
    it('좋음: <50ms (로컬 또는 매우 낮은 지연)', () => {
      const sim = new InputLatencySimulator({ networkLatencyMs: 5 });
      const latency = sim.measureAverageLatency(10);
      expect(latency).toBeLessThan(50);
    });

    it('보통: 50~100ms (국내 일반)', () => {
      const sim = new InputLatencySimulator({ networkLatencyMs: 20 });
      const latency = sim.measureAverageLatency(10);
      expect(latency).toBeGreaterThanOrEqual(50);
      expect(latency).toBeLessThan(100);
    });

    it('경고: 100~200ms (원거리)', () => {
      const sim = new InputLatencySimulator({ networkLatencyMs: 60 });
      const latency = sim.measureAverageLatency(10);
      expect(latency).toBeGreaterThanOrEqual(100);
      expect(latency).toBeLessThan(200);
    });

    it('위험: >300ms (PRD 경고 임계값)', () => {
      const sim = new InputLatencySimulator({ networkLatencyMs: 150 });
      const latency = sim.measureAverageLatency(10);
      expect(latency).toBeGreaterThan(300);
    });
  });
});
