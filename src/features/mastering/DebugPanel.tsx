import type {
  AudioMetrics,
  MasteringResult,
  PreflightReport,
  SourceProfile
} from '../../lib/audio/types';

interface DebugPanelProps {
  visible: boolean;
  preflight?: PreflightReport | null;
  metrics?: AudioMetrics;
  profile?: SourceProfile | null;
  result?: MasteringResult | null;
}

export function DebugPanel({
  visible,
  preflight,
  metrics,
  profile,
  result
}: DebugPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-ink p-5 text-white shadow-sm">
      <h2 className="text-lg font-bold">Debug surface</h2>
      <p className="mt-2 text-sm text-white/70">
        This overlay is enabled by `?debug=1`.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <JsonBlock title="Preflight" value={preflight} />
        <JsonBlock title="Input metrics" value={metrics} />
        <JsonBlock title="Profile" value={profile} />
        <JsonBlock title="Result provenance" value={result?.provenance} />
      </div>
    </section>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <pre className="mt-2 overflow-auto text-xs leading-5 text-white/80">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
