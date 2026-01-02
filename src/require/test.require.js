const p = require('./require.js'); // ganti dengan nama file minified kamu

const secret = 'JBSWY3DPEHPK3PXP'; // contoh secret dalam Base32
const pw = p.generatePassword(secret, { length: 10 });

console.log('UTC now:', new Date().toISOString());
console.log('password:', pw);

// cek verifikasi
console.log('verify self:', p.verifyPassword(secret, pw) ? 'OK' : 'FAIL');
