import pRetryOriginal from '../node_modules/p-retry/index.js';

// Type-safe extraction of AbortError
// p-retry v4.x exports AbortError as a property of the default export in CJS
const original = pRetryOriginal as any;
export const AbortError = original.AbortError || original.default?.AbortError;

const pRetry = original.default || original;

export default pRetry;
