import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';

const sh = (cmd, t = 300000) => {
  try { return execSync(cmd, { encoding: 'utf8', timeout: t }); }
  catch (e) { return 'ERR: ' + String((e.stdout || '') + (e.stderr || '') + ' ' + e.message).slice(0, 600); }
};
const log = [];
// 先看当前体积
const before = sh('npx wrangler d1 list --json');
log.push('before: ' + before.replace(/\s+/g, ' ').slice(0, 300));
// 从最旧的邮件开始删，保留最近的信
for (let i = 0; i < 60; i++) {
  const r = sh('npx wrangler d1 execute cloud-mail --remote --yes --command "DELETE FROM email WHERE rowid IN (SELECT rowid FROM email ORDER BY create_time ASC LIMIT 5000)"');
  const m = r.match(/rows?_written["\s:]+(\d+)/i) || r.match(/(\d+)\s+rows?/i);
  log.push('batch' + i + ' changes=' + (m ? m[1] : '?') + (r.startsWith('ERR') ? ' ' + r.slice(0, 200) : ''));
  if (r.startsWith('ERR')) break;
  if (m && m[1] === '0') break;
}
const after = sh('npx wrangler d1 list --json');
log.push('after: ' + after.replace(/\s+/g, ' ').slice(0, 300));
let dump = {};
try { dump = JSON.parse(readFileSync('src/_ids.js', 'utf8').replace(/^export default /, '').replace(/;\s*$/, '')); } catch (e) {}
dump.clean = log;
writeFileSync('src/_ids.js', 'export default ' + JSON.stringify(dump) + ';\n');
console.log('ci-d1clean done: ' + log.length + ' lines');
