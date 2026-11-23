/** Cryptographically strong random values for health/demo simulations. */
export const secureRandomFloat = (): number => {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] / 0x1_0000_0000;
};

export const secureRandomInt = (minimum: number, maximum: number): number => {
    const low = Math.ceil(minimum);
    const high = Math.floor(maximum);
    if (high < low) throw new RangeError('maximum must be greater than or equal to minimum');
    return low + Math.floor(secureRandomFloat() * (high - low + 1));
};
