declare module "opossum" {
  interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    name?: string;
    volumeThreshold?: number;
  }

  interface CircuitBreaker<TResult = unknown> {
    fire(...args: unknown[]): Promise<TResult>;
    readonly name: string;
    readonly state: string;
    readonly stats: {
      failures: number;
      successes: number;
      rejects: number;
      timeouts: number;
    };
    on(event: string, handler: (...args: unknown[]) => void): void;
  }

  interface CircuitBreakerConstructor {
    new <TResult>(fn: (...args: unknown[]) => Promise<TResult>, options?: CircuitBreakerOptions): CircuitBreaker<TResult>;
    <TResult>(fn: (...args: unknown[]) => Promise<TResult>, options?: CircuitBreakerOptions): CircuitBreaker<TResult>;
    isOurError(error: Error): boolean;
    STATUS_OPEN: string;
    STATUS_HALF_OPEN: string;
    STATUS_CLOSED: string;
  }

  const CircuitBreaker: CircuitBreakerConstructor;
  export default CircuitBreaker;
}
