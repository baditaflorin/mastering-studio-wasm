import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { AudioPayload } from './types';
import { encodeWav } from './wav';

let ffmpegPromise: Promise<FFmpeg> | null = null;

export async function exportMp3(
  payload: AudioPayload,
  onStatus: (message: string) => void
): Promise<Blob> {
  const ffmpeg = await loadFfmpeg(onStatus);
  const wavBlob = encodeWav(payload);
  const inputName = 'master-input.wav';
  const outputName = 'master-output.mp3';

  onStatus('Preparing WAV for FFmpeg');
  await ffmpeg.writeFile(inputName, await fetchFile(wavBlob));

  onStatus('Encoding MP3 with FFmpeg WASM');
  await ffmpeg.exec([
    '-i',
    inputName,
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '320k',
    '-write_xing',
    '0',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : new Uint8Array(
          data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
        );

  onStatus('MP3 export ready');
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/mpeg' });
}

async function loadFfmpeg(onStatus: (message: string) => void): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      onStatus('Loading FFmpeg WASM');
      const ffmpeg = new FFmpeg();
      const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}vendor/ffmpeg-core`;

      ffmpeg.on('log', ({ message }) => {
        if (import.meta.env.DEV && message.trim().length > 0) {
          console.debug(message);
        }
      });

      await ffmpeg.load({
        coreURL: `${baseUrl}/ffmpeg-core.js`,
        wasmURL: `${baseUrl}/ffmpeg-core.wasm`
      });

      return ffmpeg;
    })();
  }

  return ffmpegPromise;
}
