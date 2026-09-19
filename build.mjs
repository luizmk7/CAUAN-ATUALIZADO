import { mkdir, cp, rm } from 'node:fs/promises';
const files = ['index.html', 'style.css', 'cinema.css', 'app.js', 'cinema.js', 'favicon.svg', 'assets'];
await rm('dist', {recursive: true, force: true});
await mkdir('dist', {recursive: true});
for (const file of files) await cp(file, `dist/${file}`, {recursive: true});
console.log('Site pronto em dist/');
