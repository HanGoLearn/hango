"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export interface LessonDisplayPrefs {
  showPinyin: boolean;
  showTranslation: boolean;
  toggleShowPinyin: () => void;
  toggleShowTranslation: () => void;
}

interface StoredPrefs {
  showPinyin: boolean;
  showTranslation: boolean;
}

const STORAGE_KEY = "hango:lesson-display-prefs";
const DEFAULT_PREFS: StoredPrefs = { showPinyin: true, showTranslation: true };

/**
 * Pinyin/translation visibility (6.4) - a lesson-wide reading preference,
 * not tied to any one step. Persisted to localStorage rather than a new DB
 * field/LearnerProfile column: it's a display toggle, not learner-profile
 * data anything else needs to read.
 *
 * Sync'd via useSyncExternalStore (not useState+useEffect) specifically so
 * the server-rendered HTML always assumes the default and the client
 * reconciles to the stored value after hydration, instead of a raw
 * setState-in-effect causing a hydration mismatch when a returning
 * learner's saved prefs differ from the default.
 */
let cached: StoredPrefs | null = null;
const listeners = new Set<() => void>();

function readStoredPrefs(): StoredPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_PREFS;
    return {
      showPinyin:
        "showPinyin" in parsed && typeof parsed.showPinyin === "boolean"
          ? parsed.showPinyin
          : true,
      showTranslation:
        "showTranslation" in parsed &&
        typeof parsed.showTranslation === "boolean"
          ? parsed.showTranslation
          : true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function getSnapshot(): StoredPrefs {
  cached ??= readStoredPrefs();
  return cached;
}

function getServerSnapshot(): StoredPrefs {
  return DEFAULT_PREFS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writePrefs(next: StoredPrefs) {
  cached = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

const LessonDisplayPrefsContext = createContext<LessonDisplayPrefs | null>(
  null,
);

export function LessonDisplayPrefsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <LessonDisplayPrefsContext.Provider
      value={{
        showPinyin: prefs.showPinyin,
        showTranslation: prefs.showTranslation,
        toggleShowPinyin: () =>
          writePrefs({ ...prefs, showPinyin: !prefs.showPinyin }),
        toggleShowTranslation: () =>
          writePrefs({ ...prefs, showTranslation: !prefs.showTranslation }),
      }}
    >
      {children}
    </LessonDisplayPrefsContext.Provider>
  );
}

export function useLessonDisplayPrefs(): LessonDisplayPrefs {
  const ctx = useContext(LessonDisplayPrefsContext);
  if (!ctx) {
    throw new Error(
      "useLessonDisplayPrefs must be used within LessonDisplayPrefsProvider",
    );
  }
  return ctx;
}
