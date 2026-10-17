const MAX_ROWS = 40;

export function ProductSpecificationsEditor({ rows = [], onChange }) {
  const specifications = Array.isArray(rows) ? rows : [];

  const updateRow = (index, field, value) => {
    onChange(specifications.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const removeRow = (index) => {
    onChange(specifications.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <section className="spec-editor" aria-labelledby="spec-editor-title">
      <div className="spec-editor-head">
        <div>
          <h3 id="spec-editor-title">جدول مواصفات المنتج</h3>
          <p>اكتب المواصفات التي تريدها؛ الصفوف غير المكتملة لن تُحفظ.</p>
        </div>
        <button
          type="button"
          className="spec-add-button"
          onClick={() => onChange([...specifications, { key: '', value: '' }])}
          disabled={specifications.length >= MAX_ROWS}
        >
          <span aria-hidden="true">+</span> إضافة مواصفة
        </button>
      </div>

      {specifications.length === 0 ? (
        <p className="spec-editor-empty">لا توجد مواصفات مضافة. أضف أول مواصفة لهذا المنتج.</p>
      ) : (
        <div className="spec-editor-rows">
          {specifications.map((row, index) => (
            <div className="spec-editor-row" key={`spec-${index}`}>
              <label>
                المواصفة
                <input
                  type="text"
                  maxLength={80}
                  value={row.key || ''}
                  onChange={(event) => updateRow(index, 'key', event.target.value)}
                  placeholder="مثال: وظيفة إضافية"
                  aria-label={`اسم المواصفة رقم ${index + 1}`}
                />
              </label>
              <label>
                القيمة
                <input
                  type="text"
                  maxLength={400}
                  value={row.value || ''}
                  onChange={(event) => updateRow(index, 'value', event.target.value)}
                  placeholder="مثال: Power Bank"
                  aria-label={`قيمة المواصفة رقم ${index + 1}`}
                />
              </label>
              <button
                type="button"
                className="spec-remove-button"
                onClick={() => removeRow(index)}
                aria-label={`حذف المواصفة رقم ${index + 1}`}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
      <small className="spec-editor-limit">حتى {MAX_ROWS} مواصفة لكل منتج.</small>
    </section>
  );
}

export function ProductSpecificationsTable({ specifications = [] }) {
  const rows = (Array.isArray(specifications) ? specifications : []).filter((row) => (
    String(row?.key || '').trim() && String(row?.value || '').trim()
  ));

  if (rows.length === 0) return null;

  return (
    <section className="product-specifications" aria-labelledby="product-specifications-title">
      <h2 id="product-specifications-title">المواصفات</h2>
      <div className="spec-table-wrap">
        <table className="spec-table">
          <thead>
            <tr>
              <th scope="col">المواصفة</th>
              <th scope="col">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.key}-${index}`}>
                <th scope="row">{row.key}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
