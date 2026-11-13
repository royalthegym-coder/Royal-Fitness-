import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c32-attendance.js', import.meta.url), 'utf8').split('async function vAttendance')[0];
let fn; try { fn = new Function('document', 'window', 'localStorage', 'U', 'Q', 'cached', lib + '\n' + src + '; return { attendanceSummary, isWeeklyOff, dowOf };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const { attendanceSummary, isWeeklyOff, dowOf } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} }, {}, {}, () => {});
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };
const R = (staff_id, day, status) => ({ staff_id, day, status });
const rows = [R('a', '2026-11-01', 'present'), R('a', '2026-11-02', 'present'), R('a', '2026-11-03', 'half'), R('a', '2026-11-04', 'leave'), R('a', '2026-11-05', 'absent'), R('a', '2026-10-31', 'present'), R('a', '2026-12-01', 'present'), R('b', '2026-11-01', 'present')];
const s = attendanceSummary(rows, 'a', '2026-11');
ok(s.present === 2 && s.half === 1 && s.leave === 1 && s.absent === 1 && s.marked === 5, 'counts only that person and that month (31 Oct and 1 Dec excluded): ' + JSON.stringify(s));
ok(s.worked === 2.5, 'half day counts 0.5: ' + s.worked);
ok(attendanceSummary([], 'a', '2026-11').worked === 0 && attendanceSummary(rows, 'zz', '2026-11').marked === 0, 'nothing marked');
ok(dowOf('2026-11-15') === 0 && dowOf('2026-11-13') === 5, 'day of week: Sunday 15 Nov 2026, Friday 13 Nov');
ok(isWeeklyOff({ weekly_off: 0 }, '2026-11-15') && !isWeeklyOff({ weekly_off: 0 }, '2026-11-16'), 'weekly off Sunday');
ok(!isWeeklyOff({ weekly_off: null }, '2026-11-15') && !isWeeklyOff({}, '2026-11-15'), 'no weekly off set: never a weekly-off day (0 is Sunday, null is none)');
console.log(n + ' checks passed');
