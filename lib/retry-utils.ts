/**
 * Professional retry utilities for handling rate limits and network issues
 */

export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
};

export class RetryError extends Error {
    constructor(
        message: string,
        public readonly originalError: Error,
        public readonly attempts: number
    ) {
        super(message);
        this.name = 'RetryError';
    }
}

/**
 * Determines if an error should trigger a retry
 */
export function shouldRetry(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const message = error.message.toLowerCase();
    
    // Rate limit errors
    if (message.includes('429') || 
        message.includes('rate limit') ||
        message.includes('over rate limit') ||
        message.includes('too many requests')) {
        return true;
    }
    
    // Network errors
    if (message.includes('network error') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('enotfound')) {
        return true;
    }
    
    // RPC errors
    if (message.includes('rpc error') ||
        message.includes('server error') ||
        message.includes('internal server error')) {
        return true;
    }
    
    return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateDelay(
    attempt: number, 
    config: RetryConfig
): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Cap at max delay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
        delay += Math.random() * 1000;
    }
    
    return Math.floor(delay);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Professional retry wrapper with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            // Don't retry if it's not a retryable error
            if (!shouldRetry(error)) {
                throw error;
            }
            
            // Don't retry on last attempt
            if (attempt === finalConfig.maxRetries) {
                throw new RetryError(
                    `Failed after ${finalConfig.maxRetries + 1} attempts`,
                    lastError,
                    finalConfig.maxRetries + 1
                );
            }
            
            // Calculate delay and wait
            const delay = calculateDelay(attempt, finalConfig);
            console.log(
                `🔄 Retry attempt ${attempt + 1}/${finalConfig.maxRetries + 1} ` +
                `in ${Math.round(delay)}ms. Error: ${lastError.message}`
            );
            
            await sleep(delay);
        }
    }
    
    throw lastError!;
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    
    constructor(
        private readonly threshold: number = 5,
        private readonly timeout: number = 60000
    ) {}
    
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    private onSuccess(): void {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    
    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
        }
    }
}

/**
 * Rate limiter to prevent hitting rate limits
 */
export class RateLimiter {
    private requests: number[] = [];
    
    constructor(
        private readonly maxRequests: number = 10,
        private readonly windowMs: number = 1000
    ) {}
    
    async waitIfNeeded(): Promise<void> {
        const now = Date.now();
        
        // Remove old requests outside the window
        this.requests = this.requests.filter(
            time => now - time < this.windowMs
        );
        
        // If we're at the limit, wait
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = this.windowMs - (now - oldestRequest);
            
            if (waitTime > 0) {
                console.log(`⏳ Rate limiter: waiting ${waitTime}ms`);
                await sleep(waitTime);
            }
        }
        
        // Record this request
        this.requests.push(now);
    }
}

// Global instances
export const globalCircuitBreaker = new CircuitBreaker();
export const globalRateLimiter = new RateLimiter();
