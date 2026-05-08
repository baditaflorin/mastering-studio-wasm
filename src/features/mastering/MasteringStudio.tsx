import {
  Download,
  ExternalLink,
  Github,
  Heart,
  Loader2,
  Music2,
  Play,
  Sparkles,
  Upload
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeAudio } from '../../lib/audio/loudness';
import { round } from '../../lib/audio/math';
import { parseMasteringOptions, presetOptions } from '../../lib/audio/options';
import type {
  AudioMetrics,
  MasteringOptions,
  MasteringPreset,
  MasteringProgress,
  MasteringResult,
  StoredSessionSummary
} from '../../lib/audio/types';
import { encodeWav } from '../../lib/audio/wav';
import { audioBufferToPayload, decodeAudioFile } from '../../lib/audio/browser';
import { getErrorMessage } from '../../lib/errors';
import { getLastSession, saveLastSession } from '../../lib/storage/sessionStore';
import { appVersion, gitCommit, paypalUrl, repositoryUrl } from '../../version';
import { MetricsPanel } from './MetricsPanel';
import { WaveformCanvas } from './WaveformCanvas';
import { runMasteringWorker } from './useMasteringWorker';

const acceptTypes = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/x-flac'
];
const acceptExtensions = /\.(wav|mp3|flac|aac|m4a)$/i;

