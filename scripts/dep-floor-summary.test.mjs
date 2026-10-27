#!/usr/bin/env node
// node --test scripts/dep-floor-summary.test.mjs
//
// Organised by WHICH CONDITION FIRED, not by which words came out. The defect
// these tests pin is that `violations.length > 0 || expired.length > 0` in
// scripts/dep-floor.mjs has four states and printed two strings, so the
// assertions that carry weight are the ones separating the states the old
// single message merged.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { summaryLine } from './dep-floor-summary.mjs';

describe('summaryLine', () => {
  test('says the floor holds when neither condition fired', () => {
    assert.equal(
      summaryLine(0, 0),
      'Dependency floor holds: no critical anywhere, no high in any production tree.',
    );
  });

  test('calls a real violation a breach, and names the two repairs for it', () => {
    const line = summaryLine(2, 0);
    assert.match(line, /^Dependency floor breached: /);
    assert.match(line, /2 advisories above the floor with nothing allowing them/);
    assert.match(line, /docs\/design\/dependency-floor\.md/);
  });

  test('does NOT call an expired exception a breach, because the floor was never breached', () => {
    // The branch this change exists for. An expiry is dep-floor.allow.json
    // asking the owner again, which is the file working as its own header
    // says it should. The old message reported it as a vulnerability somebody
    // had introduced, and sent the reader to hunt one that was not there.
    const line = summaryLine(0, 1);
    assert.match(line, /^The floor itself holds: /);
    assert.ok(!/breach/i.test(line), 'an expiry is not a breach and the line must not say it is');
    assert.match(line, /1 accepted exception has expired/);
    assert.match(line, /owner's call and not a seat's/);
  });

  test('reports both conditions separately when both fired', () => {
    const line = summaryLine(1, 3);
    assert.match(line, /^Dependency floor breached, and separately 3 accepted exceptions have expired\./);
    // Both repairs are named, because a reader who upgrades the dependency has
    // not dealt with the expiries and cannot: only the owner can.
    assert.match(line, /upgrade, or have the owner add an exception/);
    assert.match(line, /expiries are the owner's to renew or retire/);
  });

  test('agrees with itself on singular and plural', () => {
    assert.match(summaryLine(1, 0), /1 advisory above the floor with nothing allowing it\./);
    assert.match(summaryLine(2, 0), /2 advisories above the floor with nothing allowing them\./);
    assert.match(summaryLine(0, 1), /approved it\./);
    assert.match(summaryLine(0, 2), /2 accepted exceptions have expired, named above with who approved them\./);
  });
});
