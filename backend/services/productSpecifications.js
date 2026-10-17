export const MAX_PRODUCT_SPECIFICATIONS = 40;
const MAX_KEY_LENGTH = 80;
const MAX_VALUE_LENGTH = 400;

export function parseProductSpecifications(raw) {
  if (raw === undefined) return { valid: true, omitted: true };

  let rows = raw;
  if (typeof rows === 'string') {
    try {
      rows = JSON.parse(rows);
    } catch {
      return { valid: false, message: 'صيغة جدول المواصفات غير صحيحة.' };
    }
  }

  if (!Array.isArray(rows)) {
    return { valid: false, message: 'يجب أن تكون المواصفات قائمة من البنود.' };
  }
  if (rows.length > MAX_PRODUCT_SPECIFICATIONS) {
    return { valid: false, message: `الحد الأقصى ${MAX_PRODUCT_SPECIFICATIONS} مواصفة لكل منتج.` };
  }

  const specifications = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { valid: false, message: 'أحد صفوف المواصفات غير صالح.' };
    }
    const key = String(row.key ?? '').trim();
    const value = String(row.value ?? '').trim();
    if (key.length > MAX_KEY_LENGTH || value.length > MAX_VALUE_LENGTH) {
      return { valid: false, message: 'أحد حقول المواصفات أطول من الحد المسموح.' };
    }
    if (key && value) specifications.push({ key, value });
  }

  return { valid: true, omitted: false, value: specifications };
}
