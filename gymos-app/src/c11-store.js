/* ================= Store / POS: products, stock, sales (owner + trainers sell, owner manages) ================= */
const PROD_CATS = ['Supplements', 'Drinks', 'Snacks', 'Apparel', 'Accessories', 'Other'];
const PROD_CAT_HI = { Supplements: 'सप्लीमेंट', Drinks: 'ड्रिंक', Snacks: 'स्नैक्स', Apparel: 'कपड़े', Accessories: 'एक्सेसरी', Other: 'अन्य' };
const prodCatLabel = (c) => (LANG === 'hi' ? PROD_CAT_HI[c] || c : c);
const PAY_METHODS = ['UPI', 'Cash', 'Card', 'Bank'];

Q.products = () => cached('products', () => DB.select('products', { order: 'name.asc', limit: 1000 }));
Q.sales = () => cached('sales', () => DB.select('sales', { order: 'created_at.desc', limit: 2000 }));

/* gross profit of the sales in a list: what was charged minus what the goods cost, voided sales left out */
const saleMargin = (list) => sum(list.filter((s) => !s.voided_at), (s) => Number(s.total) - s.qty * Number(s.unit_cost || 0));
const saleTotal = (list) => sum(list.filter((s) => !s.voided_at), (s) => s.total);

async function vStore() {
  const [prods, sales, members] = await Promise.all([Q.products(), Q.sales(), Q.members()]);
  const mm = memberMap(members), t = todayISO(), mk = monthKey(t), admin = isAdmin();
  const today = sales.filter((s) => s.sold_on === t), month = sales.filter((s) => monthKey(s.sold_on) === mk);
  const low = prods.filter((p) => p.active && p.stock <= p.low_at);
  const stockValue = sum(prods, (p) => p.stock * Number(p.cost || 0));
  const card1 = (p) => `<div class="card pc${p.active ? '' : ' off'}"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(p.name)}</b>${p.stock === 0 ? badge(L('Out of stock', 'स्टॉक ख़त्म'), 'bad') : p.stock <= p.low_at ? badge(L('Low', 'कम'), 'warn') : ''}</div>`
    + `<div class="pr">${inr(p.price)}</div><div style="color:var(--muted);font-size:13px">${esc(prodCatLabel(p.category))} · ${esc(L(`${p.stock} in stock`, `${p.stock} स्टॉक में`))}${admin && Number(p.cost) > 0 ? ' · ' + esc(L('cost', 'लागत')) + ' ' + inr(p.cost) : ''}${p.active ? '' : ' · ' + esc(L('off', 'बंद'))}</div>`
    + `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn pri sm" data-act="sellProduct" data-id="${esc(p.id)}"${p.active && p.stock > 0 ? '' : ' disabled'}>${esc(L('Sell', 'बेचें'))}</button>${admin ? `<button class="btn sm" data-act="editProduct" data-id="${esc(p.id)}">${esc(L('Edit', 'बदलें'))}</button>` : ''}</div></div>`;
  const recent = sales.slice(0, 40);
  const tbl = recent.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Date', 'तारीख़'))}</th><th>${esc(L('Item', 'सामान'))}</th><th>${esc(L('Buyer', 'ग्राहक'))}</th><th>${esc(L('Paid by', 'तरीक़ा'))}</th><th class="r">${esc(L('Total', 'कुल'))}</th><th></th></tr></thead><tbody>${recent.map((s) => `<tr${s.voided_at ? ' style="opacity:.55;text-decoration:line-through"' : ''}><td>${esc(fmtDate(s.sold_on))}</td><td><b>${esc(s.product_name)}</b> × ${s.qty}</td><td>${s.member_id && mm.get(s.member_id) ? esc(mm.get(s.member_id).name) : '—'}</td><td>${esc(s.method)}</td><td class="r">${inr(s.total)}</td><td class="r">${admin && !s.voided_at ? `<button class="btn sm" data-act="voidSale" data-id="${esc(s.id)}">${esc(L('Cancel sale', 'बिक्री रद्द'))}</button>` : s.voided_at ? badge(L('Cancelled', 'रद्द'), 'mute') : ''}</td></tr>`).join('')}</tbody></table></div>`
    : empty(L('No sales yet', 'अभी कोई बिक्री नहीं'), L('Sell a product and it appears here. Stock goes down by itself.', 'कुछ बेचें तो यहाँ दिखेगा। स्टॉक अपने-आप घटेगा।'));
  return pageHead(L('Store', 'स्टोर'), L('Store & stock', 'स्टोर और स्टॉक'), L('Sell supplements and drinks at the counter. Stock goes down with every sale.', 'काउंटर पर सप्लीमेंट और ड्रिंक बेचें। हर बिक्री पर स्टॉक घटता है।'), admin ? `<button class="btn pri" data-act="newProduct">${ic('plus')}${esc(L('Add product', 'प्रोडक्ट जोड़ें'))}</button>` : '')
    + `<div class="tiles">${tile(L('Sold today', 'आज की बिक्री'), inr(saleTotal(today)), L(`${today.filter((s) => !s.voided_at).length} sales`, `${today.filter((s) => !s.voided_at).length} बिक्री`), 'var(--ok)')}${tile(L('This month', 'यह महीना'), inr(saleTotal(month)), admin ? L('Profit ', 'मुनाफ़ा ') + inr(saleMargin(month)) : '')}${tile(L('Low stock', 'कम स्टॉक'), low.length, low.length ? esc(low.slice(0, 3).map((p) => p.name).join(', ')) : '', low.length ? 'var(--crimson)' : '')}${admin ? tile(L('Stock value', 'स्टॉक की क़ीमत'), inr(stockValue), L('at cost price', 'लागत पर')) : ''}</div>`
    + (prods.length ? `<div class="cg" style="margin-bottom:14px">${prods.map(card1).join('')}</div>` : `<div class="card" style="margin-bottom:14px">${empty(L('No products yet', 'अभी कोई प्रोडक्ट नहीं'), admin ? L('Add what you sell: protein, shakers, water, T-shirts.', 'जो बेचते हैं वह जोड़ें: प्रोटीन, शेकर, पानी, टी-शर्ट।') : L('Ask the owner to add products.', 'मालिक से प्रोडक्ट जुड़वाएँ।'), admin ? `<button class="btn pri" data-act="newProduct">${esc(L('Add product', 'प्रोडक्ट जोड़ें'))}</button>` : '')}</div>`)
    + card(L('Recent sales', 'हाल की बिक्री'), 'receipt', '', tbl);
}

