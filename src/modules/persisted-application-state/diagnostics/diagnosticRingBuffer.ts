export type DiagnosticCategory =
  | 'codec-corruption'
  | 'journal-recovery'
  | 'adapter-failure'
  | 'unexpected-runtime';

export interface DiagnosticRecord {
  id: string;
  timestamp: number;
  category: DiagnosticCategory;
  message: string;
  context: Record<string, string>;
}

export const DIAGNOSTIC_BUFFER_LIMIT = 500;

export class DiagnosticRingBuffer {
  private readonly entries: DiagnosticRecord[] = [];
  private sequence = 0;

  record(
    input: Omit<DiagnosticRecord, 'id' | 'timestamp'> & { timestamp?: number }
  ): DiagnosticRecord {
    const record: DiagnosticRecord = {
      id: `diag-${this.sequence++}`,
      timestamp: input.timestamp ?? Date.now(),
      category: input.category,
      message: input.message,
      context: sanitizeContext(input.context),
    };
    this.entries.push(record);
    while (this.entries.length > DIAGNOSTIC_BUFFER_LIMIT) {
      this.entries.shift();
    }
    return record;
  }

  all(): readonly DiagnosticRecord[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries.length = 0;
  }

  size(): number {
    return this.entries.length;
  }
}

const sanitizeContext = (context: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')) {
      continue;
    }
    sanitized[key] = value.slice(0, 200);
  }
  return sanitized;
};

export const createDiagnosticRingBuffer = (): DiagnosticRingBuffer => new DiagnosticRingBuffer();
