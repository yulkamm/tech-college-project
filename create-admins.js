const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmins() {
    try {
        // Генерируем хеш
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('\n✅ Хеш для пароля "admin123":');
        console.log(hash);
        
        // Подключение к БД
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'tech_user',
            password: process.env.DB_PASSWORD || 'Q1qqqqqq',
            database: process.env.DB_NAME || 'college_db'
        });
        
        console.log('✅ Подключено к БД');
        
        // Создаём/обновляем admin
        await conn.execute(
            `INSERT INTO users (username, password_hash, role, photo, email, created_at) 
             VALUES (?, ?, 'admin', 'users_1.jpg', 'admin@college.ru', NOW())
             ON DUPLICATE KEY UPDATE password_hash = ?, role = 'admin'`,
            ['admin', hash, hash]
        );
        console.log('✅ Admin создан/обновлён');
        
        // Создаём/обновляем yulia
        await conn.execute(
            `INSERT INTO users (username, password_hash, role, photo, email, created_at) 
             VALUES (?, ?, 'admin', 'users_2.jpg', 'yulia@college.ru', NOW())
             ON DUPLICATE KEY UPDATE password_hash = ?, role = 'admin'`,
            ['yulia', hash, hash]
        );
        console.log('✅ Yulia создана/обновлена');
        
        // Проверка
        const [rows] = await conn.execute(
            'SELECT username, role FROM users WHERE username IN (?, ?)',
            ['admin', 'yulia']
        );
        console.log('\n📊 Пользователи:', rows);
        
        await conn.end();
        
        console.log('\n🎉 ГОТОВО!');
        console.log('Логин: admin | Пароль: admin123');
        console.log('Логин: yulia | Пароль: admin123');
        
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
    }
}

createAdmins();
