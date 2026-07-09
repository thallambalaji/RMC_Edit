import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx') && (file.startsWith('add-') || file.startsWith('edit-'))) {
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

  // Replace Clear button to Cancel and go back
  const regex = /<Button((?:(?!<Button|<\/Button>)[\s\S])*?)>([\s\n]*Clear[\s\n]*)<\/Button>/gi;
  
  content = content.replace(regex, (match, p1, p2) => {
    // If it already contains history.back, skip (just in case)
    if (p1.includes('window.history.back()')) return match;
    
    // For list pages we skip, but we filtered for add-*/edit-* already so we are good.
    // Replace onClick with history.back
    let newProps = p1;
    if (/onClick=\{[^}]+\}/.test(p1)) {
      newProps = p1.replace(/onClick=\{[^}]+\}/, 'onClick={() => window.history.back()}');
    } else {
      newProps = p1 + ' onClick={() => window.history.back()}';
    }
    return `<Button${newProps}>Cancel</Button>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated Clear to Cancel:', path.basename(file));
    changedFiles++;
  }
}

console.log('Total files updated for Clear:', changedFiles);
