import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import { createDefaultBlockListValue, type BlockListValue } from './blockListDocument';

export const BLOCK_LIST_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const parseBlockListValue = (value: unknown): Result<BlockListValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'block list value must be an object' };
  }
  if (!isStringArray(value.entries)) {
    return { ok: false, error: 'entries must be a string array' };
  }
  return { ok: true, value: { entries: value.entries } };
};

export const blockListCodec: DocumentCodec<BlockListValue> = {
  schemaVersion: BLOCK_LIST_SCHEMA_VERSION,

  createDefault(): VersionedDocument<BlockListValue> {
    return {
      schemaVersion: BLOCK_LIST_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultBlockListValue(),
    };
  },

  encode(document: VersionedDocument<BlockListValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: document.value,
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Block List document must be an object',
        },
      };
    }
    if (typeof wire.schemaVersion !== 'number') {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'schemaVersion',
          message: 'schemaVersion must be a number',
        },
      };
    }
    if (wire.schemaVersion !== BLOCK_LIST_SCHEMA_VERSION) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Block List schema version ${wire.schemaVersion}`,
        },
      };
    }
    if (
      typeof wire.revision !== 'number' ||
      !Number.isInteger(wire.revision) ||
      wire.revision < 0
    ) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'revision',
          message: 'revision must be a non-negative integer',
        },
      };
    }
    const value = parseBlockListValue(wire.value);
    if (!value.ok) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'value',
          message: value.error,
        },
      };
    }
    return {
      ok: true as const,
      value: {
        schemaVersion: wire.schemaVersion,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
