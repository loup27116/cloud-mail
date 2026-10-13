import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const envHits = Object.keys(process.env).filter(k => /CLOUD|CF_|WRANGLER|D1|KV_|R2_|ACCOUNT/i.test(k));
const cmds = {
  env: envHits.join(','),
  whoami: 'npx wrangler whoami',
  d1list: 'npx wrangler d1 list --json',
  kvlist: 'npx wrangler kv namespace list --json',
  r2list: 'npx wrangler r2 bucket list --json',
  versions: 'npx wrangler versions list --name cloud-mail --json'
};
const out = {};
for (const [k, cmd] of Object.entries(cmds)) {
  try {
    out[k] = execSync(cmd, { encoding: 'utf8', timeout: 180000 }).slice(0, 30000);
  } catch (e) {
    out[k] = 'ERR: ' + String((e.stdout || '') + (e.stderr || '') + ' ' + e.message).slice(0, 800);
  }
}
const js = 'export default ' + JSON.stringify(out) + ';\n';
writeFileSync('src/_ids.js', js);
console.log('ci-dump written bytes=' + js.length);
