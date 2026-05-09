import { hashBytes } from './fingerprint';
import type { AnalysisAnomaly, PreflightReport } from './types';

const HARD_FILE_SIZE_BYTES = 128 * 1024 * 1024;
const LONG_FORM_SECONDS_HINT = 5 * 60;
const BYTES_PER_DECODED_SAMPLE = 4;

export async function inspectAudioFile(file: File): Promise<PreflightReport> {
  const sniffBytes = new Uint8Array(await readBlobBytes(file.slice(0, 64)));
  const extension = getExtension(file.name);
  const detectedFormat = sniffFormat(sniffBytes, extension);
  const estimatedDecodeMemoryBytes = estimateDecodedSize(file.size, detectedFormat);
  const sourceId = `${stripExtension(file.name)}-${hashBytes(sniffBytes)}-${file.size}`;
  const warnings: AnalysisAnomaly[] = [];
  let blockingError: AnalysisAnomaly | null = null;

  if (detectedFormat === 'unknown') {
    blockingError = makeAnomaly(
      'invalid-audio',
      'blocker',
      'This file does not look like valid audio.',
      'The file header does not match WAV, MP3, AAC, M4A, or FLAC.',
      'Export the source again from your editor or choose a known audio file.'
    );
  }

  if (file.size === 0) {
    blockingError = makeAnomaly(
      'invalid-audio',
      'blocker',
      'This file is empty.',
      'There are no audio bytes to decode.',
      'Re-export the track or choose a different file.'
    );
  }

  if (file.size > HARD_FILE_SIZE_BYTES) {
    blockingError = makeAnomaly(
      'decode-risk',
      'blocker',
      'This file is too large for an in-browser decode.',
      'Decoded PCM would likely exceed the memory budget for a stable browser session.',
      'Trim the file, export a shorter section, or use a lower sample rate before importing.'
    );
  } else if (estimatedDecodeMemoryBytes > 320 * 1024 * 1024) {
    warnings.push(
      makeAnomaly(
        'decode-risk',
        'warning',
        'This file may be expensive to decode.',
        'The estimated decoded PCM size is large for an in-browser mastering pass.',
        'You can still continue, but expect a slower run and keep other tabs light.'
      )
    );
  }

  if (
    extension &&
    detectedFormat !== 'unknown' &&
    !matchesLikelyExtension(extension, detectedFormat)
  ) {
    warnings.push(
      makeAnomaly(
        'invalid-audio',
        'warning',
        'The file extension does not match the audio header.',
        `The file name suggests .${extension}, but the header looks like ${detectedFormat.toUpperCase()}.`,
        'The app will trust the header. Rename the file later if you want cleaner provenance.'
      )
    );
  }

  return {
    fileName: file.name,
    extension,
    detectedFormat,
    sizeBytes: file.size,
    estimatedDecodeMemoryBytes,
    canAttemptDecode: blockingError === null,
    blockingError,
    warnings,
    sourceId
  };
}

async function readBlobBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsArrayBuffer(blob);
  });
}

export function isLikelyLongForm(durationSeconds: number): boolean {
  return durationSeconds >= LONG_FORM_SECONDS_HINT;
}

function sniffFormat(
  bytes: Uint8Array,
  extension: string
): PreflightReport['detectedFormat'] {
  const signature = Array.from(bytes.slice(0, 12))
    .map((value) => String.fromCharCode(value))
    .join('');

  if (signature.startsWith('RIFF') && signature.slice(8, 12) === 'WAVE') {
    return 'wav';
  }

  if (signature.startsWith('ID3') || (bytes[0] === 0xff && (bytes[1] ?? 0) >= 0xe0)) {
    return 'mp3';
  }

  if (signature.includes('ftyp')) {
    return extension === 'm4a' ? 'm4a' : 'aac';
  }

  if (signature.startsWith('fLaC')) {
    return 'flac';
  }

  if (extension === 'aac') {
    return 'aac';
  }

  return 'unknown';
}

function estimateDecodedSize(
  sizeBytes: number,
  detectedFormat: PreflightReport['detectedFormat']
): number {
  const multiplierByFormat = {
    wav: 2,
    mp3: 14,
    m4a: 16,
    aac: 16,
    flac: 6,
    unknown: 10
  } satisfies Record<PreflightReport['detectedFormat'], number>;

  return sizeBytes * multiplierByFormat[detectedFormat] * BYTES_PER_DECODED_SAMPLE;
}

function makeAnomaly(
  id: AnalysisAnomaly['id'],
  severity: AnalysisAnomaly['severity'],
  what: string,
  why: string,
  nextStep: string
): AnalysisAnomaly {
  return {
    id,
    title: what,
    severity,
    what,
    why,
    nextStep
  };
}

function getExtension(fileName: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  return match?.[1]?.toLowerCase() ?? '';
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function matchesLikelyExtension(
  extension: string,
  format: PreflightReport['detectedFormat']
): boolean {
  const extensionMap: Record<PreflightReport['detectedFormat'], string[]> = {
    wav: ['wav'],
    mp3: ['mp3'],
    m4a: ['m4a', 'mp4'],
    aac: ['aac', 'm4a', 'mp4'],
    flac: ['flac'],
    unknown: []
  };

  return extensionMap[format].includes(extension);
}
