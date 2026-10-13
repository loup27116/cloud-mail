import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sh = (cmd, t = 180000) => {
  try { return execSync(cmd, { encoding: 'utf8', timeout: t }).slice(0, 40000); }
  catch (e) { return 'ERR: ' + String((e.stdout || '') + (e.stderr || '') + ' ' + e.message).slice(0, 800); }
};
const out = {};
out.whoami = sh('npx wrangler whoami').slice(0, 600);
out.d1list = sh('npx wrangler d1 list --json');
out.kvlist = sh('npx wrangler kv namespace list');
out.r2list = sh('npx wrangler r2 bucket list');
const vl = sh('npx wrangler versions list --name cloud-mail --json');
out.versions = vl.slice(0, 3000);
let ids = [];
try { ids = JSON.parse(vl).map(v => v.id).slice(-4); } catch (e) {}
for (const id of ids) out['ver_' + id.slice(0, 8)] = sh('npx wrangler versions view ' + id + ' --json', 120000).slice(0, 12000);
writeFileSync('src/_ids.js', 'export default ' + JSON.stringify(out) + ';\n');
console.log('ci-dump v2 done, versions=' + ids.length);
