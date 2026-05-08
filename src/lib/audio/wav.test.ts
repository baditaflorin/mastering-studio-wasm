import { describe, expect, it } from 'vitest';
import { makeSinePayload } from './testUtils';
import { encodeWav } from './wav';

describe('encodeWav', () => {
  it('writes a RIFF/WAVE blob', async () => {
    const blob = encodeWav(makeSinePayload({ seconds: 0.1 }));
    const buffer = await readBlob(blob);
    const header = new TextDecoder().decode(buffer.slice(0, 12));

    expect(blob.type).toBe('audio/wav');
    expect(header).toContain('RIFF');
    expect(header).toContain('WAVE');
    expect(buffer.byteLength).toBeGreaterThan(44);
  });
});

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsArrayBuffer(blob);
  });
}
