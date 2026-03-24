const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createYulia() {
    const password = 'yulia123';  // Новый пароль
    const hash = await bcrypt.hash(password, 10);
    
    console.log('\n✅ Хеш для пароля "yulia123":');
    console.log(hash);
    
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'tech_user',
        password: 'Q1qqqqqq',
        database: 'college_db'
    });
    
    await conn.execute('DELETE FROM users WHERE username = ?', ['yulia']);
    
    await conn.execute(
        'INSERT INTO users (username, password_hash, role, photo, email, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        ['yulia', hash, 'admin', 'users_2.jpg', 'yulia@college.ru']
    );
    
    console.log('\n🎉 ГОТОВО!');
    console.log('Логин: yulia');
    console.log('Пароль: yulia123');
    
    await conn.end();
}

createYulia();
