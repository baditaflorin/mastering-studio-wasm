import { clamp } from './math';
import { serializeProvenanceComment } from './provenance';
import type { AudioPayload, MasteringProvenance } from './types';

export function encodeWav(
  payload: AudioPayload,
  provenance?: MasteringProvenance
): Blob {
  const channelCount = payload.channels.length;
  const sampleRate = payload.sampleRate;
  const sampleCount = payload.channels[0]?.length ?? 0;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const metadataBytes = provenance
    ? new TextEncoder().encode(serializeProvenanceComment(provenance))
    : null;
  const infoChunkSize = metadataBytes ? 20 + padToEven(metadataBytes.byteLength) : 0;
  const buffer = new ArrayBuffer(44 + dataSize + infoChunkSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize + infoChunkSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = clamp(payload.channels[channelIndex]?.[sampleIndex] ?? 0, -1, 1);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  if (metadataBytes) {
    writeString(view, offset, 'LIST');
    view.setUint32(offset + 4, 4 + 8 + padToEven(metadataBytes.byteLength), true);
    writeString(view, offset + 8, 'INFO');
    writeString(view, offset + 12, 'ICMT');
    view.setUint32(offset + 16, metadataBytes.byteLength, true);

    for (let index = 0; index < metadataBytes.byteLength; index += 1) {
      view.setUint8(offset + 20 + index, metadataBytes[index] ?? 0);
    }

    if (metadataBytes.byteLength % 2 === 1) {
      view.setUint8(offset + 20 + metadataBytes.byteLength, 0);
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function padToEven(size: number): number {
  return size % 2 === 0 ? size : size + 1;
}
