import { Activity, Gauge, RadioTower, SlidersHorizontal } from 'lucide-react';
import { round } from '../../lib/audio/math';
import type { AudioMetrics } from '../../lib/audio/types';

interface MetricsPanelProps {
  before?: AudioMetrics;
  after?: AudioMetrics;
}

export function MetricsPanel({ before, after }: MetricsPanelProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Metering</h2>
        <Gauge className="h-5 w-5 text-teal" aria-hidden="true" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Input LUFS" value={formatLufs(before?.integratedLufs)} />
        <Metric
          label="Master LUFS"
          value={formatLufs(after?.integratedLufs)}
          tone="coral"
        />
        <Metric label="Input peak" value={formatDb(before?.peakDb)} />
        <Metric label="Master peak" value={formatDb(after?.peakDb)} tone="coral" />
        <Metric
          label="Crest"
          value={formatDb(after?.crestFactorDb ?? before?.crestFactorDb)}
        />
        <Metric
          label="Stereo"
          value={
            (after?.stereoCorrelation ?? before?.stereoCorrelation)
              ? round(
                  after?.stereoCorrelation ?? before?.stereoCorrelation ?? 0,
                  2
                ).toString()
              : 'mono'
          }
        />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-neutral-600">
        <MiniStat
          icon={<Activity />}
          label="Tone"
          value={formatPercent(after?.brightness ?? before?.brightness)}
        />
        <MiniStat
          icon={<RadioTower />}
          label="Low"
          value={formatPercent(after?.lowEnd ?? before?.lowEnd)}
        />
        <MiniStat
          icon={<SlidersHorizontal />}
          label="DC"
          value={round(after?.dcOffset ?? before?.dcOffset ?? 0, 4).toString()}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = 'teal'
}: {
  label: string;
  value: string;
  tone?: 'teal' | 'coral';
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p
        className={`mt-2 font-mono text-xl font-bold ${tone === 'coral' ? 'text-coral' : 'text-teal'}`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-neutral-100 px-2 py-2">
      <div className="flex items-center gap-1.5">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-violet">{icon}</span>
        <span className="font-semibold">{label}</span>
      </div>
      <div className="mt-1 font-mono text-neutral-800">{value}</div>
    </div>
  );
}

function formatDb(value?: number): string {
  return Number.isFinite(value) ? `${round(value ?? 0, 1)} dB` : '-';
}

function formatLufs(value?: number): string {
  return Number.isFinite(value) ? `${round(value ?? 0, 1)}` : '-';
}

function formatPercent(value?: number): string {
  return Number.isFinite(value) ? `${round((value ?? 0) * 100, 1)}%` : '-';
}
