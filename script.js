/* ===== إعدادات تعدّلها أنت ===== */
const CONFIG = {
  WHATSAPP: '213696741267',          // رقمك بالصيغة الدولية بدون +
  LEAD_ENDPOINT: 'https://script.google.com/macros/s/AKfycbxFhuiv6hEpdFTLpXHy6AXRuhnccJu4HpR7JhP95FBdoMX3938UBasCaquXT9DPAOQ5/exec',                 // الصق هنا رابط تطبيق Apps Script المنتهي بـ /exec
  GA_ID: '',                         // معرّف Google Analytics 4 مثل G-XXXXXXX (اختياري)
  PRICES: { basic: 49, full: 149 }  // أسعار الباقات بالدولار
};
/* ================================= */
document.getElementById('y').textContent = new Date().getFullYear();
document.querySelectorAll('[data-price]').forEach(e => e.textContent = CONFIG.PRICES[e.dataset.price]);
if (CONFIG.GA_ID) {
  const s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_ID; document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date()); gtag('config', CONFIG.GA_ID);
}
const track = (n, p) => { if (window.gtag) gtag('event', n, p || {}); };
document.querySelectorAll('[data-pick]').forEach(a => a.addEventListener('click', () => {
  document.getElementById('pkg').value = a.dataset.pick; track('select_package', { package: a.dataset.pick });
}));
const form = document.getElementById('lead'), box = document.getElementById('status'), btn = document.getElementById('send');
const show = (t, c) => { box.className = 'msg ' + c; box.textContent = t; };
const pkgName = { basic: 'الأساسية', full: 'الكاملة', ask: 'لست متأكداً' };
form.addEventListener('submit', async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  if (d.website) return;
  if (!d.name.trim() || !/^\+?\d[\d\s-]{7,}$/.test(d.phone.trim()) || !d.country) {
    show('أكمل الاسم ورقم واتساب صحيحاً مع رمز الدولة، واختر الدولة.', 'err'); return;
  }
  const wa = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(
    'أريد نسخة من النظام\nالاسم: ' + d.name + '\nالدولة: ' + d.country + '\nالباقة: ' + pkgName[d.package] + (d.message ? '\nالمنتج: ' + d.message : ''));
  btn.disabled = true;
  if (!CONFIG.LEAD_ENDPOINT) { track('generate_lead', { method: 'whatsapp' }); location.href = wa; return; }
  try {
    const body = new URLSearchParams({ name: d.name, phone: d.phone, country: d.country, package: pkgName[d.package], message: d.message || '', source: location.href });
    await fetch(CONFIG.LEAD_ENDPOINT, { method: 'POST', mode: 'no-cors', body });
    track('generate_lead', { method: 'sheet' });
    show('وصل طلبك. سأتواصل معك قريباً. يمكنك أيضاً مراسلتي الآن:', 'ok');
    const a = document.createElement('a'); a.href = wa; a.className = 'btn btn-line'; a.style.marginTop = '10px'; a.textContent = 'تابع على واتساب';
    box.appendChild(document.createElement('br')); box.appendChild(a); form.reset();
  } catch (err) {
    show('تعذّر إرسال الطلب. راسلني مباشرة على واتساب.', 'err');
    const a = document.createElement('a'); a.href = wa; a.className = 'btn btn-line'; a.textContent = 'افتح واتساب'; box.appendChild(a);
  }
  btn.disabled = false;
});
