import test from 'node:test';
import assert from 'node:assert/strict';
import { expandRecurrence } from '../dist/esm/index.js';

test('expands daily occurrences by count', () => {
  const occurrences = expandRecurrence({
    start: '2026-01-01T10:00:00Z',
    frequency: 'daily',
    count: 3,
  });
  assert.deepEqual(
    occurrences.map((date) => date.toISOString()),
    ['2026-01-01T10:00:00.000Z', '2026-01-02T10:00:00.000Z', '2026-01-03T10:00:00.000Z'],
  );
});

test('supports daily intervals and exclusive range end', () => {
  const occurrences = expandRecurrence(
    { start: '2026-01-01T00:00:00Z', frequency: 'daily', interval: 2, count: 5 },
    { from: '2026-01-04T00:00:00Z', to: '2026-01-10T00:00:00Z' },
  );
  assert.deepEqual(
    occurrences.map((date) => date.toISOString()),
    ['2026-01-05T00:00:00.000Z', '2026-01-07T00:00:00.000Z', '2026-01-09T00:00:00.000Z'],
  );
});

test('supports weekly weekday selection in UTC', () => {
  const occurrences = expandRecurrence({
    start: '2026-01-05T09:00:00Z',
    frequency: 'weekly',
    weekdays: [1, 3],
    count: 5,
  });
  assert.deepEqual(
    occurrences.map((date) => date.toISOString()),
    [
      '2026-01-05T09:00:00.000Z',
      '2026-01-07T09:00:00.000Z',
      '2026-01-12T09:00:00.000Z',
      '2026-01-14T09:00:00.000Z',
      '2026-01-19T09:00:00.000Z',
    ],
  );
});

test('defaults weekly weekdays to the start weekday', () => {
  const occurrences = expandRecurrence({
    start: '2026-01-07T09:00:00Z',
    frequency: 'weekly',
    count: 2,
  });
  assert.deepEqual(
    occurrences.map((date) => date.toISOString()),
    ['2026-01-07T09:00:00.000Z', '2026-01-14T09:00:00.000Z'],
  );
});

test('supports active week intervals', () => {
  const occurrences = expandRecurrence({
    start: '2026-01-05T09:00:00Z',
    frequency: 'weekly',
    interval: 2,
    weekdays: [1, 2],
    count: 4,
  });
  assert.deepEqual(
    occurrences.map((date) => date.toISOString()),
    [
      '2026-01-05T09:00:00.000Z',
      '2026-01-06T09:00:00.000Z',
      '2026-01-19T09:00:00.000Z',
      '2026-01-20T09:00:00.000Z',
    ],
  );
});

test('until is inclusive and exclusions do not reduce count', () => {
  const occurrences = expandRecurrence({
    start: '2026-01-01T00:00:00Z',
    frequency: 'daily',
    until: '2026-01-03T00:00:00Z',
    exclusions: ['2026-01-02T00:00:00Z'],
  });
  assert.deepEqual(
    occurrences.map((date) => date.toISOString()),
    ['2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z'],
  );
});

test('range lower bound is inclusive and preserves original UTC time', () => {
  const occurrences = expandRecurrence(
    { start: '2026-01-01T12:30:00Z', frequency: 'daily', count: 5 },
    { from: '2026-01-03T12:30:00Z' },
  );
  assert.deepEqual(
    occurrences.map((date) => date.toISOString()),
    ['2026-01-03T12:30:00.000Z', '2026-01-04T12:30:00.000Z', '2026-01-05T12:30:00.000Z'],
  );
});

test('caps returned occurrences', () => {
  const occurrences = expandRecurrence(
    { start: '2026-01-01T00:00:00Z', frequency: 'daily', count: 50 },
    { maxOccurrences: 2 },
  );
  assert.equal(occurrences.length, 2);
});

test('requires a bounded recurrence and strict UTC instants', () => {
  assert.throws(
    () => expandRecurrence({ start: '2026-01-01T00:00:00Z', frequency: 'daily' }),
    /bounded/,
  );
  assert.throws(
    () => expandRecurrence({ start: '2026-01-01T00:00:00-05:00', frequency: 'daily', count: 1 }),
    /UTC/,
  );
  assert.throws(
    () => expandRecurrence({ start: '2026-02-31T00:00:00Z', frequency: 'daily', count: 1 }),
    /valid UTC/,
  );
});

test('rejects invalid weekdays, options, and limits', () => {
  assert.throws(
    () =>
      expandRecurrence({
        start: '2026-01-01T00:00:00Z',
        frequency: 'weekly',
        weekdays: [1, 1],
        count: 1,
      }),
    /unique/,
  );
  assert.throws(
    () =>
      expandRecurrence(
        { start: '2026-01-01T00:00:00Z', frequency: 'daily', count: 1 },
        { from: '2026-01-02T00:00:00Z', to: '2025-01-01T00:00:00Z' },
      ),
    /to may not precede from/,
  );
  assert.throws(
    () =>
      expandRecurrence(
        {
          start: '2026-01-01T00:00:00Z',
          frequency: 'weekly',
          weekdays: [1],
          until: '2026-01-01T00:00:00Z',
        },
        { maxOccurrences: 0 },
      ),
    /maxOccurrences/,
  );
});

test('throws instead of silently returning an incomplete scan horizon', () => {
  assert.throws(
    () =>
      expandRecurrence(
        { start: '2026-01-01T00:00:00Z', frequency: 'daily', count: 20 },
        { maxDays: 2 },
      ),
    /scan exceeded/,
  );
});
