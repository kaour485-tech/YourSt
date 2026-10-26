const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxFhuiv6hEpdFTLpXHy6AXRuhnccJu4HpR7JhP95FBdoMX3938UBasCaquXT9DPAOQ5/exec';

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export default async request => {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'طريقة الطلب غير مدعومة.' });

  let input;
  try {
    input = await request.json();
  } catch (_) {
    return json(400, { ok: false, error: 'تعذر قراءة بيانات الطلب.' });
  }

  if (input.website) return json(400, { ok: false, error: 'تعذر قبول الطلب.' });

  const clean = value => String(value == null ? '' : value).trim().slice(0, 500);
  const lead = {
    name: clean(input.name),
    phone: clean(input.phone),
    country: clean(input.country),
    package: clean(input.package),
    message: clean(input.message),
    source: clean(input.source)
  };

  if (!lead.name || !lead.phone || !lead.country || !/^\+?[\d\s()-]{8,25}$/.test(lead.phone)) {
    return json(400, { ok: false, error: 'تحقق من الاسم ورقم واتساب والدولة.' });
  }

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(20000)
    });
    const text = await upstream.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (_) {
      throw new Error('استجابة Apps Script ليست JSON. تحقق من نشر السكريبت وصلاحياته.');
    }
    if (!upstream.ok || !result.ok) {
      throw new Error(result.error || 'رفض Apps Script حفظ الطلب.');
    }
    return json(200, { ok: true });
  } catch (error) {
    console.error('Lead forwarding failed:', error);
    return json(502, { ok: false, error: 'تعذر حفظ الطلب في Google Sheets.' });
  }
};
