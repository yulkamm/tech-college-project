const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAdmin() {
    try {
        // Генерируем правильный хеш
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('\n✅ Хеш пароля для "admin123":');
        console.log(hash);
        
        // Подключаемся к БД используя .env
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'tech_user',
            password: process.env.DB_PASSWORD || 'Q1qqqqqq',
            database: process.env.DB_NAME || 'college_db'
        });
        
        console.log('✅ Подключено к базе данных');
        
        // Обновляем админа
        await conn.execute(
            'UPDATE users SET password_hash = ?, role = ? WHERE username = ?',
            [hash, 'admin', 'admin']
        );
        
        console.log('✅ Обновлён admin');
        
        // Создаём/обновляем yulia
        await conn.execute(
            `INSERT INTO users (username, password_hash, role, photo, email, created_at) 
             VALUES (?, ?, 'admin', 'users_2.jpg', 'yulia@college.ru', NOW())
             ON DUPLICATE KEY UPDATE password_hash = ?, role = 'admin'`,
            ['yulia', hash, hash]
        );
        
        console.log('✅ Создана yulia');
        
        console.log('\n✅ ГОТОВО!');
        console.log('Логин: admin | Пароль: admin123');
        console.log('Логин: yulia | Пароль: admin123');
        
        // Проверяем
        const [rows] = await conn.execute(
            'SELECT username, role, email FROM users WHERE username IN (?, ?)',
            ['admin', 'yulia']
        );
        
        console.log('\n📊 Пользователи:');
        console.table(rows);
        
        await conn.end();
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
    }
}

fixAdmin();
