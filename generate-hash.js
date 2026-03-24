const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('\n===== ГОТОВЫЙ SQL ЗАПРОС =====\n');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
    console.log('\n===== ХЕШ =====\n');
    console.log(hash);
    console.log('\n===============================\n');
}

generateHash();
