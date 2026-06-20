const { Router } = require('express');
const { query, queryOne, execute } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  try {
    const suppliers = query('SELECT * FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 조회 실패' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, contact_person, phone, email, notes } = req.body;
    if (!name) return res.status(400).json({ error: '공급업체명은 필수입니다.' });

    const result = execute(
      'INSERT INTO suppliers (name, contact_person, phone, email, notes) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person || null, phone || null, email || null, notes || null]
    );
    const supplier = queryOne('SELECT * FROM suppliers WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 추가 실패' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, contact_person, phone, email, notes } = req.body;
    execute(
      'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, notes = ? WHERE id = ?',
      [name, contact_person || null, phone || null, email || null, notes || null, req.params.id]
    );
    const supplier = queryOne('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!supplier) return res.status(404).json({ error: '공급업체를 찾을 수 없습니다.' });
    res.json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 수정 실패' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const products = queryOne('SELECT COUNT(*) as count FROM products WHERE supplier_id = ? AND is_active = 1', [req.params.id]);
    if (products.count > 0) return res.status(400).json({ error: '해당 공급업체의 제품이 있어 삭제할 수 없습니다.' });

    execute('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 삭제 실패' });
  }
});

module.exports = router;
