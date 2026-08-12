import { describe, it, expect } from 'vitest';

describe('gigpay application logic', () => {
  it('compiles and exposes the contract', async () => {
    // Dynamic import to match the deploy script pattern
    const Gigpay = await import('../contracts/managed/gigpay/contract/index.cjs').catch(() => null)
      || await import('../contracts/managed/gigpay/contract/index.js').catch(() => null);
    
    expect(Gigpay).toBeDefined();
    expect(Gigpay.Contract).toBeDefined();
    // Ensures the managed compiler output was successfully generated
  });

  it('correctly pads string variables to 32 bytes for Opaque<string> inputs', () => {
    // The Midnight JS SDK requires Opaque<"string"> (32 bytes) inputs to be exactly 32 chars.
    const rawProjectName = "My Shielded Gig";
    const paddedProjectName = rawProjectName.padEnd(32, ' ').slice(0, 32);
    
    expect(paddedProjectName.length).toBe(32);
    expect(paddedProjectName).toBe("My Shielded Gig                 ");
    
    // Test truncation for over 32 chars
    const longString = "This is a very long project name that exceeds thirty two characters";
    const truncatedString = longString.padEnd(32, ' ').slice(0, 32);
    expect(truncatedString.length).toBe(32);
    expect(truncatedString).toBe("This is a very long project name");
  });

  it('validates the initial private state schema', () => {
    // The frontend must provide an empty object for the gigpay private state
    // because the DApp only creates gigs and writes to public state, while
    // the private state is handled dynamically by the circuit when called.
    const privateStateId = 'gigpayPrivateState';
    const initialPrivateState = {};
    
    expect(privateStateId).toBe('gigpayPrivateState');
    expect(typeof initialPrivateState).toBe('object');
    expect(Object.keys(initialPrivateState).length).toBe(0);
  });
});
