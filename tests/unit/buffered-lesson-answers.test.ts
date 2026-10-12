import { describe, expect, it, vi } from "vitest";
import { BufferedLessonAnswers } from "@/lib/buffered-lesson-answers";
describe("Answer save boundary", () => {
  it("waits for earlier batches and answers queued during a save", async () => {
    let resolve!: () => void;
    const write = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValue(undefined);
    const queue = new BufferedLessonAnswers<number>(write);
    queue.enqueue([1]);
    const flushing = queue.flush();
    queue.enqueue([2]);
    expect(queue.flush()).toBe(flushing);
    resolve();
    await flushing;
    expect(write.mock.calls).toEqual([[[1]], [[2]]]);
  });
  it("retains a failed batch ahead of new answers for explicit retry", async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const queue = new BufferedLessonAnswers<number>(write);
    queue.enqueue([1]);
    await expect(queue.flush()).rejects.toThrow("offline");
    queue.enqueue([2]);
    await queue.flush();
    expect(write.mock.calls).toEqual([[[1]], [[1, 2]]]);
    await queue.flush();
    expect(write).toHaveBeenCalledTimes(2);
  });
  it("does not write for an empty queue", async () => {
    const write = vi.fn();
    await new BufferedLessonAnswers(write).flush();
    expect(write).not.toHaveBeenCalled();
  });
});
