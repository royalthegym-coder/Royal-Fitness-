/* ================= Birthdays: who has a birthday this week, with a ready WhatsApp greeting ================= */
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/* days from today until the next birthday (0 = today); 29 Feb is celebrated on 28 Feb in other years */
function daysToBirthday(dob, today) {
  const [by, m, d] = String(dob).slice(0, 10).split('-').map(Number), [ty, tm, td] = today.split('-').map(Number);
  const at = (y) => Date.UTC(y, m - 1, m === 2 && d === 29 && !isLeap(y) ? 28 : d), t0 = Date.UTC(ty, tm - 1, td);
  let y = ty, n = at(y); if (n < t0) { y += 1; n = at(y); }
  return { days: Math.round((n - t0) / 864e5), turning: y - by };
}
function birthdayCard(members) {
  const today = todayISO();
  const list = members.filter((m) => m.dob && memberState(m) !== 'Cancelled').map((m) => ({ m, ...daysToBirthday(m.dob, today) })).filter((x) => x.days <= 7).sort((a, b) => a.days - b.days);
  const msg = (m) => L(`Happy birthday ${m.name}! Wishing you a healthy and strong year ahead. - ${gymName()} family`, `जन्मदिन की हार्दिक शुभकामनाएँ ${m.name} जी! आपका नया साल सेहतमंद और ताक़तवर रहे। - ${gymName()} परिवार`);
  const row = ({ m, days, turning }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(days === 0 ? L('Today', 'आज') : days === 1 ? L('Tomorrow', 'कल') : L(`In ${days} days`, `${days} दिन में`))} · ${esc(L(`turns ${turning}`, `${turning} साल के होंगे`))}</small></div>${m.phone ? `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink(m.phone, msg(m)))}" onclick="event.stopPropagation()">WhatsApp</a>` : ''}</li>`;
  return card(L('Birthdays this week', 'इस हफ़्ते जन्मदिन'), 'gift', '', list.length ? `<ul class="list">${list.map(row).join('')}</ul>` : empty(L('No birthdays this week', 'इस हफ़्ते कोई जन्मदिन नहीं'), L('Add the date of birth in a member\'s profile to see birthdays here.', 'सदस्य की प्रोफ़ाइल में जन्म की तारीख़ भरें, फिर जन्मदिन यहाँ दिखेंगे।')));
}
