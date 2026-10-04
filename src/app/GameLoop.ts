export class GameLoop {
  private handle = 0;
  private last = 0;
  private active = false;

  constructor(private readonly onFrame: (frameDt: number) => void) {}

  /** requestAnimationFrame-Schleife; frameDt in Sekunden, auf max 0.1 begrenzt. */
  start(): void {
    if (this.active) return;
    this.active = true;
    this.last = performance.now();
    this.handle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.active = false;
    cancelAnimationFrame(this.handle);
  }

  get running(): boolean {
    return this.active;
  }

  private readonly tick = (now: number): void => {
    if (!this.active) return;
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.onFrame(dt);
    if (this.active) this.handle = requestAnimationFrame(this.tick);
  };
}
