// Coach voice input: the speech language, the dictated text added to the box (capped like the box), and the messages.
import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c36-coach.js', import.meta.url), 'utf8').split('async function coachFn')[0];
let fn;
try { fn = new Function('document', 'window', 'localStorage', 'U', lib + '\n' + src + '; return { voiceLang, voiceAppend, voiceErrText, voiceSupported };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const docStub = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, documentElement: { dataset: {} } };
const { voiceLang, voiceAppend, voiceErrText, voiceSupported } = fn(docStub, {}, { getItem() { return null; }, setItem() {} }, {});

let n = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };

// language: Indian English and Hindi
ok(voiceLang('hi') === 'hi-IN' && voiceLang('en') === 'en-IN' && voiceLang(undefined) === 'en-IN', 'speech language follows the app language, Indian variants');

// appending: trims, collapses spaces, joins with one space, never sends
ok(voiceAppend('', 'how much  protein ') === 'how much protein', 'an empty box takes the phrase, trimmed');
ok(voiceAppend('What to eat?  ', '  before gym ') === 'What to eat? before gym', 'an existing question gets the phrase after one space');
ok(voiceAppend('keep this', '') === 'keep this', 'nothing heard leaves the box as it was');
ok(voiceAppend(null, null) === '' && voiceAppend(undefined, 'hi') === 'hi', 'missing values are safe');
ok(voiceAppend('x'.repeat(498), 'abcdef').length === 500, 'the result is capped at 500 characters, like the box');
ok(voiceAppend('a', 'b', 3) === 'a b' && voiceAppend('abc', 'd', 3) === 'abc', 'a custom cap is respected');
ok(voiceAppend('नमस्ते', 'प्रोटीन') === 'नमस्ते प्रोटीन', 'Hindi text is kept intact');

// messages: every code has a message, and an unknown one is generic
['not-allowed', 'service-not-allowed', 'no-speech', 'network'].forEach((c) => ok(voiceErrText(c).length > 10, 'message for ' + c));
ok(voiceErrText('weird') === voiceErrText(''), 'unknown codes get the generic message');
ok(/permission|अनुमति/.test(voiceErrText('not-allowed')), 'a refused microphone is explained');

// support: no browser speech API means no microphone button
ok(voiceSupported() === false, 'a browser with no speech API is reported as unsupported');

console.log(`coachvoice: ${n} checks passed`);
