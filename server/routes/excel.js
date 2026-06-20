const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const { query, execute, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

const upload = multer({ dest: path.join(__dirname, '..', 'data', 'uploads') });

// GET /api/excel/template — download empty template
router.get('/template', (req, res) => {
  const headers = [
    ['바코드', '제품명', '카테고리', '공급업체', '수량', '단위', '진열장', '유통기한', '비고'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(headers);
  ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '제품 목록');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// GET /api/excel/export — download all products as Excel
router.get('/export', (req, res) => {
  try {
    const products = query(`
      SELECT p.barcode, p.name, c.name as category, s.name as supplier,
             p.quantity, p.unit, p.shelf_location, p.expiry_date, p.notes,
             p.manufactured_date, p.batch_number, p.cost_price, p.selling_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = 1
      ORDER BY p.expiry_date ASC
    `);

    const ws = XLSX.utils.json_to_sheet(products);
    ws['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
      { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
      { wch: 30 }, { wch: 14 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '제품 목록');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '엑셀 내보내기 실패' });
  }
});

// POST /api/excel/import — upload and import Excel
router.post('/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '파일을 업로드하세요.' });

    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const results = { imported: 0, updated: 0, errors: [] };

    rows.forEach((row, idx) => {
      try {
        const barcode = String(row['바코드'] || row['barcode'] || '').trim();
        const name = String(row['제품명'] || row['name'] || '').trim();
        const categoryName = String(row['카테고리'] || row['category'] || '').trim();
        const supplierName = String(row['공급업체'] || row['supplier'] || '').trim();
        const quantity = parseInt(row['수량'] || row['quantity'] || 1, 10);
        const unit = String(row['단위'] || row['unit'] || '개').trim();
        const shelf = String(row['진열장'] || row['shelf_location'] || '').trim();
        const expiryDate = String(row['유통기한'] || row['expiry_date'] || '').trim();
        const notes = String(row['비고'] || row['notes'] || '').trim();

        if (!name || !expiryDate) {
          results.errors.push({ row: idx + 2, error: '제품명 또는 유통기한 누락' });
          return;
        }

        // Resolve or create category
        let categoryId = null;
        if (categoryName) {
          let cat = queryOne('SELECT id FROM categories WHERE name = ?', [categoryName]);
          if (!cat) {
            const r = execute('INSERT INTO categories (name) VALUES (?)', [categoryName]);
            cat = { id: r.lastInsertRowid };
          }
          categoryId = cat.id;
        }

        // Resolve or create supplier
        let supplierId = null;
        if (supplierName) {
          let sup = queryOne('SELECT id FROM suppliers WHERE name = ?', [supplierName]);
          if (!sup) {
            const r = execute('INSERT INTO suppliers (name) VALUES (?)', [supplierName]);
            sup = { id: r.lastInsertRowid };
          }
          supplierId = sup.id;
        }

        // Upsert on barcode
        if (barcode) {
          const existing = queryOne('SELECT id FROM products WHERE barcode = ?', [barcode]);
          if (existing) {
            execute(
              `UPDATE products SET name=?, category_id=?, supplier_id=?, quantity=?, unit=?, shelf_location=?, expiry_date=?, notes=?,
               updated_at=datetime('now','localtime') WHERE id=?`,
              [name, categoryId, supplierId, quantity, unit, shelf, expiryDate, notes, existing.id]
            );
            results.updated++;
            return;
          }
        }

        execute(
          `INSERT INTO products (barcode, name, category_id, supplier_id, quantity, unit, shelf_location, expiry_date, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [barcode || null, name, categoryId, supplierId, quantity, unit, shelf, expiryDate, notes, req.session.userId]
        );
        results.imported++;
      } catch (err) {
        results.errors.push({ row: idx + 2, error: err.message });
      }
    });

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    // Log activity
    execute(
      'INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)',
      [req.session.userId, 'import_excel', JSON.stringify({ imported: results.imported, updated: results.updated, errors: results.errors.length })]
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '엑셀 가져오기 실패' });
  }
});

module.exports = router;
