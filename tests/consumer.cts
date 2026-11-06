import { expandRecurrence, type ExpansionOptions } from '@lp-labs/recurrence-engine';
const options: ExpansionOptions = { from: '2026-01-01T00:00:00Z', maxDays: 30 };
const occurrences: Date[] = expandRecurrence(
  { start: '2026-01-01T00:00:00Z', frequency: 'weekly', count: 3 },
  options,
);
void occurrences;
