const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { queryOne, execute } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '사용자명과 비밀번호를 입력하세요.' });
    }

    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 일치하지 않습니다.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 일치하지 않습니다.' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({
      id: user.id,
      username: user.username,
      store_name: user.store_name,
      role: user.role,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '로그아웃 실패' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = queryOne(
    'SELECT id, username, store_name, role, created_at FROM users WHERE id = ?',
    [req.session.userId]
  );
  if (!user) return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
  res.json(user);
});

module.exports = router;