export function MasteringStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceBuffer, setSourceBuffer] = useState<AudioBuffer | null>(null);
  const [sourceMetrics, setSourceMetrics] = useState<AudioMetrics | undefined>();
  const [options, setOptions] = useState<MasteringOptions>(presetOptions.streaming);
  const [result, setResult] = useState<MasteringResult | null>(null);
  const [progress, setProgress] = useState<MasteringProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<StoredSessionSummary | undefined>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sourceUrl = useObjectUrl(file);
  const masteredWavBlob = useMemo(
    () => (result ? encodeWav(result.mastered) : null),
    [result]
  );
  const masteredUrl = useObjectUrl(masteredWavBlob);
  const sourcePayload = useMemo(
    () => (sourceBuffer && file ? audioBufferToPayload(sourceBuffer, file.name) : null),
    [sourceBuffer, file]
  );

  useEffect(() => {
    getLastSession()
      .then(setLastSession)
      .catch(() => undefined);
  }, []);

  async function handleFile(nextFile: File): Promise<void> {
    setError(null);
    setResult(null);
    setProgress(null);
    setExportStatus(null);
    setIsDecoding(true);

    try {
      if (
        !nextFile.type.startsWith('audio/') &&
        !acceptTypes.includes(nextFile.type) &&
        !acceptExtensions.test(nextFile.name)
      ) {
        throw new Error('Choose an audio file: WAV, MP3, FLAC, AAC, or M4A.');
      }

      const decoded = await decodeAudioFile(nextFile);
      const payload = audioBufferToPayload(decoded, nextFile.name);
      const metrics = analyzeAudio(payload);
      setFile(nextFile);
      setSourceBuffer(decoded);
      setSourceMetrics(metrics);
    } catch (decodeError) {
      setError(getErrorMessage(decodeError));
    } finally {
      setIsDecoding(false);
    }
  }

  async function handleMaster(): Promise<void> {
    if (!sourcePayload || !file) {
      setError('Import audio before mastering.');
      return;
    }

    setError(null);
    setExportStatus(null);
    setIsMastering(true);
    setProgress({
      stage: 'analysis',
      message: 'Starting mastering pass',
      value: 0
    });

    try {
      const safeOptions = parseMasteringOptions(options);
      const mastered = await runMasteringWorker(
        sourcePayload,
        safeOptions,
        setProgress
      );
      setResult(mastered);
      const summary: StoredSessionSummary = {
        fileName: file.name,
        updatedAt: new Date().toISOString(),
        preset: safeOptions.preset,
        targetLufs: safeOptions.targetLufs,
        before: mastered.before,
        after: mastered.after
      };
      setLastSession(summary);
      await saveLastSession(summary);
    } catch (masteringError) {
      setError(getErrorMessage(masteringError));
    } finally {
      setIsMastering(false);
    }
  }

  function updatePreset(preset: MasteringPreset): void {
    setOptions(presetOptions[preset]);
  }

  function updateOption<K extends keyof MasteringOptions>(
    key: K,
    value: MasteringOptions[K]
  ): void {
    setOptions((current) => ({
      ...current,
      [key]: value
    }));
  }

  function downloadWav(): void {
    if (!masteredWavBlob || !file) {
      return;
    }

    downloadBlob(masteredWavBlob, `${stripExtension(file.name)}-master.wav`);
  }

  async function downloadMp3(): Promise<void> {
    if (!result || !file) {
      return;
    }

    try {
      const { exportMp3 } = await import('../../lib/audio/export');
      const mp3 = await exportMp3(result.mastered, setExportStatus);
      downloadBlob(mp3, `${stripExtension(file.name)}-master.mp3`);
    } catch (exportError) {
      setError(getErrorMessage(exportError));
      setExportStatus(null);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-neutral-200 bg-paper/92 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white">
              <Music2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight">
                mastering-studio-wasm
              </h1>
              <p className="font-mono text-xs text-neutral-600">
                v{appVersion} · {gitCommit}
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Project links">
            <a
              className="icon-link"
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              title="Star on GitHub"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              <span>Star</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <a
              className="icon-link border-coral/30 text-coral"
              href={paypalUrl}
              target="_blank"
              rel="noreferrer"
              title="Support with PayPal"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span>PayPal</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1.4fr)_390px]">
        <section className="space-y-5">
          <div className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
            <div
              className="grid min-h-56 place-items-center rounded-md border-2 border-dashed border-neutral-300 bg-white px-4 text-center transition hover:border-teal"
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const dropped = event.dataTransfer.files.item(0);

                if (dropped) {
                  void handleFile(dropped);
                }
              }}
            >
              <div className="max-w-lg">
                <Upload className="mx-auto h-10 w-10 text-teal" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black">Import a track</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  WAV, MP3, FLAC, AAC, or M4A. Processing stays in this browser.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    className="primary-button"
                    disabled={isDecoding}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    {isDecoding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isDecoding ? 'Decoding' : 'Choose audio'}
                  </button>
                  {file ? (
                    <button
                      className="secondary-button"
                      onClick={handleMaster}
                      disabled={isMastering}
                      type="button"
                    >
                      {isMastering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Master track
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  className="sr-only"
                  type="file"
                  accept="audio/*,.flac,.m4a"
                  onChange={(event) => {
                    const selected = event.target.files?.item(0);

                    if (selected) {
                      void handleFile(selected);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Waveform</h2>
                <p className="text-sm text-neutral-600">
                  {file
                    ? `${file.name} · ${formatDuration(sourceMetrics?.durationSeconds)}`
                    : 'No audio loaded'}
                </p>
              </div>
              {progress ? (
                <div className="min-w-52 text-right">
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    {progress.stage}
                  </p>
                  <p className="text-sm text-neutral-700">{progress.message}</p>
                </div>
              ) : null}
            </div>
            <div className="mt-4">
              <WaveformCanvas
                original={sourcePayload?.channels[0]}
                mastered={result?.mastered.channels[0]}
              />
            </div>
            {progress ? (
              <div className="mt-4 h-2 rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-teal transition-all"
                  style={{ width: `${Math.max(2, progress.value * 100)}%` }}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AudioPanel title="Original" url={sourceUrl} />
            <AudioPanel title="Mastered" url={masteredUrl} />
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Mastering</h2>
              <Sparkles className="h-5 w-5 text-amber" aria-hidden="true" />
            </div>

            <div
              className="mt-4 grid grid-cols-2 gap-2"
              role="group"
              aria-label="Mastering preset"
            >
              {(['streaming', 'loud', 'podcast', 'warm'] as MasteringPreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    className={`rounded-md border px-3 py-2 text-sm font-bold capitalize ${
                      options.preset === preset
                        ? 'border-teal bg-teal text-white'
                        : 'border-neutral-200 bg-white text-ink hover:border-teal'
                    }`}
                    onClick={() => updatePreset(preset)}
                    type="button"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            <div className="mt-5 space-y-4">
              <Slider
                label="Target LUFS"
                min={-20}
                max={-8}
                step={0.5}
                value={options.targetLufs}
                suffix="LUFS"
                onChange={(value) => updateOption('targetLufs', value)}
              />
              <Slider
                label="Intensity"
                min={0}
                max={1}
                step={0.01}
                value={options.intensity}
                onChange={(value) => updateOption('intensity', value)}
              />
              <Slider
                label="Warmth"
                min={0}
                max={1}
                step={0.01}
                value={options.warmth}
                onChange={(value) => updateOption('warmth', value)}
              />
              <Slider
                label="Stereo width"
                min={0.65}
                max={1.45}
                step={0.01}
                value={options.stereoWidth}
                onChange={(value) => updateOption('stereoWidth', value)}
              />
              <Slider
                label="Ceiling"
                min={-3}
                max={-0.3}
                step={0.1}
                value={options.ceilingDb}
                suffix="dB"
                onChange={(value) => updateOption('ceilingDb', value)}
              />
            </div>

            <button
              className="primary-button mt-5 w-full justify-center"
              disabled={!file || isMastering}
              onClick={handleMaster}
              type="button"
            >
              {isMastering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isMastering ? 'Mastering' : 'Run mastering'}
            </button>
          </section>

          <MetricsPanel before={sourceMetrics} after={result?.after} />

          <section className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
            <h2 className="text-lg font-bold">Export</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="secondary-button justify-center"
                disabled={!result}
                onClick={downloadWav}
                type="button"
              >
                <Download className="h-4 w-4" />
                WAV
              </button>
              <button
                className="secondary-button justify-center"
                disabled={!result}
                onClick={() => void downloadMp3()}
                type="button"
              >
                <Download className="h-4 w-4" />
                MP3
              </button>
            </div>
            {exportStatus ? (
              <p className="mt-3 text-sm text-neutral-600">{exportStatus}</p>
            ) : null}
            {result?.warnings.length ? (
              <ul className="mt-3 space-y-1 text-sm text-amber-700">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </section>

          {lastSession ? (
            <section className="rounded-lg border border-neutral-200 bg-panel p-5 text-sm shadow-sm">
              <h2 className="font-bold">Last run</h2>
              <p className="mt-2 text-neutral-600">{lastSession.fileName}</p>
              <p className="mt-1 font-mono text-neutral-700">
                {round(lastSession.before.integratedLufs, 1)} →{' '}
                {round(lastSession.after.integratedLufs, 1)} LUFS
              </p>
            </section>
          ) : null}
        </aside>
      </div>

      {error ? (
        <div
          className="fixed bottom-4 left-1/2 z-20 w-[min(680px,calc(100vw-32px))] -translate-x-1/2 rounded-md border border-coral/30 bg-white px-4 py-3 text-sm text-coral shadow-soft"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </main>
  );
}

function AudioPanel({ title, url }: { title: string; url: string | null }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <Play className="h-5 w-5 text-violet" aria-hidden="true" />
      </div>
      {url ? (
        <audio className="mt-4 w-full" controls src={url} />
      ) : (
        <div className="mt-4 grid h-12 place-items-center rounded-md bg-neutral-100 text-sm text-neutral-500">
          Waiting for audio
        </div>
      )}
    </section>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  suffix,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        <span className="font-mono text-neutral-600">
          {round(value, step < 0.1 ? 2 : 1)}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </span>
      <input
        className="mt-2 h-2 w-full accent-teal"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function useObjectUrl(blob: Blob | File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(blob);
    setUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [blob]);

  return url;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

function formatDuration(duration?: number): string {
  if (!duration) {
    return '0:00';
  }

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}
