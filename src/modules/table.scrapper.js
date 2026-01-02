// parse_pastehere_big.js
// Usage: node parse_pastehere_big.js pastehere.txt
const fs = require('fs');
const path = require('path');
const Big = require('big.js');

const filename = process.argv[2] || 'pastehere.txt';
if (!fs.existsSync(filename)) {
  console.error('File not found:', filename);
  process.exit(2);
}
const text = fs.readFileSync(filename, 'utf8');
const RE = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
const matches = text.match(RE) || [];

let total = new Big(0);
const values = matches.map(s => {
  const n = s.replace(/,/g, ''); // "25,600.00" -> "25600.00"
  const b = new Big(n);
  total = total.plus(b);
  return b;
});

const totalStr = total.toFixed(2);
const idr = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
console.log('Detected amounts:', matches.length);
console.log('Total penjualan:', 'Rp', idr.format(parseFloat(totalStr)));
