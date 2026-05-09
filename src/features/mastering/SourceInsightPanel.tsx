import { AlertTriangle, BrainCircuit, ShieldAlert, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PreflightReport, SourceProfile } from '../../lib/audio/types';

interface SourceInsightPanelProps {
  profile?: SourceProfile | null;
  preflight?: PreflightReport | null;
}

export function SourceInsightPanel({ profile, preflight }: SourceInsightPanelProps) {
  if (!profile || !preflight) {
    return (
      <section className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
        <h2 className="text-lg font-bold">Source read</h2>
        <p className="mt-3 text-sm text-neutral-600">
          Import audio and the app will classify the source, flag anomalies, and
          recommend the first mastering pass.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Source read</h2>
        <BrainCircuit className="h-5 w-5 text-teal" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InsightCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Detected source"
          value={profile.classification}
          confidence={profile.classificationConfidence.label}
        />
        <InsightCard
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Recommended preset"
          value={profile.recommendedPreset}
          confidence={profile.presetConfidence.label}
        />
      </div>

      <div className="mt-4 rounded-md border border-neutral-200 bg-white p-3 text-sm">
        <p className="font-semibold text-neutral-700">State</p>
        <p className="mt-1 capitalize text-ink">{profile.state}</p>
        <p className="mt-2 text-xs text-neutral-500">
          Format: {preflight.detectedFormat.toUpperCase()} · Source ID:{' '}
          {preflight.sourceId}
        </p>
      </div>

      <details className="mt-4 rounded-md border border-neutral-200 bg-white p-3">
        <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
          Why the app thinks this
        </summary>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          {profile.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </details>

      {profile.anomalies.length > 0 ? (
        <div className="mt-4 space-y-2">
          {profile.anomalies.map((anomaly) => (
            <article
              key={anomaly.id}
              className={`rounded-md border p-3 text-sm ${
                anomaly.severity === 'blocker'
                  ? 'border-coral/30 bg-coral/5'
                  : anomaly.severity === 'warning'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-coral" />
                <div>
                  <p className="font-semibold">{anomaly.title}</p>
                  <p className="mt-1 text-neutral-700">{anomaly.what}</p>
                  <p className="mt-1 text-neutral-600">{anomaly.why}</p>
                  <p className="mt-1 font-medium text-neutral-700">
                    Next: {anomaly.nextStep}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function InsightCard({
  icon,
  label,
  value,
  confidence
}: {
  icon: ReactNode;
  label: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3">
      <div className="flex items-center gap-2 text-neutral-500">
        {icon}
        <p className="text-xs font-semibold uppercase">{label}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="capitalize font-bold text-ink">{value}</p>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${
            confidence === 'high'
              ? 'bg-teal/15 text-teal'
              : confidence === 'medium'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-coral/10 text-coral'
          }`}
        >
          {confidence}
        </span>
      </div>
    </div>
  );
}
