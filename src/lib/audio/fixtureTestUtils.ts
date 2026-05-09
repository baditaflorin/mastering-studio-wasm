import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AudioPayload,
  FixtureExpectation,
  MasteringExecutionContext,
  SourceProfile
} from './types';

export function loadFixtureBytes(fileName: string): Uint8Array {
  return new Uint8Array(
    readFileSync(join(process.cwd(), 'test', 'fixtures', 'realdata', fileName))
  );
}

export function loadFixtureExpectation(id: string): FixtureExpectation {
  return JSON.parse(
    readFileSync(
      join(process.cwd(), 'test', 'fixtures', 'realdata', `${id}.expected.json`),
      'utf8'
    )
  ) as FixtureExpectation;
}

export function parsePcmWav(fileName: string): AudioPayload {
  const bytes = loadFixtureBytes(fileName);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (readAscii(view, 0, 4) !== 'RIFF' || readAscii(view, 8, 4) !== 'WAVE') {
    throw new Error(`Fixture ${fileName} is not a PCM WAV file.`);
  }

  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataLength = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkId === 'fmt ') {
      channels = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true);
    }

    if (chunkId === 'data') {
      dataOffset = chunkDataOffset;
      dataLength = chunkSize;
      break;
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  if (bitsPerSample !== 16 || channels < 1 || sampleRate < 1 || dataLength < 2) {
    throw new Error(`Fixture ${fileName} has unsupported PCM metadata.`);
  }

  const sampleCount = dataLength / (channels * 2);
  const channelData = Array.from(
    { length: channels },
    () => new Float32Array(sampleCount)
  );
  let cursor = dataOffset;

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
      channelData[channelIndex][sampleIndex] = view.getInt16(cursor, true) / 0x8000;
      cursor += 2;
    }
  }

  return {
    name: fileName,
    sampleRate,
    channels: channelData
  };
}

export function makeExecutionContext(
  sourceId: string,
  inputFingerprint: string,
  sourceProfile: SourceProfile
): MasteringExecutionContext {
  return {
    sourceId,
    inputFingerprint,
    sourceProfile,
    appVersion: '0.2.0-test',
    commit: 'test-commit'
  };
}

function readAscii(view: DataView, offset: number, length: number): string {
  return Array.from({ length }, (_, index) =>
    String.fromCharCode(view.getUint8(offset + index))
  ).join('');
}
