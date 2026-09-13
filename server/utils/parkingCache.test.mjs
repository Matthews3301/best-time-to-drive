import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildParkingFingerprint, parseRetryAfterMs } from './parkingCache.ts';

describe('parking destination cache key', () => {
  it('collapses case and whitespace so popular destinations share a key', () => {
    const a = buildParkingFingerprint('Long Beach, CA');
    const b = buildParkingFingerprint('  long   beach, ca ');
    assert.equal(a, b);
    assert.equal(a.length, 16);
  });

  it('keeps distinct destinations on distinct keys', () => {
    assert.notEqual(
      buildParkingFingerprint('Long Beach, CA'),
      buildParkingFingerprint('Los Angeles, CA')
    );
  });
});

describe('retry-after parsing', () => {
  it('uses Retry-After seconds and caps long waits', () => {
    assert.equal(parseRetryAfterMs('2', 1000), 2000);
    assert.equal(parseRetryAfterMs('120', 1000), 15_000);
  });

  it('falls back when the header is missing or invalid', () => {
    assert.equal(parseRetryAfterMs(null, 1000), 1000);
    assert.equal(parseRetryAfterMs('soon', 1500), 1500);
  });
});
