import type { AudioPayload } from './types';

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error('This browser does not support Web Audio decoding.');
  }

  const context = new AudioContextConstructor();

  try {
    const buffer = await file.arrayBuffer();
    return await context.decodeAudioData(buffer);
  } finally {
    await context.close();
  }
}

export function audioBufferToPayload(buffer: AudioBuffer, name: string): AudioPayload {
  const channels: Float32Array[] = [];

  for (let index = 0; index < buffer.numberOfChannels; index += 1) {
    channels.push(new Float32Array(buffer.getChannelData(index)));
  }

  return {
    name,
    sampleRate: buffer.sampleRate,
    channels
  };
}

export function payloadToAudioBuffer(payload: AudioPayload): AudioBuffer {
  const context = new OfflineAudioContext(
    payload.channels.length,
    payload.channels[0]?.length ?? 1,
    payload.sampleRate
  );
  const buffer = context.createBuffer(
    payload.channels.length,
    payload.channels[0]?.length ?? 1,
    payload.sampleRate
  );

  payload.channels.forEach((channel, index) => {
    buffer.copyToChannel(new Float32Array(channel), index);
  });

  return buffer;
}
