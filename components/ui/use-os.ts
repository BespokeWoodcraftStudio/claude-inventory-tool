"use client";

import { useSyncExternalStore } from "react";
import type { Os } from "@/components/inventory/constants";

// A tiny shared store for the user's OS choice, persisted to localStorage so it
// stays consistent across every island that shows a scan command (the hero, the
// setup wizard, the upload panel). Toggling in one place updates them all.
const KEY = "cit-os";
let current: Os | null = null;
const listeners = new Set<() => void>();

function read(): Os {
  if (current !== null) return current;
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    current = v === "windows" ? "windows" : "mac";
  } catch {
    current = "mac";
  }
  return current;
}

export function setOs(os: Os) {
  current = os;
  try { localStorage.setItem(KEY, os); } catch { /* private mode / disabled */ }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Shared, persisted OS selection. Server snapshot is "mac" to avoid hydration mismatch. */
export function useOs(): Os {
  return useSyncExternalStore(subscribe, read, () => "mac");
}
