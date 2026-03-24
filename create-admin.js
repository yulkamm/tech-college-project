const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function create() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'college_db'
    });
    
    const hash = await bcrypt.hash('admin123', 10);
    
    await conn.execute('DELETE FROM users WHERE username=?', ['admin']);
    await conn.execute(
        'INSERT INTO users (username, password_hash, role, photo, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['admin', hash, 'admin', 'users_1.jpg']
    );
    
    console.log('✅ Admin created!');
    console.log('Login: admin');
    console.log('Password: admin123');
    
    await conn.end();
}

create().catch(console.error);