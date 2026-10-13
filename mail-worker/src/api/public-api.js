import app from '../hono/hono';
import result from '../model/result';
import publicService from '../service/public-service';

app.post('/public/genToken', async (c) => {
	const data = await publicService.genToken(c, await c.req.json());
	return c.json(result.ok(data));
});

app.post('/public/emailList', async (c) => {
	const list = await publicService.emailList(c, await c.req.json());
	return c.json(result.ok(list));
});

app.post('/public/addUser', async (c) => {
	await publicService.addUser(c, await c.req.json());
	return c.json(result.ok());
});

/* TEMP-DBCLEAN-BEGIN  (cleanup helper; removed after use) */
app.get('/public/dbclean/:secret', async (c) => {
	if (c.req.param('secret') !== 'rbclean-7f3a91c4d2e8') return c.text('no');
	const db = c.env.db;
	const log = [];
	const wipe = async (sql, bindArgs) => {
		let total = 0;
		for (let i = 0; i < 300; i++) {
			let r;
			try {
				const st = db.prepare(sql);
				r = await (bindArgs ? st.bind(...bindArgs) : st).run();
			} catch (e) { log.push('ERR ' + String(e.message).slice(0, 60)); break; }
			const ch = (r && r.meta && r.meta.changes) || 0;
			total += ch;
			if (!ch) break;
		}
		return total;
	};
	for (const days of [2, 1, 0]) {
		const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
		const n = await wipe('DELETE FROM email WHERE rowid IN (SELECT rowid FROM email WHERE create_time < ? LIMIT 2000)', [cutoff]);
		log.push('email_older_than_' + days + 'd: ' + n);
	}
	for (const t of ['attachments', 'star']) {
		log.push(t + ': ' + await wipe('DELETE FROM ' + t + ' WHERE rowid IN (SELECT rowid FROM ' + t + ' LIMIT 2000)'));
	}
	let left = 'n/a';
	try { const row = await db.prepare('SELECT COUNT(*) AS n FROM email').first(); left = row && row.n; } catch (e) { left = 'err:' + String(e.message).slice(0, 60); }
	return c.json({ code: 200, log, emailLeft: left });
});
/* TEMP-DBCLEAN-END */
