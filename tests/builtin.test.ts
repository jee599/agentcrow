import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const BUILTIN_DIR = path.resolve('agents/builtin');

describe('builtin YAML agents', () => {
  const files = fs.readdirSync(BUILTIN_DIR).filter(f => f.endsWith('.yaml'));

  it('9개 YAML 파일이 존재한다', () => {
    expect(files).toHaveLength(9);
  });

  for (const file of files) {
    describe(file, () => {
      const content = fs.readFileSync(path.join(BUILTIN_DIR, file), 'utf-8');
      const parsed = yaml.parse(content);

      it('필수 필드가 존재한다', () => {
        expect(parsed.name).toBeTruthy();
        expect(parsed.role).toBeTruthy();
        expect(parsed.description).toBeTruthy();
        expect(parsed.tags).toBeInstanceOf(Array);
        expect(parsed.identity).toBeTruthy();
        expect(parsed.identity.personality).toBeTruthy();
        expect(parsed.identity.communication).toBeTruthy();
        expect(parsed.identity.thinking).toBeTruthy();
        expect(parsed.critical_rules).toBeTruthy();
        expect(parsed.critical_rules.must).toBeInstanceOf(Array);
        expect(parsed.critical_rules.must_not).toBeInstanceOf(Array);
        expect(parsed.deliverables).toBeInstanceOf(Array);
        expect(parsed.success_metrics).toBeInstanceOf(Array);
      });

      it('role이 snake_case 형식이다', () => {
        expect(parsed.role).toMatch(/^[a-z][a-z0-9_]*$/);
      });
    });
  }
});
