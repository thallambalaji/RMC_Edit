import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src', 'pages');

const replacements = [
  // Container
  {
    from: /className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print"/g,
    to: 'className="w-60 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 no-print"'
  },
  // Header container
  {
    from: /className="p-4 bg-gray-50 border-b"/g,
    to: 'className="p-4 bg-slate-50/50 border-b border-slate-100"'
  },
  // Header text
  {
    from: /className="font-bold text-gray-800 text-sm"/g,
    to: 'className="font-extrabold text-slate-800 text-xs uppercase tracking-wider"'
  },
  // AccordionItem
  {
    from: /className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"/g,
    to: 'className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"'
  },
  // AccordionTrigger
  {
    from: /className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors"/g,
    to: 'className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider"'
  },
  // AccordionContent
  {
    from: /className="bg-gray-50\/50 pb-2 border-t"/g,
    to: 'className="bg-slate-50/20 pb-2 border-t border-slate-50"'
  }
];

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const rep of replacements) {
        content = content.replace(rep.from, rep.to);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated styles in ${file}`);
      }
    }
  }
}

walk(dir);
console.log("Done updating styles.");
