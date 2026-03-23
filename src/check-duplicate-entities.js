const fs = require('fs');
const path = require('path');

const SRC_DIR =__dirname;

const entityMap = {}; // tableName -> [file paths]
const classMap = {};  // className -> [file paths]

function scanDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.entity.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Match @Entity('table_name')
      const entityMatch = content.match(/@Entity\(['"`](.*?)['"`]\)/);
      if (entityMatch) {
        const tableName = entityMatch[1];
        if (!entityMap[tableName]) entityMap[tableName] = [];
        entityMap[tableName].push(fullPath);
      }

      // Match class name
      const classMatch = content.match(/export class (\w+)/);
      if (classMatch) {
        const className = classMatch[1];
        if (!classMap[className]) classMap[className] = [];
        classMap[className].push(fullPath);
      }
    }
  }
}

scanDir(SRC_DIR);

console.log('\n🔍 Checking duplicate TABLE entities:\n');

for (const [table, files] of Object.entries(entityMap)) {
  if (files.length > 1) {
    console.log(`❌ Table "${table}" is defined in multiple files:`);
    files.forEach(f => console.log(`   - ${f}`));
  }
}

console.log('\n🔍 Checking duplicate CLASS names:\n');

for (const [cls, files] of Object.entries(classMap)) {
  if (files.length > 1) {
    console.log(`❌ Class "${cls}" is duplicated:`);
    files.forEach(f => console.log(`   - ${f}`));
  }
}

console.log('\n✅ Scan complete.\n');