function productForm(id) {
  Q.products().then((prods) => {
    const x = id ? prods.find((p) => p.id === id) : null;
    openForm({
      title: x ? x.name : L('Add product', 'प्रोडक्ट जोड़ें'), values: x || {},
      fields: [
        { k: 'name', label: L('Name', 'नाम'), req: true, full: true, ph: 'Whey Protein 1kg', check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
        { k: 'category', label: L('Category', 'श्रेणी'), type: 'select', options: PROD_CATS.map((c) => ({ v: c, l: prodCatLabel(c) })), def: x ? x.category : 'Supplements' },
        { k: 'price', label: L('Selling price (₹)', 'बिक्री भाव (₹)'), type: 'number', req: true, min: 1 },
        { k: 'cost', label: L('Your cost (₹)', 'आपकी लागत (₹)'), type: 'number', min: 0, def: x ? x.cost : 0, check: (v, o) => (v !== '' && o.price !== '' && Number(v) > Number(o.price) ? L('Cost is higher than the price (you will lose money)', 'लागत भाव से ज़्यादा है (नुक़सान होगा)') : '') },
        { k: 'stock', label: L('Stock now', 'अभी स्टॉक'), type: 'number', min: 0, def: x ? x.stock : 0, check: (v) => (v !== '' && !Number.isInteger(Number(v)) ? L('Whole number', 'पूरी संख्या') : '') },
        { k: 'low_at', label: L('Warn when stock is at or below', 'इतने या कम स्टॉक पर चेतावनी'), type: 'number', min: 0, def: x ? x.low_at : 3 },
        { k: 'active', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: '1', l: L('On sale', 'बिक्री चालू') }, { v: '0', l: L('Off', 'बंद') }], def: x ? (x.active ? '1' : '0') : '1' },
      ],
      extra: x ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delProduct" data-id="${esc(x.id)}">${esc(L('Delete product', 'प्रोडक्ट हटाएँ'))}</button></p>` : '',
      onSubmit: async (v) => {
        const dup = prods.find((p) => p.name.trim().toLowerCase() === v.name.trim().toLowerCase() && (!x || p.id !== x.id));
        if (dup) { toast(L('A product with this name already exists.', 'इस नाम का प्रोडक्ट पहले से है।'), 'bad'); return false; }
        const row = { name: v.name.trim(), category: v.category, price: v.price, cost: v.cost === '' ? 0 : v.cost, stock: v.stock === '' ? 0 : Math.round(Number(v.stock)), low_at: v.low_at === '' ? 3 : Math.round(Number(v.low_at)), active: v.active === '1' };
        const ok = await act(() => (x ? DB.update('products', x.id, row) : DB.insert('products', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
        if (ok) { bust('products'); render(); } return !!ok;
      },
    });
  });
}

async function sellForm(id) {
  const [prods, members] = await Promise.all([Q.products(), Q.members()]);
  const p = prods.find((x) => x.id === id); if (!p) return;
  const people = members.filter((m) => m.status !== 'Cancelled');
  openForm({
    title: L(`Sell: ${p.name}`, `बेचें: ${p.name}`), submitLabel: L('Record sale', 'बिक्री दर्ज करें'),
    fields: [
      { k: 'qty', label: `${L('Quantity', 'मात्रा')} (${L('max', 'अधिकतम')} ${p.stock})`, type: 'number', req: true, min: 1, def: 1, check: (v) => (!Number.isInteger(Number(v)) ? L('Whole number', 'पूरी संख्या') : Number(v) > p.stock ? L(`Only ${p.stock} in stock`, `सिर्फ़ ${p.stock} स्टॉक में हैं`) : '') },
      { k: 'method', label: L('Paid by', 'भुगतान का तरीक़ा'), type: 'select', options: PAY_METHODS.map((m) => ({ v: m, l: m })), def: 'UPI' },
      { k: 'member', label: L('Member (optional)', 'सदस्य (वैकल्पिक)'), type: 'select', full: true, options: [{ v: '', l: L('Walk-in customer', 'बाहर का ग्राहक') }, ...people.map((m) => ({ v: m.id, l: `${m.name}${m.phone ? ' · ' + m.phone : ''}` }))] },
    ],
    extra: `<p style="margin:12px 0 0;color:var(--muted)">${esc(L('Price', 'भाव'))}: <b>${inr(p.price)}</b> ${esc(L('each', 'प्रति'))}</p>`,
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('record_sale', { p_product: p.id, p_qty: Math.round(Number(v.qty)), p_method: v.method, p_member: v.member || null }), L(`Sold ${v.qty} × ${p.name} · ${inr(p.price * v.qty)}`, `${v.qty} × ${p.name} बिका · ${inr(p.price * v.qty)}`));
      bust('products', 'sales'); if (ok) render(); return !!ok;
    },
  });
}
async function voidSale(id) {
  const s = (await Q.sales()).find((x) => x.id === id); if (!s) return;
  if (!(await askConfirm(L(`Cancel the sale of ${s.qty} × ${s.product_name} (${inr(s.total)})? The stock is added back.`, `${s.qty} × ${s.product_name} (${inr(s.total)}) की बिक्री रद्द करें? स्टॉक वापस जुड़ जाएगा।`), L('Cancel sale', 'बिक्री रद्द'), 'bad'))) return;
  const ok = await act(() => DB.rpc('void_sale', { p_sale: id }), L('Sale cancelled, stock added back', 'बिक्री रद्द, स्टॉक वापस जुड़ा'));
  bust('products', 'sales'); if (ok) render();
}
async function deleteProduct(id) {
  const p = (await Q.products()).find((x) => x.id === id); if (!p) return;
  if (!(await askConfirm(L(`Delete "${p.name}"? Past sales stay in the history.`, `"${p.name}" हटाएँ? पुरानी बिक्री इतिहास में रहेगी।`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('products', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('products', 'sales'); render(); }
}
