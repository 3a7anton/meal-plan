const fs = require('fs');
const file = 'f:/Laptop/Web dev/meal-plan-main/meal-plan-main/vite.config.ts';
let content = fs.readFileSync(file, 'utf8');
console.log('has url.match:', content.includes('url.match'));
// Fix: when middleware is mounted at '/api/', Vite strips that prefix,
// so req.url inside the handler is '/bookings/history?...' not '/api/bookings/history?...'
const oldStr = "url.match(/^\\\\/api\\\\/([^?]+)/)";
const newStr = "url.match(/^\\\\/([^?]+)/)";
console.log('old present:', content.includes(oldStr));
content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed. Verifying:', content.includes(newStr));
