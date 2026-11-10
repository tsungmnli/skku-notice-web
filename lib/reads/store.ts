"use client";

import { isMockMode } from "@/lib/auth/config";
import { todayInSeoul, toSeoulDateStr } from "@/utils/date";
import { windowStart, type ReadRecord } from "@/lib/freshness";

const LOCAL_READS_KEY = isMockMode
  ? "skku-notice-reads:mock"
  : "skku-notice-reads";
const BASELINE_KEY = isMockMode
  ? "skku-notice-baseline:mock"
  : "skku-notice-baseline";
const CHANGE_EVENT = "reads-changed";

const EMPTY_READS: Record<number, string> = {};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function notify(): void {
  for (const l of listeners) l();
}

export function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener(CHANGE_EVENT, callback);
      window.removeEventListener("storage", callback);
    }
  };
}

// --- local reads (anonymous) ---

let cachedLocalRaw: string | null | undefined;
let cachedLocalReads: Record<number, string> = EMPTY_READS;

function readLocalReads(): Record<number, string> {
  if (typeof window === "undefined") return EMPTY_READS;
  try {
    const raw = window.localStorage.getItem(LOCAL_READS_KEY);
    if (raw === cachedLocalRaw) return cachedLocalReads;
    cachedLocalRaw = raw;
    if (!raw) {
      cachedLocalReads = EMPTY_READS;
      return cachedLocalReads;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      cachedLocalReads = EMPTY_READS;
      return cachedLocalReads;
    }
    const result: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k);
      if (Number.isFinite(id) && typeof v === "string") {
        result[id] = v;
      }
    }
    cachedLocalReads = result;
    return result;
  } catch {
    cachedLocalReads = EMPTY_READS;
    return cachedLocalReads;
  }
}

function writeLocalReads(reads: Record<number, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_READS_KEY, JSON.stringify(reads));
    cachedLocalRaw = undefined;
    emit();
    notify();
  } catch {
    // ignore
  }
}

export function clearLocalReads(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_READS_KEY);
    cachedLocalRaw = undefined;
    emit();
    notify();
  } catch {
    // ignore
  }
}

/** read_at의 서울 날짜가 windowStart보다 이전인 항목은 지운다. */
export function purgeOldLocalReads(): void {
  if (typeof window === "undefined") return;
  const reads = readLocalReads();
  const ws = windowStart(todayInSeoul());
  let changed = false;
  const next: Record<number, string> = {};
  for (const [id, readAt] of Object.entries(reads)) {
    const dateStr = readAt.slice(0, 10);
    if (dateStr < ws) {
      changed = true;
    } else {
      next[Number(id)] = readAt;
    }
  }
  if (changed) writeLocalReads(next);
}

// --- server reads (authenticated) ---

let serverReads: Record<number, string> = EMPTY_READS;
let serverReadsVersion = 0;

export function getServerReads(): Record<number, string> {
  return serverReads;
}

export function setServerReads(items: ReadRecord[]): void {
  const next: Record<number, string> = {};
  for (const item of items) {
    next[item.article_id] = item.read_at;
  }
  serverReads = next;
  serverReadsVersion++;
  emit();
  notify();
}

export function clearServerReads(): void {
  serverReads = EMPTY_READS;
  serverReadsVersion++;
  emit();
  notify();
}

export function getServerReadsVersion(): number {
  return serverReadsVersion;
}

// --- baseline ---

let cachedBaselineRaw: string | null | undefined;
let cachedBaseline: string | null = null;

export function getBaseline(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BASELINE_KEY);
    if (raw === cachedBaselineRaw) return cachedBaseline;
    cachedBaselineRaw = raw;
    if (!raw) {
      cachedBaseline = null;
      return null;
    }
    cachedBaseline = raw;
    return cachedBaseline;
  } catch {
    return cachedBaseline;
  }
}

export function setBaseline(date: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BASELINE_KEY, date);
    cachedBaselineRaw = undefined;
    cachedBaseline = date;
    emit();
    notify();
  } catch {
    // ignore
  }
}

export function ensureBaseline(userCreatedAt: string | null): string {
  const stored = getBaseline();
  if (!stored) {
    let baseline: string;
    if (userCreatedAt) {
      baseline = userCreatedAt.slice(0, 10);
    } else {
      baseline = toSeoulDateStr(todayInSeoul());
      setBaseline(baseline);
    }
    if (userCreatedAt) {
      setBaseline(baseline);
    }
    return baseline;
  }
  if (userCreatedAt) {
    const createdDate = userCreatedAt.slice(0, 10);
    if (createdDate < stored) {
      setBaseline(createdDate);
      return createdDate;
    }
  }
  return stored;
}

// --- snapshot for useSyncExternalStore ---

let cachedSnapshot: {
  reads: Record<number, string>;
  baseline: string | null;
  version: number;
} | null = null;
let cachedSnapshotKey: string = "";

export type ReadsSnapshot = {
  reads: Record<number, string>;
  baseline: string | null;
};

