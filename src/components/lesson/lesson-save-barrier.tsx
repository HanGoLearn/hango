"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

class LessonSaveBarrier {
  private guards = new Set<() => Promise<void>>();
  register(guard: () => Promise<void>) {
    this.guards.add(guard);
    return () => {
      this.guards.delete(guard);
    };
  }
  async wait() {
    await Promise.all([...this.guards].map((guard) => guard()));
  }
}
const Context = createContext<LessonSaveBarrier | null>(null);
export function LessonSaveBarrierProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [barrier] = useState(() => new LessonSaveBarrier());
  return <Context.Provider value={barrier}>{children}</Context.Provider>;
}
export function useLessonSaveBarrier() {
  return useContext(Context);
}
export function useLessonLeaveGuard(guard: () => Promise<void>) {
  const barrier = useLessonSaveBarrier();
  useEffect(() => barrier?.register(guard), [barrier, guard]);
}

/** A pending/rejected graded-answer save also guards step-navigation, not
 * only the step's own Continue button. Retry is explicit at the exercise. */
export function useTrackedLessonSave() {
  const pending = useRef<Promise<unknown> | null>(null);
  const failed = useRef(false);
  const guard = useCallback(async () => {
    while (pending.current) await pending.current;
    if (failed.current) throw new Error("Lesson answers not saved");
  }, []);
  useLessonLeaveGuard(guard);
  return useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const previous = pending.current;
    const task = (
      previous ? previous.catch(() => undefined) : Promise.resolve()
    )
      .then(operation)
      .then(
        (result) => {
          failed.current = false;
          return result;
        },
        (error: unknown) => {
          failed.current = true;
          throw error;
        },
      )
      .finally(() => {
        if (pending.current === task) pending.current = null;
      });
    pending.current = task;
    return task;
  }, []);
}
