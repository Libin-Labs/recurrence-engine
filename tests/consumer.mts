import { expandRecurrence, type RecurrenceRule } from '@lp-labs/recurrence-engine';
const rule: RecurrenceRule = { start: '2026-01-01T00:00:00Z', frequency: 'daily', count: 4 };
const occurrences: Date[] = expandRecurrence(rule, { maxOccurrences: 2 });
void occurrences;
