CREATE DATABASE IF NOT EXISTS college_db;
USE college_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') DEFAULT 'student',
    photo VARCHAR(255) DEFAULT 'users_1.jpg',
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
);

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
);

INSERT INTO users (username, password_hash, role, photo, email, created_at) 
VALUES (
    'admin', 
    '$2a$10$rQZ9vXJXL5K5Z5Z5Z5Z5ZeYhYGYhYGYhYGYhYGYhYGYhYGYhYGYhY', 
    'admin', 
    'users_1.jpg', 
    'admin@college.ru', 
    NOW()
);
