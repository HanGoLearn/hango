// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LessonSaveBarrierProvider,
  useLessonSaveBarrier,
  useTrackedLessonSave,
} from "@/components/lesson/lesson-save-barrier";
afterEach(cleanup);
function Harness({
  write,
  speaking,
}: {
  write: () => Promise<void>;
  speaking: () => void;
}) {
  const track = useTrackedLessonSave();
  const barrier = useLessonSaveBarrier();
  const [error, setError] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          void track(write).catch(() => setError(true));
        }}
      >
        Save answer
      </button>
      <button
        onClick={() => {
          void barrier!
            .wait()
            .then(speaking)
            .catch(() => setError(true));
        }}
      >
        Go to Speaking
      </button>
      {error && <p role="alert">Unsaved answer</p>}
    </>
  );
}
describe("Graded exercise navigation barrier", () => {
  it("cannot leave while a grade is still saving", async () => {
    let resolve!: () => void;
    const write = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const speaking = vi.fn();
    render(
      <LessonSaveBarrierProvider>
        <Harness write={write} speaking={speaking} />
      </LessonSaveBarrierProvider>,
    );
    fireEvent.click(screen.getByText("Save answer"));
    fireEvent.click(screen.getByText("Go to Speaking"));
    await waitFor(() => expect(write).toHaveBeenCalled());
    expect(speaking).not.toHaveBeenCalled();
    await act(async () => resolve());
    expect(speaking).toHaveBeenCalledTimes(1);
  });
  it("a failed save blocks navigation until an explicit successful retry", async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const speaking = vi.fn();
    render(
      <LessonSaveBarrierProvider>
        <Harness write={write} speaking={speaking} />
      </LessonSaveBarrierProvider>,
    );
    fireEvent.click(screen.getByText("Save answer"));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByText("Go to Speaking"));
    await act(async () => {});
    expect(speaking).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Save answer"));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByText("Go to Speaking"));
    await waitFor(() => expect(speaking).toHaveBeenCalledTimes(1));
  });
});
