/**
 * Google Apps Script لاستقبال الطلبات من النموذج.
 * اربطه بملف Google Sheets المطلوب، ثم انشره كتطبيق ويب:
 * تنفيذ التطبيق باسمك، ومن لديه صلاحية الوصول: أي شخص.
 * ضع رابط النشر المنتهي بـ /exec في CONFIG.LEAD_ENDPOINT داخل script.js.
 */

const SETTINGS = {
  SHEET_NAME: 'Leads',
  NOTIFY_EMAIL: '', // اختياري: بريد الإشعار، اتركه فارغًا لتعطيل الإشعارات
  HEADERS: ['التاريخ', 'الاسم', 'واتساب', 'الدولة', 'الباقة', 'المنتج', 'الصفحة', 'الحالة']
};

function doGet() {
  return json_({ ok: true, message: 'خدمة استقبال الطلبات تعمل.' });
}

function doPost(e) {
  try {
    const data = readPayload_(e);
    const lead = {
      name: clean_(data.name),
      phone: clean_(data.phone),
      country: clean_(data.country),
      package: clean_(data.package),
      message: clean_(data.message),
      source: clean_(data.source)
    };

    if (!lead.name || !lead.phone || !lead.country) {
      return json_({ ok: false, error: 'الاسم ورقم واتساب والدولة حقول مطلوبة.' });
    }

    const sheet = getLeadsSheet_();
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow([
        new Date(), lead.name, lead.phone, lead.country,
        lead.package, lead.message, lead.source, 'جديد'
      ]);
    } finally {
      lock.releaseLock();
    }

    // فشل البريد لا يلغي حفظ الطلب في الشيت.
    if (SETTINGS.NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail({
          to: SETTINGS.NOTIFY_EMAIL,
          subject: 'طلب جديد: ' + lead.name,
          body: [
            'الاسم: ' + lead.name,
            'واتساب: ' + lead.phone,
            'الدولة: ' + lead.country,
            'الباقة: ' + lead.package,
            'المنتج: ' + lead.message,
            'الصفحة: ' + lead.source
          ].join('\n')
        });
      } catch (mailError) {
        console.error('تعذر إرسال إشعار البريد: ' + mailError);
      }
    }

    return json_({ ok: true, message: 'تم حفظ الطلب.' });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, error: 'تعذر حفظ الطلب. راجع صلاحيات السكريبت وسجل التنفيذ.' });
  }
}

function getLeadsSheet_() {
  // يجب أن يكون السكريبت مرتبطًا بملف الشيت المطلوب.
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('اربط هذا السكريبت بملف Google Sheets ثم أعد نشر تطبيق الويب.');
  }

  let sheet = spreadsheet.getSheetByName(SETTINGS.SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SETTINGS.SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SETTINGS.HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readPayload_(e) {
  if (!e) return {};
  const params = e.parameter || {};
  const raw = e.postData && e.postData.contents;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return Object.assign({}, params, parsed);
    } catch (_) {
      // النموذج الحالي يرسل application/x-www-form-urlencoded، وحقوله في e.parameter.
    }
  }
  return params;
}

function clean_(value) {
  let text = String(value == null ? '' : value).trim().slice(0, 500);
  // منع تفسير مدخلات المستخدم كصيغ في Google Sheets.
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
