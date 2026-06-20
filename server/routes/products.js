const { Router } = require('express');
const { query, queryOne, execute } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

// GET /api/products — list all active products
router.get('/', (req, res) => {
  try {
    const { search, category_id, expiry_status, sort } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
      sql += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    sql += ` ORDER BY p.expiry_date ASC`;

    const products = query(sql, params);

    // Attach expiry status
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const enriched = products.map(p => ({
      ...p,
      expiry_status: getExpiryStatus(p.expiry_date),
    }));

    if (expiry_status) {
      const filtered = enriched.filter(p => p.expiry_status.level === expiry_status);
      return res.json(filtered);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '제품 조회 실패' });
  }
});

// GET /api/products/expiring — products grouped by expiry timeframe
router.get('/expiring', (req, res) => {
  try {
    const { group, limit = 50, offset = 0 } = req.query;
    const limitNum = parseInt(limit, 10) || 50;
    const offsetNum = parseInt(offset, 10) || 0;

    const allProducts = query(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = 1
      ORDER BY p.expiry_date ASC
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getEndOfWeek = (d) => {
      const eow = new Date(d);
      eow.setDate(eow.getDate() + (7 - eow.getDay()));
      eow.setHours(23, 59, 59, 999);
      return eow;
    };

    const endOfThisWeek = getEndOfWeek(today);
    const endOfNextWeek = getEndOfWeek(new Date(today));
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    // Filter by group
    let filtered = allProducts.filter(p => {
      const expiry = new Date(p.expiry_date);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      switch (group) {
        case 'expired': return diffDays < 0;
        case 'today': return diffDays === 0;
        case 'tomorrow': return diffDays === 1;
        case 'this_week': return diffDays >= 2 && expiry <= endOfThisWeek;
        case 'next_week': return expiry > endOfThisWeek && expiry <= endOfNextWeek;
        default: return true;
      }
    });

    const total = filtered.length;
    const page = filtered.slice(offsetNum, offsetNum + limitNum);

    const enriched = page.map(p => {
      const expiry = new Date(p.expiry_date);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      const status = getExpiryStatus(p.expiry_date);
      return { ...p, days_left: diffDays, level: status.level, expiry_status: status };
    });

    res.json({ products: enriched, total, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '제품 조회 실패' });
  }
});

// GET /api/products/barcode/:code — lookup by barcode
router.get('/barcode/:code', (req, res) => {
  try {
    const product = queryOne(
      `SELECT p.*, c.name as category_name, s.name as supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.barcode = ? AND p.is_active = 1`,
      [req.params.code]
    );
    if (!product) return res.status(404).json({ error: '제품을 찾을 수 없습니다.' });
    product.expiry_status = getExpiryStatus(product.expiry_date);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '제품 조회 실패' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = queryOne(
      `SELECT p.*, c.name as category_name, s.name as supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );
    if (!product) return res.status(404).json({ error: '제품을 찾을 수 없습니다.' });
    product.expiry_status = getExpiryStatus(product.expiry_date);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '제품 조회 실패' });
  }
});

// POST /api/products
router.post('/', (req, res) => {
  try {
    const { barcode, name, category_id, supplier_id, quantity, unit, shelf_location, expiry_date } = req.body;
    if (!name || !expiry_date) {
      return res.status(400).json({ error: '제품명과 유통기한은 필수 항목입니다.' });
    }

    const result = execute(
      `INSERT INTO products (barcode, name, category_id, supplier_id, quantity, unit, shelf_location, expiry_date, manufactured_date, batch_number, cost_price, selling_price, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [barcode || null, name, category_id || null, supplier_id || null, quantity || 1, unit || '개', shelf_location || null, expiry_date, req.body.manufactured_date || null, req.body.batch_number || null, req.body.cost_price || null, req.body.selling_price || null, req.body.notes || null, req.session.userId]
    );

    const product = queryOne('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: '이미 등록된 바코드입니다.' });
    }
    res.status(500).json({ error: '제품 추가 실패' });
  }
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: '제품을 찾을 수 없습니다.' });

    const { barcode, name, category_id, supplier_id, quantity, unit, shelf_location, expiry_date } = req.body;

    execute(
      `UPDATE products SET
        barcode = ?, name = ?, category_id = ?, supplier_id = ?,
        quantity = ?, unit = ?, shelf_location = ?, expiry_date = ?,
        manufactured_date = ?, batch_number = ?, cost_price = ?, selling_price = ?,
        notes = ?,
        updated_at = datetime('now','localtime')
       WHERE id = ?`,
      [barcode || null, name, category_id || null, supplier_id || null,
       quantity || 1, unit || '개', shelf_location || null, expiry_date,
       req.body.manufactured_date || null, req.body.batch_number || null,
       req.body.cost_price || null, req.body.selling_price || null,
       req.body.notes || null, req.params.id]
    );

    const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '제품 수정 실패' });
  }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', (req, res) => {
  try {
    const result = execute('UPDATE products SET is_active = 0 WHERE id = ? AND is_active = 1', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: '제품을 찾을 수 없습니다.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '제품 삭제 실패' });
  }
});

function getExpiryStatus(expiryDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { level: 'expired', label: '유통기한 초과', days: Math.abs(diffDays) };
  if (diffDays <= 3) return { level: 'critical', label: '임박', days: diffDays };
  if (diffDays <= 14) return { level: 'warning', label: '주의', days: diffDays };
  if (diffDays <= 60) return { level: 'normal', label: '여유 있음', days: diffDays };
  return { level: 'fresh', label: '신규', days: diffDays };
}

module.exports = router;
