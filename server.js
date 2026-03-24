const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/photos', express.static(path.join(__dirname, 'public/photos')));

// Session - ИСПРАВЛЕНО для production
app.use(session({
    secret: process.env.SESSION_SECRET || 'tech-college-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax'
    }
}));

// Database - поддержка SSL для production
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'tech_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

let pool;

// ==================== ИНИЦИАЛИЗАЦИЯ БД С АВТО-СОЗДАНИЕМ ТАБЛИЦ ====================
async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        console.log('✅ Database connected!');
        console.log('📊 Host:', dbConfig.host);
        console.log('📊 Database:', dbConfig.database);
        
        // Создаём таблицу users если не существует
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'student') DEFAULT 'student',
                photo VARCHAR(255) DEFAULT 'users_1.jpg',
                email VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "users" checked/created');
        
        // Создаём таблицу students если не существует
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                group_name VARCHAR(20) NOT NULL,
                photo VARCHAR(255) DEFAULT 'students_1.jpg',
                email VARCHAR(100),
                phone VARCHAR(20),
                birth_date DATE,
                address VARCHAR(255),
                parent_name VARCHAR(100),
                parent_phone VARCHAR(20)
            )
        `);
        console.log('✅ Table "students" checked/created');
        
        // Создаём таблицу teachers если не существует
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS teachers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                photo VARCHAR(255) DEFAULT 'teachers_1.jpg',
                email VARCHAR(100),
                phone VARCHAR(20),
                experience INT,
                education VARCHAR(255),
                category VARCHAR(100),
                office VARCHAR(50)
            )
        `);
        console.log('✅ Table "teachers" checked/created');
        
        // Создаём админа если не существует
        const [adminRows] = await connection.execute(
            'SELECT id FROM users WHERE username = ?', 
            ['admin']
        );
        
        if (adminRows.length === 0) {
            const adminHash = await bcrypt.hash('admin123', 10);
            await connection.execute(
                `INSERT INTO users (username, password_hash, role, photo, email, created_at) 
                 VALUES ('admin', ?, 'admin', 'users_1.jpg', 'admin@college.ru', NOW())`,
                [adminHash]
            );
            console.log('✅ Admin user created (password: admin123)');
        } else {
            console.log('✅ Admin user already exists');
        }
        
        connection.release();
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
        console.error('💡 Проверьте переменные окружения и подключение к БД');
    }
}

// ==================== MIDDLEWARE ====================

function isAdmin(req, res, next) {
    if (req.session.role === 'admin') {
        next();
    } else {
        console.log('⚠️ Доступ запрещён:', req.session?.username || 'anon', req.path);
        res.status(403).json({ error: 'Только для админов' });
    }
}

