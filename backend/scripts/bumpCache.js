const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updated = 0;
for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace ?v=number with ?v=11
    if (content.includes('store.js?v=')) {
        content = content.replace(/store\.js\?v=\d+/g, 'store.js?v=11');
        fs.writeFileSync(fullPath, content);
        updated++;
    }
}

console.log(`Successfully updated ${updated} HTML files to version 11.`);
