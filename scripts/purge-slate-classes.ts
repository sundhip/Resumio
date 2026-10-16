import fs from 'fs';
import path from 'path';

const REPLACEMENTS: [RegExp, string][] = [
  // Dark backgrounds
  [/dark:bg-slate-950/g, 'dark:bg-[#050708]'],
  [/dark:bg-slate-900\/(\d+)/g, 'dark:bg-[#0C1113]/$1'],
  [/dark:bg-slate-900/g, 'dark:bg-[#0C1113]'],
  [/dark:bg-slate-800\/(\d+)/g, 'dark:bg-[#111719]/$1'],
  [/dark:bg-slate-800/g, 'dark:bg-[#111719]'],
  [/dark:bg-slate-700/g, 'dark:bg-[#161E21]'],
  
  // Light backgrounds
  [/bg-slate-900/g, 'bg-[#111312] dark:bg-[#0C1113]'],
  [/bg-slate-50/g, 'bg-[#F4F4F1]'],
  [/bg-slate-100/g, 'bg-[#E9E9E5]'],
  [/bg-slate-200/g, 'bg-[#DCDCD7]'],

  // Borders
  [/dark:border-slate-800/g, 'dark:border-white/8'],
  [/dark:border-slate-700/g, 'dark:border-white/6'],
  [/border-slate-200\/(\d+)/g, 'border-[#E7E7E2]/$1'],
  [/border-slate-200/g, 'border-[#E7E7E2]'],
  [/border-slate-300/g, 'border-[#DCDCD7]'],
  [/border-slate-100/g, 'border-[#EFEFEA]'],

  // Text
  [/text-slate-900 dark:text-white/g, 'text-[#111312] dark:text-[#F2F6F7]'],
  [/text-slate-900 dark:text-slate-100/g, 'text-[#111312] dark:text-[#F2F6F7]'],
  [/text-slate-900/g, 'text-[#111312] dark:text-[#F2F6F7]'],
  [/text-slate-800 dark:text-slate-200/g, 'text-[#111312] dark:text-[#F2F6F7]'],
  [/text-slate-800 dark:text-white/g, 'text-[#111312] dark:text-[#F2F6F7]'],
  [/text-slate-800/g, 'text-[#111312] dark:text-[#F2F6F7]'],
  [/text-slate-700 dark:text-slate-300/g, 'text-[#111312] dark:text-[#F2F6F7]'],
  [/text-slate-700/g, 'text-[#5E6460] dark:text-[#9AA7AB]'],
  [/text-slate-600 dark:text-slate-400/g, 'text-[#5E6460] dark:text-[#9AA7AB]'],
  [/text-slate-600 dark:text-slate-300/g, 'text-[#5E6460] dark:text-[#F2F6F7]'],
  [/text-slate-600/g, 'text-[#5E6460] dark:text-[#9AA7AB]'],
  [/text-slate-500 dark:text-slate-400/g, 'text-[#5E6460] dark:text-[#9AA7AB]'],
  [/text-slate-500/g, 'text-[#5E6460] dark:text-[#9AA7AB]'],
  [/text-slate-400/g, 'text-[#8A928D] dark:text-[#657378]'],
  [/text-slate-300/g, 'text-[#8A928D] dark:text-[#9AA7AB]'],
  [/text-slate-200/g, 'text-[#DCDCD7] dark:text-[#C5D0D3]'],

  // Hovers
  [/dark:hover:bg-slate-800\/(\d+)/g, 'dark:hover:bg-white/5'],
  [/dark:hover:bg-slate-800/g, 'dark:hover:bg-white/5'],
  [/dark:hover:bg-slate-700/g, 'dark:hover:bg-white/10'],
  [/hover:bg-slate-100/g, 'hover:bg-black/5'],
  [/hover:bg-slate-50/g, 'hover:bg-black/2'],

  // Indigo to Teal
  [/border-indigo-600/g, 'border-[#1F8FA6]'],
  [/text-indigo-600 dark:text-indigo-400/g, 'text-[#1F8FA6] dark:text-[#5FD3E8]'],
  [/text-indigo-600/g, 'text-[#1F8FA6]'],
  [/text-indigo-700/g, 'text-[#1F8FA6]'],
  [/text-indigo-400/g, 'text-[#5FD3E8]'],
  [/text-indigo-300/g, 'text-[#5FD3E8]'],
  [/bg-indigo-600/g, 'bg-[#1F8FA6]'],
  [/bg-indigo-50/g, 'bg-[#1F8FA6]/10'],
  [/border-indigo-200/g, 'border-[#1F8FA6]/30'],
  [/border-indigo-800/g, 'border-[#1F8FA6]/30'],
  [/focus:ring-indigo-500/g, 'focus:ring-[#1F8FA6]/40'],
];

function getAllFiles(dir: string, ext = '.tsx'): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

const targets = [
  ...getAllFiles(path.resolve(process.cwd(), 'src/pages')),
  ...getAllFiles(path.resolve(process.cwd(), 'src/components')),
];

let totalChanges = 0;
for (const file of targets) {
  let content = fs.readFileSync(file, 'utf8');
  let changes = 0;
  for (const [pattern, repl] of REPLACEMENTS) {
    const matches = content.match(pattern);
    if (matches) {
      changes += matches.length;
      content = content.replace(pattern, repl);
    }
  }
  if (changes > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges += changes;
    console.log(`Updated ${path.relative(process.cwd(), file)}: ${changes} replacements.`);
  }
}

console.log(`Total replacements: ${totalChanges}`);
