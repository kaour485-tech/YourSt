/* ===== إعدادات تعدّلها أنت ===== */
const CONFIG = {
  WHATSAPP: '213696741267',          // رقمك بالصيغة الدولية بدون +
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
function trackLeadConversion(pkg) {
  const detail = { package: pkg, method: 'google_sheets' };
  track('generate_lead', detail);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'lead_submitted', ...detail });
  window.dispatchEvent(new CustomEvent('lead_submitted', { detail }));
  if (window.fbq) fbq('track', 'Lead', { content_name: pkg });
  if (window.ttq && typeof window.ttq.track === 'function') ttq.track('Lead', { content_name: pkg });
}
document.querySelectorAll('[data-pick]').forEach(a => a.addEventListener('click', () => {
  document.getElementById('pkg').value = a.dataset.pick; track('select_package', { package: a.dataset.pick });
}));
const form = document.getElementById('lead'), box = document.getElementById('status'), btn = document.getElementById('send');
const show = (t, c) => { box.className = 'msg ' + c; box.textContent = t; };
const showWhatsAppLink = (url, label) => {
  const a = document.createElement('a');
  a.href = url; a.className = 'btn btn-line'; a.style.marginTop = '10px';
  a.target = '_blank'; a.rel = 'noopener'; a.textContent = label;
  box.appendChild(document.createElement('br')); box.appendChild(a);
};
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
  try {
    const response = await fetch('/.netlify/functions/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: d.name.trim(), phone: d.phone.trim(), country: d.country,
        package: pkgName[d.package], message: d.message || '', source: location.href,
        website: d.website || ''
      })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'لم يؤكد الخادم حفظ الطلب.');
    trackLeadConversion(pkgName[d.package]);
    show('تم تسجيل طلبك بنجاح. سأتواصل معك قريباً. يمكنك مراسلتي الآن:', 'ok');
    showWhatsAppLink(wa, 'تابع على واتساب');
    form.reset();
  } catch (err) {
    show('لم نتمكن من تأكيد حفظ الطلب في الجدول. أرسل بياناتك مباشرة عبر واتساب:', 'err');
    showWhatsAppLink(wa, 'أرسل الطلب عبر واتساب');
  } finally {
    btn.disabled = false;
  }
});
