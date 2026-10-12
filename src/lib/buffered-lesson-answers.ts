/** Serial batches, retained on failure. Flush resolves only after every
 * queued answer is acknowledged; no fire-and-forget completion boundary. */
export class BufferedLessonAnswers<T> {
  private pending: T[] = [];
  private inFlight: Promise<void> | null = null;
  constructor(private readonly write: (answers: T[]) => Promise<void>) {}

  enqueue(answers: T[]) {
    this.pending.push(...answers);
  }

  flush(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    if (!this.pending.length) return Promise.resolve();
    const drain = async () => {
      while (this.pending.length) {
        const batch = this.pending;
        this.pending = [];
        try {
          await this.write(batch);
        } catch (error) {
          this.pending.unshift(...batch);
          throw error;
        }
      }
    };
    this.inFlight = drain().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }
}
