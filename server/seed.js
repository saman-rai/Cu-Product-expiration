require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { initDatabase, queryOne, execute } = require('./db');

async function seed() {
  await initDatabase();

  // Create admin user
  const existing = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    execute('INSERT INTO users (username, password, store_name, role) VALUES (?, ?, ?, ?)',
      ['admin', hash, 'CU 편의점', 'admin']);
    console.log('✅ Admin user created (username: admin, password: admin123)');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Create sample categories
  const catCount = queryOne('SELECT COUNT(*) as count FROM categories');
  if (catCount.count === 0) {
    const beverages = execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['음료', null, 1]).lastInsertRowid;
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['탄산음료', beverages, 1]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['커피', beverages, 2]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['주스', beverages, 3]);

    const snacks = execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['간식', null, 2]).lastInsertRowid;
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['과자', snacks, 1]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['초콜릿', snacks, 2]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['껌/캔디', snacks, 3]);

    const dairy = execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['유제품', null, 3]).lastInsertRowid;
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['우유', dairy, 1]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['요구르트', dairy, 2]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['치즈', dairy, 3]);

    const ramen = execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['라면/즉석식품', null, 4]).lastInsertRowid;
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['봉지라면', ramen, 1]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['컵라면', ramen, 2]);
    execute('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)', ['즉석밥', ramen, 3]);

    console.log('✅ Sample categories created');
  } else {
    console.log('ℹ️  Categories already exist');
  }

  // Create sample suppliers
  const supCount = queryOne('SELECT COUNT(*) as count FROM suppliers');
  if (supCount.count === 0) {
    execute('INSERT INTO suppliers (name, contact_person, phone, notes) VALUES (?, ?, ?, ?)',
      ['서울우유협동조합', '김대리', '02-1234-5678', '우유 및 유제품']);
    execute('INSERT INTO suppliers (name, contact_person, phone, notes) VALUES (?, ?, ?, ?)',
      ['빙그레', '박과장', '02-2345-6789', '유제품, 아이스크림']);
    execute('INSERT INTO suppliers (name, contact_person, phone, notes) VALUES (?, ?, ?, ?)',
      ['농심', '최팀장', '02-3456-7890', '라면, 스낵']);
    execute('INSERT INTO suppliers (name, contact_person, phone, notes) VALUES (?, ?, ?, ?)',
      ['오리온', '정대리', '02-4567-8901', '과자, 초콜릿']);
    execute('INSERT INTO suppliers (name, contact_person, phone, notes) VALUES (?, ?, ?, ?)',
      ['코카콜라', '이과장', '02-5678-9012', '탄산음료']);
    console.log('✅ Sample suppliers created');
  } else {
    console.log('ℹ️  Suppliers already exist');
  }

  console.log('\n🎉 Seed complete! Login with: admin / admin123');
}

seed().catch(console.error);
