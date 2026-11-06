# @lp-labs/recurrence-engine

Expand a deliberately small, bounded recurrence schema into UTC instants. This is not a full
RFC 5545/iCalendar implementation. It has zero runtime and peer dependencies and ships ESM,
CommonJS and TypeScript declarations.

## Install

```sh
npm install @lp-labs/recurrence-engine
```

Requires Node.js 18+ or an ESM-aware bundler. CommonJS:
`const { expandRecurrence } = require('@lp-labs/recurrence-engine')`.

## Quickstart

```js
import { expandRecurrence } from '@lp-labs/recurrence-engine';

const dates = expandRecurrence({
  start: '2026-01-05T09:00:00Z',
  frequency: 'weekly',
  weekdays: [1, 3, 5],
  count: 6,
  exclusions: ['2026-01-07T09:00:00Z'],
});
console.log(dates.map((date) => date.toISOString()));
```

## Public API

Runtime export: `expandRecurrence(rule, options?): Date[]`.

Type exports: `RecurrenceRule`, `ExpansionOptions`.

A rule requires `start` (a UTC timestamp ending in `Z`) and `frequency` (`daily` or `weekly`).
`interval` defaults to 1. Daily schedules recur every interval days. Weekly schedules can list
unique UTC weekdays 0–6 (Sunday–Saturday); if omitted, the start weekday is used. The week containing
the start is the first recurrence week, and weeks repeat every interval weeks. Weekly occurrences
retain the start time of day.

Supply `count` (scheduled candidates, including excluded candidates), `until` (inclusive UTC
timestamp), or both to bound the rule. `exclusions` are exact UTC instants, not dates. Optional
`from` is inclusive and `to` is exclusive. `maxOccurrences` (default 1,000; maximum 10,000) bounds
returned dates; `maxDays` (default 36,600; maximum 1,000,000) bounds the scan horizon.

## Customization and limits

Use the schema for simple UTC daily/weekly schedules, and apply application-specific overrides or
calendar exceptions separately. The engine does not support monthly/yearly rules, local timezone
recurrence, DST transition policies, durations, overrides, recurrence sets, rule strings, BYSETPOS,
or other RFC 5545 features. Offset timestamps are rejected; resolve named-zone schedules using an
external timezone-data adapter, then pass UTC instants. It does not claim full RFC 5545 compliance.

Intervals are 1–10,000; weekdays must be unique; exclusions are capped at 100,000; options and
rules are validated before expansion. When the explicit `maxOccurrences` limit is reached, the
returned array is capped. This library performs bounded in-memory expansion and does not create
timers or schedule callbacks.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
