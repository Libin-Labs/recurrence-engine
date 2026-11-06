export interface RecurrenceRule {
  start: string;
  frequency: 'daily' | 'weekly';
  interval?: number;
  weekdays?: readonly number[];
  count?: number;
  until?: string;
  exclusions?: readonly string[];
}

export interface ExpansionOptions {
  from?: string;
  to?: string;
  maxOccurrences?: number;
  maxDays?: number;
}

const DAY_MS = 86_400_000;

function utc(value: string, name: string): number {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
  ) {
    throw new TypeError(`${name} must be an ISO UTC timestamp ending in Z.`);
  }
  const parsed = Date.parse(value);
  if (
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString().slice(0, 10) !== value.slice(0, 10)
  ) {
    throw new TypeError(`${name} must be a valid UTC timestamp.`);
  }
  return parsed;
}

export function expandRecurrence(rule: RecurrenceRule, options: ExpansionOptions = {}): Date[] {
  if (!rule || typeof rule !== 'object') throw new TypeError('Expected a recurrence rule.');
  const start = utc(rule.start, 'start');
  if (rule.frequency !== 'daily' && rule.frequency !== 'weekly') {
    throw new TypeError('Frequency must be daily or weekly.');
  }
  const interval = rule.interval ?? 1;
  if (!Number.isSafeInteger(interval) || interval < 1 || interval > 10_000) {
    throw new RangeError('Interval must be an integer from 1 to 10000.');
  }
  if (rule.count === undefined && rule.until === undefined) {
    throw new TypeError('A bounded recurrence needs count, until, or both.');
  }
  if (rule.count !== undefined && (!Number.isSafeInteger(rule.count) || rule.count < 1)) {
    throw new RangeError('Count must be a positive safe integer.');
  }
  const until = rule.until === undefined ? Number.POSITIVE_INFINITY : utc(rule.until, 'until');
  if (until < start) throw new RangeError('until may not precede start.');

  let weekdays: Set<number>;
  if (rule.frequency === 'weekly') {
    const values = rule.weekdays ?? [new Date(start).getUTCDay()];
    if (!Array.isArray(values) || values.length === 0 || values.length > 7) {
      throw new RangeError('Weekly weekdays must contain 1 to 7 values.');
    }
    weekdays = new Set();
    for (const weekday of values) {
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || weekdays.has(weekday)) {
        throw new RangeError('Weekdays must be unique UTC weekday numbers from 0 to 6.');
      }
      weekdays.add(weekday);
    }
  } else {
    if (rule.weekdays !== undefined)
      throw new TypeError('weekdays is supported only for weekly rules.');
    weekdays = new Set();
  }

  const exclusions = new Set<number>();
  if (rule.exclusions !== undefined) {
    if (!Array.isArray(rule.exclusions) || rule.exclusions.length > 100_000) {
      throw new RangeError('Exclusions must be an array containing at most 100000 timestamps.');
    }
    for (const exclusion of rule.exclusions) exclusions.add(utc(exclusion, 'exclusion'));
  }
  const from = options.from === undefined ? Number.NEGATIVE_INFINITY : utc(options.from, 'from');
  const to = options.to === undefined ? Number.POSITIVE_INFINITY : utc(options.to, 'to');
  if (to < from) throw new RangeError('to may not precede from.');
  const maxOccurrences = options.maxOccurrences ?? 1000;
  if (!Number.isSafeInteger(maxOccurrences) || maxOccurrences < 1 || maxOccurrences > 10_000) {
    throw new RangeError('maxOccurrences must be an integer from 1 to 10000.');
  }
  const maxDays = options.maxDays ?? 36_600;
  if (!Number.isSafeInteger(maxDays) || maxDays < 1 || maxDays > 1_000_000) {
    throw new RangeError('maxDays must be an integer from 1 to 1000000.');
  }

  const output: Date[] = [];
  let scheduled = 0;
  let exhausted = false;
  for (let dayOffset = 0; dayOffset < maxDays; dayOffset += 1) {
    const candidate = start + dayOffset * DAY_MS;
    if (!Number.isFinite(candidate) || candidate > until) {
      exhausted = true;
      break;
    }
    if (candidate >= to) {
      exhausted = true;
      break;
    }
    const date = new Date(candidate);
    let matches = false;
    if (rule.frequency === 'daily') {
      matches = dayOffset % interval === 0;
    } else {
      const weekOffset = Math.floor((new Date(start).getUTCDay() + dayOffset) / 7);
      matches = weekOffset % interval === 0 && weekdays.has(date.getUTCDay());
    }
    if (!matches) continue;
    if (rule.count !== undefined && scheduled >= rule.count) {
      exhausted = true;
      break;
    }
    scheduled += 1;
    if (candidate < from || candidate >= to || exclusions.has(candidate)) continue;
    output.push(date);
    if (output.length === maxOccurrences) return output;
  }
  if (rule.count !== undefined && scheduled >= rule.count) exhausted = true;
  if (start + maxDays * DAY_MS > until) exhausted = true;
  if (!exhausted) {
    throw new RangeError(`Recurrence scan exceeded the configured ${maxDays}-day horizon.`);
  }
  return output;
}
