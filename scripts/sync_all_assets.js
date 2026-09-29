import fs from 'node:fs';

const panel = fs.readFileSync('cloudflare-bot/panel/index.html', 'utf8');
const flowchart = fs.readFileSync('cloudflare-bot/flowchart.html', 'utf8');

// 1. Update panelHtml.js
fs.writeFileSync(
  'cloudflare-bot/panelHtml.js',
  '// Auto-generated panel HTML export\nexport const PANEL_HTML = ' +
    JSON.stringify(panel) +
    ';\nexport const FLOWCHART_HTML = ' +
    JSON.stringify(flowchart) +
    ';\n'
);

// 2. Update cloudflare-bot/worker.js lines 23 and 24
const lines = fs.readFileSync('cloudflare-bot/worker.js', 'utf8').split('\n');
lines[22] = 'const PANEL_HTML = ' + JSON.stringify(panel) + ';';
lines[23] = 'const FLOWCHART_HTML = ' + JSON.stringify(flowchart) + ';';
fs.writeFileSync('cloudflare-bot/worker.js', lines.join('\n'));

// 3. Sync to public/files/
fs.copyFileSync('cloudflare-bot/worker.js', 'public/files/worker.js');
fs.copyFileSync('cloudflare-bot/panel/index.html', 'public/files/panel-index.html');
fs.copyFileSync('cloudflare-bot/flowchart.html', 'public/files/flowchart.html');
fs.copyFileSync('cloudflare-bot/migration.sql', 'public/files/migration.sql');
fs.copyFileSync('cloudflare-bot/schema.sql', 'public/files/schema.sql');
fs.copyFileSync('cloudflare-bot/wrangler.toml.example', 'public/files/wrangler.toml.example');

console.log('All files synced successfully!');
