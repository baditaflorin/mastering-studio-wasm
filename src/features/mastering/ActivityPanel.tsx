import { Clock3 } from 'lucide-react';
import type { ActivityLogEntry } from '../../lib/audio/types';

export function ActivityPanel({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-panel p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Activity</h2>
        <Clock3 className="h-5 w-5 text-violet" aria-hidden="true" />
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">
          Import a track to build an inspectable session history.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.slice(0, 8).map((entry) => (
            <article
              key={entry.id}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{entry.title}</p>
                <p className="font-mono text-[11px] text-neutral-500">
                  {formatTime(entry.at)}
                </p>
              </div>
              <p className="mt-1 text-sm text-neutral-600">{entry.detail}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}
