export class RateLimiter {
  private tokens: Map<string, number> = new Map();
  private lastRefill: Map<string, number> = new Map();

  constructor(
    private maxTokens: number = 60,
    private refillRatePerSec: number = 30
  ) {}

  public allow(key: string): boolean {
    const now = Date.now();
    const last = this.lastRefill.get(key) || now;
    const elapsedSec = (now - last) / 1000;
    
    let currentTokens = (this.tokens.get(key) || this.maxTokens) + elapsedSec * this.refillRatePerSec;
    if (currentTokens > this.maxTokens) {
      currentTokens = this.maxTokens;
    }

    this.lastRefill.set(key, now);

    if (currentTokens >= 1) {
      this.tokens.set(key, currentTokens - 1);
      return true;
    }
    return false;
  }

  public removeKey(key: string): void {
    this.tokens.delete(key);
    this.lastRefill.delete(key);
  }
}
