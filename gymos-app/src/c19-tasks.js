/* ================= Staff tasks: a shared to-do list for the gym (owner and trainers) ================= */
Q.tasks = () => cached('gym_tasks', () => DB.select('gym_tasks', { order: 'created_at.desc', limit: 500 }));
U.tk = { f: 'open' };
const PRIO = { High: ['bad', 'ऊँची', 0], Medium: ['warn', 'मध्यम', 1], Low: ['mute', 'कम', 2] };
const prioLabel = (p) => (LANG === 'hi' ? PRIO[p][1] : p);
async function staffNames() {
  try { return new Map((await Q.profiles()).filter((p) => p.gym_id === gymId() && (p.role === 'trainer' || p.role === 'gym_admin')).map((p) => [p.id, p.full_name || p.email || ''])); } catch (e) { return new Map(); }
}

async function vTasks() {
  const [tasks, names] = await Promise.all([Q.tasks(), staffNames()]), me = CTX.profile ? CTX.profile.id : '', today = todayISO();
  const open = tasks.filter((t) => !t.done_at), mine = open.filter((t) => t.assigned_to === me);
  const list = (U.tk.f === 'done' ? tasks.filter((t) => t.done_at) : U.tk.f === 'mine' ? mine : open)
    .slice().sort((a, b) => (a.done_at ? 1 : 0) - (b.done_at ? 1 : 0) || (a.due_on || '9999').localeCompare(b.due_on || '9999') || PRIO[a.priority][2] - PRIO[b.priority][2]);
  const overdue = open.filter((t) => t.due_on && t.due_on < today).length;
  const row = (t) => {
    const late = !t.done_at && t.due_on && t.due_on < today, who = t.assigned_to ? (t.assigned_to === me ? L('You', 'आप') : names.get(t.assigned_to) || '') : '';
    return `<li${t.done_at ? ' style="opacity:.6"' : ''}><button class="btn sm${t.done_at ? '' : ' pri'}" data-act="toggleTask" data-id="${esc(t.id)}" aria-label="${esc(t.done_at ? L('Reopen', 'दोबारा खोलें') : L('Mark done', 'पूरा करें'))}">${t.done_at ? '↺' : '✓'}</button><div class="grow"><b${t.done_at ? ' style="text-decoration:line-through"' : ''}>${esc(t.title)}</b><small>${esc([t.note, who && (L('For ', 'किसके लिए: ') + who), t.due_on && (late ? L('Overdue · ', 'देर · ') : t.due_on === today ? L('Today · ', 'आज · ') : '') + fmtDate(t.due_on)].filter(Boolean).join(' · '))}</small></div>${badge(prioLabel(t.priority), PRIO[t.priority][0])}<button class="btn sm" data-act="editTask" data-id="${esc(t.id)}">${esc(L('Edit', 'बदलें'))}</button></li>`;
  };
  return pageHead(L('Business', 'व्यापार'), L('Tasks', 'काम'), L(`${open.length} open${overdue ? ` · ${overdue} overdue` : ''}`, `${open.length} बाक़ी${overdue ? ` · ${overdue} देर से` : ''}`), `<button class="btn pri" data-act="newTask">${ic('plus')}${esc(L('Add task', 'काम जोड़ें'))}</button>`)
    + chipsHtml('tkF', U.tk.f, [['open', L('Open', 'बाक़ी'), open.length], ['mine', L('Mine', 'मेरे'), mine.length], ['done', L('Done', 'पूरे'), tasks.length - open.length]])
    + `<div class="card" style="padding:4px 18px 16px">${list.length ? `<ul class="list">${list.map(row).join('')}</ul>` : empty(U.tk.f === 'done' ? L('Nothing finished yet', 'अभी कोई काम पूरा नहीं') : L('No open tasks', 'कोई काम बाक़ी नहीं'), L('Add things like "restock whey", "fix treadmill 2" or "call dues members".', 'जैसे "व्हे स्टॉक करना", "ट्रेडमिल 2 ठीक कराना" या "बाक़ी वालों को फ़ोन"।'), `<button class="btn pri" data-act="newTask">${esc(L('Add task', 'काम जोड़ें'))}</button>`)}</div>`;
}

async function taskForm(id) {
  const [tasks, names] = await Promise.all([Q.tasks(), staffNames()]), x = id ? tasks.find((t) => t.id === id) : null, me = CTX.profile ? CTX.profile.id : '';
  if (me && !names.has(me)) names.set(me, L('Me', 'मैं'));
  openForm({
    title: x ? L('Edit task', 'काम बदलें') : L('Add task', 'काम जोड़ें'), submitLabel: L('Save', 'सेव करें'), values: x ? { ...x, assigned_to: x.assigned_to || '' } : {},
    fields: [
      { k: 'title', label: L('Task', 'काम'), req: true, full: true, check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
      { k: 'priority', label: L('Priority', 'महत्व'), type: 'select', options: ['High', 'Medium', 'Low'].map((p) => ({ v: p, l: prioLabel(p) })), def: x ? x.priority : 'Medium' },
      { k: 'due_on', label: L('Due date', 'आख़िरी तारीख़'), type: 'date' },
      { k: 'assigned_to', label: L('Assigned to', 'किसे'), type: 'select', full: true, options: [{ v: '', l: L('Anyone', 'कोई भी') }, ...[...names].map(([v, l]) => ({ v, l }))], def: x ? x.assigned_to || '' : '' },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 500 ? L('Up to 500 characters', 'अधिकतम 500 अक्षर') : '') },
    ],
    extra: x && isAdmin() ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delTask" data-id="${esc(x.id)}">${esc(L('Delete task', 'काम हटाएँ'))}</button></p>` : '',
    onSubmit: async (v) => {
      const row = { title: v.title.trim(), priority: v.priority, due_on: v.due_on || null, assigned_to: v.assigned_to || null, note: v.note ? v.note.trim() : null };
      const ok = await act(() => (x ? DB.update('gym_tasks', x.id, row) : DB.insert('gym_tasks', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (ok) { bust('gym_tasks'); render(); } return !!ok;
    },
  });
}
async function toggleTask(id) {
  const t = (await Q.tasks()).find((x) => x.id === id); if (!t) return;
  const ok = await act(() => DB.update('gym_tasks', id, { done_at: t.done_at ? null : new Date().toISOString() }), t.done_at ? L('Reopened', 'दोबारा खोला') : L('Done', 'पूरा हुआ'));
  if (ok) { bust('gym_tasks'); render(); }
}
async function deleteTask(id) {
  const t = (await Q.tasks()).find((x) => x.id === id); if (!t) return;
  if (!(await askConfirm(L(`Delete "${t.title}"?`, `"${t.title}" हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('gym_tasks', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('gym_tasks'); render(); }
}