// useSyncExternalStore는 같은 상태에서 항상 동일한 참조를 요구하므로 상수로 고정
const SERVER_SNAPSHOT: ReadsSnapshot = { reads: EMPTY_READS, baseline: null };

export function getSnapshot(): ReadsSnapshot {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }
  const localReads = readLocalReads();
  const sr = getServerReads();
  const baseline = getBaseline();
  const version = getServerReadsVersion();
  const key = `${cachedLocalRaw ?? ""}|${version}|${cachedBaselineRaw ?? ""}`;
  if (key === cachedSnapshotKey && cachedSnapshot) {
    return cachedSnapshot;
  }
  cachedSnapshotKey = key;
  // Merge: server reads take precedence, then local
  const merged: Record<number, string> = { ...localReads };
  for (const [id, readAt] of Object.entries(sr)) {
    const numId = Number(id);
    const existing = merged[numId];
    if (!existing || readAt > existing) {
      merged[numId] = readAt;
    }
  }
  cachedSnapshot = { reads: merged, baseline, version };
  return cachedSnapshot;
}

export function getServerSnapshot(): ReadsSnapshot {
  return SERVER_SNAPSHOT;
}

// --- read lookup ---

export function getRead(articleId: number): ReadRecord | null {
  const snapshot = getSnapshot();
  const readAt = snapshot.reads[articleId];
  if (!readAt) return null;
  return { article_id: articleId, read_at: readAt };
}

// --- mark read (queue) ---

const pendingQueue = new Map<number, string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DELAY = 3000;
const BATCH_SIZE = 200;

type FlushFn = (items: ReadRecord[]) => Promise<void>;
type BeaconFn = (items: ReadRecord[]) => boolean;

let flushFn: FlushFn | null = null;
let beaconFn: BeaconFn | null = null;

export function setFlushFunctions(flush: FlushFn, beacon: BeaconFn): void {
  flushFn = flush;
  beaconFn = beacon;
}

export function markReadLocal(articleId: number, readAt?: string): void {
  const at = readAt || new Date().toISOString();
  // Only update if newer
  if (typeof window !== "undefined") {
    const reads = readLocalReads();
    const existing = reads[articleId];
    if (!existing || at > existing) {
      reads[articleId] = at;
      writeLocalReads(reads);
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPending();
  }, FLUSH_DELAY);
}

export function flushPending(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pendingQueue.size === 0 || !flushFn) return;
  const items: ReadRecord[] = [];
  for (const [id, readAt] of pendingQueue) {
    items.push({ article_id: id, read_at: readAt });
  }
  pendingQueue.clear();

  // Send in batches of 200
  const batches: ReadRecord[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }
  void Promise.all(batches.map((b) => flushFn!(b))).catch(() => {});
}

export function flushPendingBeacon(): void {
  if (pendingQueue.size === 0) return;
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!beaconFn) {
    // fallback to flush if no beacon
    flushPending();
    return;
  }
  const items: ReadRecord[] = [];
  for (const [id, readAt] of pendingQueue) {
    items.push({ article_id: id, read_at: readAt });
  }
  pendingQueue.clear();

  const batches: ReadItemBatch[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }
  for (const batch of batches) {
    beaconFn(batch);
  }
}

type ReadItemBatch = ReadRecord[];

export function markRead(articleId: number, isAuthenticated: boolean): void {
  const readAt = new Date().toISOString();

  // Always update local immediately (for anonymous this is the store, for
  // authenticated this provides instant feedback before server confirms)
  if (typeof window !== "undefined") {
    const reads = readLocalReads();
    const existing = reads[articleId];
    if (!existing || readAt > existing) {
      reads[articleId] = readAt;
      writeLocalReads(reads);
    }
  }

  if (isAuthenticated) {
    const existing = pendingQueue.get(articleId);
    if (!existing || readAt > existing) {
      pendingQueue.set(articleId, readAt);
    }
    scheduleFlush();
  }
}

// --- merge local reads to server on login ---

export function getLocalReadsForUpload(): ReadRecord[] {
  const reads = readLocalReads();
  return Object.entries(reads).map(([id, readAt]) => ({
    article_id: Number(id),
    read_at: readAt,
  }));
}

/**
 * 서버에 올라간 항목만 로컬에서 지운다. 업로드에 실패한 항목은 남겨 두어
 * 일시적 오류에도 읽음 기록이 사라지지 않고, 다음 로그인 때 다시 올린다.
 * 업로드하는 사이에 다시 읽어 read_at 이 바뀐 항목도 남긴다.
 */
export function clearLocalReadsAfterMerge(uploaded: ReadRecord[]): void {
  if (typeof window === "undefined" || uploaded.length === 0) return;
  const reads = readLocalReads();
  const next: Record<number, string> = {};
  let changed = false;
  for (const [id, readAt] of Object.entries(reads)) {
    next[Number(id)] = readAt;
  }
  for (const item of uploaded) {
    if (next[item.article_id] === item.read_at) {
      delete next[item.article_id];
      changed = true;
    }
  }
  if (!changed) return;
  if (Object.keys(next).length === 0) {
    clearLocalReads();
  } else {
    writeLocalReads(next);
  }
}
