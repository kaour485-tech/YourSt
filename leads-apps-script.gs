// يُوضع في Google Sheets: الإضافات ← Apps Script
// ثم: نشر ← نشر كتطبيق ويب ← التنفيذ باسمي ← الوصول: أي شخص
// انسخ رابط تطبيق الويب إلى CONFIG.LEAD_ENDPOINT في script.js

const SHEET_NAME = 'Leads';
const NOTIFY_EMAIL = ''; // اختياري: بريدك لتصلك رسالة عند كل طلب

function doPost(e) {
  const p = e.parameter || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['التاريخ', 'الاسم', 'واتساب', 'الدولة', 'الباقة', 'المنتج', 'الصفحة', 'الحالة']);
  }
  const clean = v => String(v || '').slice(0, 500).replace(/^[=+\-@]/, "'$&"); // منع حقن الصيغ
  sh.appendRow([new Date(), clean(p.name), clean(p.phone), clean(p.country), clean(p.package), clean(p.message), clean(p.source), 'جديد']);
  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, 'طلب جديد: ' + clean(p.name), clean(p.country) + ' | ' + clean(p.phone) + ' | ' + clean(p.package));
  }
  return ContentService.createTextOutput('ok');
}

