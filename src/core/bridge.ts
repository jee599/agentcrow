import { spawn } from 'node:child_process';

export interface BridgeResult {
  success: boolean;
  output: string;
  error?: string;
  durationMs: number;
}

export class ClaudeCLIBridge {
  constructor(
    private maxRetries: number = 3,
    private timeoutMs: number = 600000,
  ) {}

  async execute(prompt: string, workingDir?: string): Promise<BridgeResult> {
    let lastError = '';

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.runClaude(prompt, workingDir);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < this.maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    return {
      success: false,
      output: '',
      error: `Failed after ${this.maxRetries} attempts: ${lastError}`,
      durationMs: 0,
    };
  }

  private runClaude(prompt: string, workingDir?: string): Promise<BridgeResult> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const args = ['-p', '--allowedTools', 'Write,Edit,Read,Bash,Glob,Grep', prompt];

      const env = { ...process.env };
      delete env.ANTHROPIC_API_KEY;

      const proc = spawn('claude', args, {
        cwd: workingDir || process.cwd(),
        shell: false,
        timeout: this.timeoutMs,
        env,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        const durationMs = Date.now() - start;
        if (code === 0) {
          resolve({ success: true, output: stdout.trim(), durationMs });
        } else {
          resolve({
            success: false,
            output: stdout.trim(),
            error: stderr.trim() || `Exit code: ${code}`,
            durationMs,
          });
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
