const fs = require('fs');
const path = require('path');

// Создаем простые placeholder изображения (base64 - 1x1 пиксель)
const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const photos = {
    'index': 3,
    'about': 5,
    'contact': 6,
    'students': 5,
    'users': 5
};

Object.keys(photos).forEach(folder => {
    for (let i = 1; i <= photos[folder]; i++) {
        const filename = `${folder}_${i}.jpg`;
        fs.writeFileSync(`public/photos/${filename}`, placeholder);
        console.log(`Создано: public/photos/${filename}`);
    }
});