// ==================== МАРШРУТЫ СТРАНИЦ ====================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/students', (req, res) => res.sendFile(path.join(__dirname, 'public', 'students.html')));
app.get('/teachers', (req, res) => res.sendFile(path.join(__dirname, 'public', 'teachers.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// ==================== API: АВТОРИЗАЦИЯ ====================

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('📝 Регистрация:', username);
        
        if (!username || !password || password.length < 4) {
            return res.status(400).json({ error: 'Неверные данные' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const photoNum = Math.floor(Math.random() * 5) + 1;
        
        await pool.execute(
            'INSERT INTO users (username, password_hash, role, photo, created_at) VALUES (?, ?, ?, ?, NOW())',
            [username, hashedPassword, 'student', `users_${photoNum}.jpg`]
        );
        
        console.log('✅ Пользователь зарегистрирован:', username);
        res.json({ success: true, message: 'Регистрация успешна! Войдите.' });
    } catch (err) {
        console.error('❌ Ошибка регистрации:', err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Пользователь уже существует' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔍 Вход:', username);
        
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        
        if (rows.length === 0) {
            console.log('❌ Пользователь не найден:', username);
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        
        const user = rows[0];
        console.log('✓ Пользователь найден:', user.username, 'Роль:', user.role);
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('🔑 Проверка пароля:', isValid ? '✅ ОК' : '❌ НЕВЕРНЫЙ');
        
        if (!isValid) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }
        
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        
        console.log('✅ Вход выполнен! Сессия:', { 
            userId: req.session.userId, 
            username: req.session.username, 
            role: req.session.role 
        });
        
        res.json({ 
            success: true, 
            role: user.role,
            username: user.username
        });
    } catch (err) {
        console.error('❌ Ошибка входа:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/logout', (req, res) => {
    console.log('🚪 Выход:', req.session.username);
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/session', (req, res) => {
    if (req.session.userId) {
        res.json({
            loggedIn: true,
            username: req.session.username,
            role: req.session.role
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// ==================== API: СТУДЕНТЫ ====================

app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM students');
        res.json(rows);
    } catch (err) {
        console.error('❌ Ошибка загрузки студентов:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/students', isAdmin, async (req, res) => {
    try {
        const { full_name, group_name, photo, email, phone, birth_date, address, parent_name, parent_phone } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO students (full_name, group_name, photo, email, phone, birth_date, address, parent_name, parent_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, group_name, photo || 'students_1.jpg', email, phone, birth_date, address, parent_name, parent_phone]
        );
        console.log('✅ Студент добавлен, ID:', result.insertId);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('❌ Ошибка добавления студента:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/students/:id', isAdmin, async (req, res) => {
    try {
        const { full_name, group_name, photo, email, phone, birth_date, address, parent_name, parent_phone } = req.body;
        await pool.execute(
            'UPDATE students SET full_name=?, group_name=?, photo=?, email=?, phone=?, birth_date=?, address=?, parent_name=?, parent_phone=? WHERE id=?',
            [full_name, group_name, photo, email, phone, birth_date, address, parent_name, parent_phone, req.params.id]
        );
        console.log('✅ Студент обновлён, ID:', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Ошибка обновления студента:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/students/:id', isAdmin, async (req, res) => {
    try {
        await pool.execute('DELETE FROM students WHERE id=?', [req.params.id]);
        console.log('✅ Студент удалён, ID:', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Ошибка удаления студента:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== API: ПРЕПОДАВАТЕЛИ ====================

app.get('/api/teachers', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM teachers');
        res.json(rows);
    } catch (err) {
        console.error('❌ Ошибка загрузки преподавателей:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/teachers', isAdmin, async (req, res) => {
    try {
        const { full_name, subject, photo, email, phone, experience, education, category, office } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO teachers (full_name, subject, photo, email, phone, experience, education, category, office) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, subject, photo || 'teachers_1.jpg', email, phone, experience, education, category, office]
        );
        console.log('✅ Преподаватель добавлен, ID:', result.insertId);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('❌ Ошибка добавления преподавателя:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/teachers/:id', isAdmin, async (req, res) => {
    try {
        const { full_name, subject, photo, email, phone, experience, education, category, office } = req.body;
        await pool.execute(
            'UPDATE teachers SET full_name=?, subject=?, photo=?, email=?, phone=?, experience=?, education=?, category=?, office=? WHERE id=?',
            [full_name, subject, photo, email, phone, experience, education, category, office, req.params.id]
        );
        console.log('✅ Преподаватель обновлён, ID:', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Ошибка обновления преподавателя:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/teachers/:id', isAdmin, async (req, res) => {
    try {
        await pool.execute('DELETE FROM teachers WHERE id=?', [req.params.id]);
        console.log('✅ Преподаватель удалён, ID:', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Ошибка удаления преподавателя:', err.message);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    await initDB();
});

// Обработка завершения
process.on('SIGINT', async () => {
    console.log('🛑 Завершение работы...');
    if (pool) {
        await pool.end();
        console.log('✅ База данных отключена');
    }
    process.exit(0);
});