import { Trip } from '../types';

interface ServerState {
  trips: Trip[];
  updatedAt: number;
}

let _knownTs = 0;
let _pendingSave = false;           // true while a save is debounced or in-flight
let _pollTimer: ReturnType<typeof setInterval> | null = null;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _onRemoteUpdate: ((trips: Trip[]) => void) | null = null;

// ── Helpers ────────────────────────────────────────────────────────

async function fetchState(): Promise<ServerState> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

async function fetchTs(): Promise<number> {
  try {
    const res = await fetch('/api/state/ts');
    if (!res.ok) return _knownTs;
    const data = await res.json();
    return data.updatedAt ?? 0;
  } catch {
    return _knownTs;
  }
}

async function pushState(trips: Trip[]): Promise<void> {
  const res = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trips }),
  });
  if (res.ok) {
    const { updatedAt } = await res.json();
    _knownTs = updatedAt;
  }
  _pendingSave = false;
}

// ── Public API ─────────────────────────────────────────────────────

/** Call once on app start. Loads server state and begins polling. */
export async function initSync(onRemoteUpdate: (trips: Trip[]) => void): Promise<Trip[]> {
  _onRemoteUpdate = onRemoteUpdate;

  let initial: Trip[] = [];
  try {
    const state = await fetchState();
    _knownTs = state.updatedAt ?? 0;
    initial = state.trips ?? [];
  } catch {
    console.warn('[sync] Could not reach backend — starting offline');
  }

  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = setInterval(async () => {
    // Never override local state while we have unsaved changes
    if (_pendingSave) return;

    try {
      const ts = await fetchTs();
      if (ts > _knownTs) {
        const state = await fetchState();
        _knownTs = state.updatedAt;
        _onRemoteUpdate?.(state.trips ?? []);
      }
    } catch { /* network hiccup */ }
  }, 6000);

  return initial;
}

/** Debounced save — call after every local mutation. */
export function scheduleSave(trips: Trip[]): void {
  _pendingSave = true;              // block poll from overriding until save lands
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    pushState(trips).catch(() => {
      _pendingSave = false;         // allow poll again if save fails
      console.warn('[sync] Save failed');
    });
  }, 400);
}

/** Let callers check whether a local save is in flight */
export const isPendingSave = () => _pendingSave;

export function stopSync(): void {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
}
