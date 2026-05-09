import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const fixturesDir = join(root, 'test', 'fixtures', 'realdata');

mkdirSync(fixturesDir, { recursive: true });

const fixtures = [
  {
    id: '01-clean-stereo-song',
    fileName: '01-clean-stereo-song.wav',
    seconds: 18,
    sampleRate: 44100,
    channels: 2,
    buildChannel(channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const melody =
        0.24 * Math.sin(2 * Math.PI * 220 * t) +
        0.14 * Math.sin(2 * Math.PI * 330 * t) +
        0.08 * Math.sin(2 * Math.PI * 660 * t);
      const motion =
        channelIndex === 0
          ? Math.sin(2 * Math.PI * 0.3 * t)
          : Math.cos(2 * Math.PI * 0.31 * t);
      return melody * (0.82 + 0.18 * motion);
    },
    expected: {
      expectedClassification: 'music',
      expectedState: 'raw',
      recommendedPreset: 'streaming',
      minConfidence: 0.68,
      shouldAllowMastering: true
    }
  },
  {
    id: '02-mono-voice-memo',
    fileName: '02-mono-voice-memo.wav',
    seconds: 28,
    sampleRate: 16000,
    channels: 1,
    buildChannel(_channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const envelope = 0.55 + 0.35 * Math.sin(2 * Math.PI * 2.1 * t);
      const voice =
        0.17 * Math.sin(2 * Math.PI * 140 * t) +
        0.06 * Math.sin(2 * Math.PI * 280 * t) +
        0.03 * Math.sin(2 * Math.PI * 420 * t);
      const breath = 0.008 * pseudoNoise(sampleIndex);
      const rumble = 0.018 * Math.sin(2 * Math.PI * 33 * t);
      return clampSample((voice * envelope + breath + rumble) * 0.88);
    },
    expected: {
      expectedClassification: 'speech',
      expectedState: 'raw',
      recommendedPreset: 'podcast',
      minConfidence: 0.72,
      shouldAllowMastering: true
    }
  },
  {
    id: '03-long-form-podcast',
    fileName: '03-long-form-podcast.wav',
    seconds: 420,
    sampleRate: 8000,
    channels: 1,
    buildChannel(_channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const block = Math.floor(t / 7) % 4;
      const base = [105, 128, 147, 121][block];
      const phrase =
        0.13 * Math.sin(2 * Math.PI * base * t) +
        0.05 * Math.sin(2 * Math.PI * base * 2 * t) +
        0.02 * Math.sin(2 * Math.PI * base * 3 * t);
      const gate = Math.sin(2 * Math.PI * 1.9 * t) > -0.3 ? 1 : 0.18;
      return clampSample(phrase * gate + 0.005 * pseudoNoise(sampleIndex));
    },
    expected: {
      expectedClassification: 'speech',
      expectedState: 'long-form',
      recommendedPreset: 'podcast',
      minConfidence: 0.7,
      shouldAllowMastering: true
    }
  },
  {
    id: '04-clipped-master',
    fileName: '04-clipped-master.wav',
    seconds: 14,
    sampleRate: 44100,
    channels: 2,
    buildChannel(channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const hot =
        0.74 * Math.sin(2 * Math.PI * 52 * t) +
        0.68 * Math.sin(2 * Math.PI * 104 * t) +
        0.46 * Math.sin(2 * Math.PI * 208 * t + channelIndex * 0.2);
      return hardClip(hot * 1.65, 0.82);
    },
    expected: {
      expectedClassification: 'music',
      expectedState: 'hot-master',
      recommendedPreset: 'warm',
      minConfidence: 0.62,
      shouldAllowMastering: true,
      mustIncludeAnomalies: ['clipping']
    }
  },
  {
    id: '05-dynamic-classical',
    fileName: '05-dynamic-classical.wav',
    seconds: 24,
    sampleRate: 48000,
    channels: 2,
    buildChannel(channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const swell = 0.08 + 0.34 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.06 * t));
      const body =
        0.6 * Math.sin(2 * Math.PI * 196 * t + channelIndex * 0.03) +
        0.25 * Math.sin(2 * Math.PI * 392 * t) +
        0.1 * Math.sin(2 * Math.PI * 587 * t);
      return clampSample(body * swell);
    },
    expected: {
      expectedClassification: 'music',
      expectedState: 'dynamic',
      recommendedPreset: 'warm',
      minConfidence: 0.6,
      shouldAllowMastering: true
    }
  },
  {
    id: '06-wide-edm',
    fileName: '06-wide-edm.wav',
    seconds: 16,
    sampleRate: 44100,
    channels: 2,
    buildChannel(channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const sidePhase = channelIndex === 0 ? 1 : -1;
      const kick = 0.44 * Math.sin(2 * Math.PI * 48 * t);
      const lead = 0.23 * Math.sin(2 * Math.PI * 987 * t + sidePhase * 0.9);
      const saw = 0.17 * Math.asin(Math.sin(2 * Math.PI * 220 * t + sidePhase * 0.7));
      return clampSample((kick + lead + saw) * 0.92);
    },
    expected: {
      expectedClassification: 'music',
      expectedState: 'wide',
      recommendedPreset: 'loud',
      minConfidence: 0.58,
      shouldAllowMastering: true,
      mustIncludeAnomalies: ['wide-stereo']
    }
  },
  {
    id: '07-near-silence',
    fileName: '07-near-silence.wav',
    seconds: 12,
    sampleRate: 44100,
    channels: 2,
    buildChannel(_channelIndex, sampleIndex) {
      return sampleIndex % 8192 === 0 ? 0.0002 : 0;
    },
    expected: {
      expectedClassification: 'unknown',
      expectedState: 'silence',
      recommendedPreset: 'streaming',
      minConfidence: 0.7,
      shouldAllowMastering: false,
      mustIncludeAnomalies: ['silence']
    }
  },
  {
    id: '08-dc-offset-rumble',
    fileName: '08-dc-offset-rumble.wav',
    seconds: 18,
    sampleRate: 44100,
    channels: 1,
    buildChannel(_channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const speechish =
        0.09 * Math.sin(2 * Math.PI * 125 * t) + 0.03 * Math.sin(2 * Math.PI * 255 * t);
      const rumble = 0.11 * Math.sin(2 * Math.PI * 18 * t);
      const offset = 0.07;
      return clampSample(speechish + rumble + offset);
    },
    expected: {
      expectedClassification: 'speech',
      expectedState: 'anomalous',
      recommendedPreset: 'podcast',
      minConfidence: 0.64,
      shouldAllowMastering: true,
      mustIncludeAnomalies: ['dc-offset', 'low-end-rumble']
    }
  },
  {
    id: '09-surround-5_1',
    fileName: '09-surround-5_1.wav',
    seconds: 10,
    sampleRate: 48000,
    channels: 6,
    buildChannel(channelIndex, sampleIndex, sampleRate) {
      const t = sampleIndex / sampleRate;
      const baseFrequencies = [220, 224, 96, 140, 250, 255];
      const gainByChannel = [0.16, 0.16, 0.18, 0.14, 0.12, 0.12];
      const base = baseFrequencies[channelIndex] ?? 220;
      return clampSample(
        gainByChannel[channelIndex] *
          Math.sin(2 * Math.PI * base * t + channelIndex * 0.12)
      );
    },
    expected: {
      expectedClassification: 'music',
      expectedState: 'multichannel',
      recommendedPreset: 'streaming',
      minConfidence: 0.68,
      shouldAllowMastering: false,
      mustIncludeAnomalies: ['multichannel']
    }
  },
  {
    id: '10-fake-mp3',
    fileName: '10-fake-mp3.mp3',
    type: 'text',
    body: 'This is not valid audio data. It is a renamed text payload.',
    expected: {
      expectedClassification: 'invalid',
      expectedState: 'invalid',
      recommendedPreset: 'streaming',
      minConfidence: 1,
      shouldAllowMastering: false,
      mustIncludeAnomalies: ['invalid-audio']
    }
  }
];

for (const fixture of fixtures) {
  const outputPath = join(fixturesDir, fixture.fileName);

  if (fixture.type === 'text') {
    writeFileSync(outputPath, fixture.body);
  } else {
    const wavBuffer = createWavBuffer(fixture);
    writeFileSync(outputPath, wavBuffer);
  }

  writeFileSync(
    join(fixturesDir, `${fixture.id}.expected.json`),
    `${JSON.stringify(fixture.expected, null, 2)}\n`
  );
}

function createWavBuffer(fixture) {
  const sampleCount = Math.round(fixture.sampleRate * fixture.seconds);
  const bytesPerSample = 2;
  const blockAlign = fixture.channels * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(fixture.channels, 22);
  buffer.writeUInt32LE(fixture.sampleRate, 24);
  buffer.writeUInt32LE(fixture.sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < fixture.channels; channelIndex += 1) {
      const sample = clampSample(
        fixture.buildChannel(channelIndex, sampleIndex, fixture.sampleRate)
      );
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      buffer.writeInt16LE(Math.round(value), offset);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

function hardClip(value, threshold) {
  return Math.max(-threshold, Math.min(threshold, value));
}

function clampSample(value) {
  return Math.max(-1, Math.min(1, value));
}

function pseudoNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
