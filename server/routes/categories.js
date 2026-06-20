const { Router } = require('express');
const { query, queryOne, execute } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

// GET /api/categories — flat list
router.get('/', (req, res) => {
  try {
    const categories = query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name');
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '카테고리 조회 실패' });
  }
});

// GET /api/categories/tree — nested tree
router.get('/tree', (req, res) => {
  try {
    const categories = query('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name');
    const buildTree = (parentId = null) =>
      categories
        .filter(c => c.parent_id === parentId)
        .map(c => ({ ...c, children: buildTree(c.id) }));
    res.json(buildTree(null));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '카테고리 조회 실패' });
  }
});

// POST /api/categories
router.post('/', (req, res) => {
  try {
    const { name, parent_id, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: '카테고리명은 필수입니다.' });

    const result = execute(
      'INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)',
      [name, parent_id || null, sort_order || 0]
    );
    const cat = queryOne('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '카테고리 추가 실패' });
  }
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  try {
    const { name, sort_order } = req.body;
    execute('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?', [name, sort_order || 0, req.params.id]);
    const cat = queryOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!cat) return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '카테고리 수정 실패' });
  }
});

// DELETE /api/categories/:id — prevents if has children or products
router.delete('/:id', (req, res) => {
  try {
    const children = queryOne('SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND is_active = 1', [req.params.id]);
    if (children.count > 0) return res.status(400).json({ error: '하위 카테고리가 있어 삭제할 수 없습니다.' });

    const products = queryOne('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1', [req.params.id]);
    if (products.count > 0) return res.status(400).json({ error: '해당 카테고리의 제품이 있어 삭제할 수 없습니다.' });

    execute('UPDATE categories SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '카테고리 삭제 실패' });
  }
});

module.exports = router;
