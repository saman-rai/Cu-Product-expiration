const { Router } = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/expiry-alerts — products expiring today, tomorrow, expired
router.get('/expiry-alerts', (req, res) => {
  try {
    const products = query(`
      SELECT p.id, p.name, p.barcode, p.expiry_date, p.shelf_location,
             p.quantity, p.unit, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.expiry_date ASC
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const alerts = { today: [], tomorrow: [], expired: [] };

    products.forEach(p => {
      const expiry = new Date(p.expiry_date);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      const item = { id: p.id, name: p.name, barcode: p.barcode, expiry_date: p.expiry_date, shelf_location: p.shelf_location, quantity: p.quantity, unit: p.unit, category_name: p.category_name };

      if (diffDays < 0 && alerts.expired.length < 50) {
        alerts.expired.push(item);
      } else if (diffDays === 0 && alerts.today.length < 50) {
        alerts.today.push(item);
      } else if (diffDays === 1 && alerts.tomorrow.length < 50) {
        alerts.tomorrow.push(item);
      }
    });

    res.json({
      today: alerts.today,
      tomorrow: alerts.tomorrow,
      expired: alerts.expired,
      todayCount: alerts.today.length,
      tomorrowCount: alerts.tomorrow.length,
      expiredCount: products.filter(p => {
        const expiry = new Date(p.expiry_date);
        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) < 0;
      }).length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '알림 조회 실패' });
  }
});

// GET /api/dashboard/summary
router.get('/summary', (req, res) => {
  try {
    const products = query(`
      SELECT p.id, p.name, p.barcode, p.expiry_date, p.shelf_location,
             p.quantity, p.unit, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = 1
      ORDER BY p.expiry_date ASC
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = { expired: 0, critical: 0, warning: 0, normal: 0, fresh: 0 };
    const nearestExpiry = [];

    products.forEach(p => {
      const expiry = new Date(p.expiry_date);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      let level;
      if (diffDays < 0) level = 'expired';
      else if (diffDays <= 3) level = 'critical';
      else if (diffDays <= 14) level = 'warning';
      else if (diffDays <= 60) level = 'normal';
      else level = 'fresh';

      summary[level]++;

      if (diffDays <= 14) {
        nearestExpiry.push({
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          expiry_date: p.expiry_date,
          days_left: diffDays,
          level,
          shelf_location: p.shelf_location,
          quantity: p.quantity,
          unit: p.unit,
          category_name: p.category_name,
          supplier_name: p.supplier_name,
        });
      }
    });

    nearestExpiry.sort((a, b) => a.days_left - b.days_left);

    res.json({ summary, nearestExpiry: nearestExpiry.slice(0, 20), total: products.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '대시보드 조회 실패' });
  }
});

module.exports = router;
