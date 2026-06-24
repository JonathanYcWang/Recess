export const COMMAND_LEDGER_LIMIT = 256;

interface LedgerEntry<TResponse> {
  commandId: string;
  response: TResponse;
  sequence: number;
}

export class CommandLedger<TResponse> {
  private readonly entries = new Map<string, LedgerEntry<TResponse>>();
  private sequence = 0;

  get(commandId: string): TResponse | undefined {
    return this.entries.get(commandId)?.response;
  }

  set(commandId: string, response: TResponse): void {
    if (this.entries.has(commandId)) {
      return;
    }
    this.entries.set(commandId, {
      commandId,
      response,
      sequence: this.sequence++,
    });
    this.evict();
  }

  size(): number {
    return this.entries.size;
  }

  private evict(): void {
    while (this.entries.size > COMMAND_LEDGER_LIMIT) {
      let oldestId: string | undefined;
      let oldestSequence = Number.POSITIVE_INFINITY;
      for (const [commandId, entry] of this.entries) {
        if (entry.sequence < oldestSequence) {
          oldestSequence = entry.sequence;
          oldestId = commandId;
        }
      }
      if (!oldestId) {
        return;
      }
      this.entries.delete(oldestId);
    }
  }
}

export const createCommandLedger = <TResponse>(): CommandLedger<TResponse> =>
  new CommandLedger<TResponse>();
