const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createYulia() {
    try {
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('\n✅ Хеш пароля для yulia:');
        console.log(hash);
        
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'tech_user',
            password: process.env.DB_PASSWORD || 'Q1qqqqqq',
            database: process.env.DB_NAME || 'college_db'
        });
        
        console.log('✅ Подключено к БД');
        
        // Создаём или обновляем yulia
        await conn.execute(
            `INSERT INTO users (username, password_hash, role, photo, email, created_at) 
             VALUES (?, ?, 'admin', 'users_2.jpg', 'yulia@college.ru', NOW())
             ON DUPLICATE KEY UPDATE password_hash = ?, role = 'admin'`,
            ['yulia', hash, hash]
        );
        
        console.log('✅ Yulia создана/обновлена');
        
        // Проверяем
        const [rows] = await conn.execute(
            'SELECT username, role, email FROM users WHERE username = ?',
            ['yulia']
        );
        
        console.log('\n📊 Пользователь yulia:', rows[0]);
        console.log('\n🎉 ГОТОВО!');
        console.log('Логин: yulia');
        console.log('Пароль: admin123');
        
        await conn.end();
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
    }
}

createYulia();
