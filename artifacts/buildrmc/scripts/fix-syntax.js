import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const pagesDir = path.join(process.cwd(), 'src', 'pages');
const compDir = path.join(process.cwd(), 'src', 'components');
const allFiles = [...walk(pagesDir), ...walk(compDir)];

let changedFiles = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Fix the extra closing braces created by the previous script
  content = content.replace(/onClick=\{\(\) => window\.history\.back\(\)\}\}/g, 'onClick={() => window.history.back()}');
  content = content.replace(/onClick=\{\(\) => window\.history\.back\(\)\}\}\}/g, 'onClick={() => window.history.back()}');
  
  // Actually a safe regex to replace multiple trailing braces
  content = content.replace(/onClick=\{\(\) => window\.history\.back\(\)\}\}+/g, 'onClick={() => window.history.back()}');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed syntax in:', path.basename(file));
    changedFiles++;
  }
}

console.log('Total files fixed:', changedFiles);
