/* The Elemental Saga - Forumdaten fuer GitHub Actions (laeuft stuendlich).
   Liest wie ein Gast:
     - welche Szenen im Szenenarchiv liegen (alle Foren mit "Archiv" im Namen im RPG-Bereich, samt Unterforen)
     - wie viele Beitraege jede Person in jeder archivierten Szene geschrieben hat (ab der Wortgrenze)
     - die Liste der Trainingsbuecher
   und schreibt forum-daten.js. Die Scripts im Forum lesen diese eine Datei, statt das Forum selbst abzusuchen.
   Archivierte Szenen werden nur einmal gezaehlt (bzw. erneut, wenn dort ein Beitrag dazukommt), der Rest kommt aus daten/cache.json.
   Umgebung: KOMPLETT=true liest alles neu. */
process.env.TZ = process.env.TZ || 'Europe/Berlin';
import { parseHTML } from 'linkedom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CFG = {
  base: process.env.FORUM || 'https://the-elemental-saga.forumieren.de',
  category: '/c3-rpg-bereich',          // RPG-Bereich: dort liegen die Szenenarchive
  buecher: '/f54-trainingsbucher',      // Trainingsbuecher
  archiv: /archiv/i,                    // Foren mit diesem Wort im Namen gelten als Szenenarchiv (Unterforen ebenso)
  woerter: 200,                         // Beitraege zaehlen erst ab so vielen Woertern (wie TES_GEMEINSAM.szenen.woerter)
  strukturStunden: 24,                  // so oft wird die Liste der Foren neu gelesen
  delay: +(process.env.PAUSE || 600)    // Pause zwischen Seitenabrufen (ms), schont das Forum
};
const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const CACHE = path.join(HIER, 'cache.json');
const OUT = path.join(REPO, 'forum-daten.js');
const KOMPLETT = /^(1|true|ja)$/i.test(process.env.KOMPLETT || '');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('[Forumdaten]', ...a);
const pfad = h => String(h || '').replace(/^https?:\/\/[^\/]+/i, '');
let abrufe = 0;
async function get(url) {
  let fehler = null;
  for (let v = 0; v < 3; v++) {
    await sleep(CFG.delay + v * 5000);
    try {
      const r = await fetch(CFG.base + pfad(url), { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'de-DE,de;q=0.9' }, redirect: 'follow' });
      abrufe++;
      if (r.ok) return parseHTML(await r.text()).document;
      fehler = new Error(url + ' -> HTTP ' + r.status);
      if (r.status === 404) break;
    } catch (e) { fehler = e; }
  }
  throw fehler;
}
const idOf = (href, t) => { const m = pfad(href).match(new RegExp('^/' + t + '(\\d+)')); return m ? +m[1] : null; };
function pageUrls(doc, href, t) {
  href = pfad(href);
  const id = idOf(href, t), slug = href.replace(/^\/[ft]\d+(p\d+)?-?/, '').replace(/[?#].*$/, '');
  const offs = [...doc.querySelectorAll('a[href]')].map(a => pfad(a.getAttribute('href')).match(new RegExp('^/' + t + id + 'p(\\d+)-')))
    .filter(Boolean).map(m => +m[1]).filter(n => n > 0);
  if (!offs.length) return [];
  const step = Math.min(...offs), max = Math.max(...offs), out = [];
  for (let o = step; o <= max; o += step) out.push('/' + t + id + 'p' + o + '-' + slug);
  return out;
}
async function alleSeiten(href, t) {
  const first = await get(href), docs = [first];
  for (const u of pageUrls(first, href, t)) docs.push(await get(u));
  return docs;
}
/* gleiche Regeln wie TES_SZENE im Forum */
const norm = s => String(s || '').toLowerCase().replace(/\u00e4/g, 'ae').replace(/\u00f6/g, 'oe').replace(/\u00fc/g, 'ue').replace(/\u00df/g, 'ss').replace(/[^a-z0-9]/g, '');
function woerter(el) {
  const t = el.cloneNode(true);
  t.querySelectorAll('blockquote, cite, .quote, .codebox, pre, code, script, style').forEach(x => x.remove());
  const txt = (t.textContent || '').replace(/\[([a-z\u00e4\u00f6\u00fc]+)\][\s\S]*?\[\/\1\]/gi, ' ');
  return txt.split(/\s+/).filter(w => /[0-9A-Za-z\u00c0-\u024f]/.test(w)).length;
}
function autor(p) {
  let a = [...p.querySelectorAll('.postbody p.author a[href*="/u"]')].find(x => x.textContent.trim());
  if (!a) a = [...p.querySelectorAll('.postprofile a[href*="/u"]')].find(x => x.textContent.trim());
  if (a) return a.textContent.trim();
  const au = p.querySelector('.postbody p.author');   /* Gastansicht ohne Profillink */
  return au ? au.textContent.replace(/^.*?von\s*/, '').split(/\s+(Mo|Di|Mi|Do|Fr|Sa|So|Heute|Gestern|\d)/)[0].trim() : '';
}
function zaehlen(docs) {
  const out = {}, seen = new Set();
  for (const d of docs) d.querySelectorAll('div[id^="p"]').forEach(p => {
    if (!/^p\d+$/.test(p.id) || seen.has(p.id)) return; seen.add(p.id);
    const name = autor(p), c = p.querySelector('.postbody .content') || p.querySelector('.content');
    if (!name || !c) return;
    const k = norm(name), e = out[k] || (out[k] = [name, 0, 0]);
    e[1]++; if (woerter(c) >= CFG.woerter) e[2]++;
  });
  return out;
}
/* Themen einer Forenseite mit Nummer des letzten Beitrags (aendert sich, sobald jemand antwortet) */
function themenAuf(d, ziel) {
  d.querySelectorAll('a.topictitle-custom, a.topictitle').forEach(a => {
    const href = pfad(a.getAttribute('href')), tid = idOf(href, 't');
    if (!tid || ziel.has(tid)) return;
    const row = a.closest('li, tr, dl') || a.parentElement;
    let last = null;
    if (row) row.querySelectorAll('a[href*="#"]').forEach(l => { const m = pfad(l.getAttribute('href')).match(new RegExp('^/t' + tid + '\\D.*#(\\d+)$')); if (m) last = Math.max(last || 0, +m[1]); });
    const ua = row ? row.querySelector('a[href*="/u"]') : null, um = ua ? pfad(ua.getAttribute('href')).match(/^\/u(\d+)/) : null;
    ziel.set(tid, { href: href.replace(/#.*$/, ''), title: a.textContent.trim(), last, uid: um ? um[1] : '' });
  });
}

async function struktur(cache) {
  if (!KOMPLETT && cache.struktur && Date.now() - cache.struktur.at < CFG.strukturStunden * 36e5) return cache.struktur.foren;
  log('Lese die Liste der Foren ...');
  const cat = await get(CFG.category);
  const queue = [...cat.querySelectorAll('#page-body a.forumtitle, #page-body a.forumtitleUF')].map(a => ({ href: pfad(a.getAttribute('href')), name: a.textContent.trim(), archiv: false }));
  if (!queue.length) throw new Error('Auf der Kategorieseite wurden keine Foren gefunden. Hat Forumieren den Abruf blockiert?');
  const foren = {};
  while (queue.length) {
    const f = queue.shift(), fid = idOf(f.href, 'f');
    if (!fid || foren[fid]) continue;
    f.archiv = f.archiv || CFG.archiv.test(f.name);
    foren[fid] = f;
    const d = await get(f.href);
    d.querySelectorAll('ul.forumsUF a.forumtitleUF, ul.forums a.forumtitle').forEach(a => queue.push({ href: pfad(a.getAttribute('href')), name: a.textContent.trim(), archiv: f.archiv }));
  }
  cache.struktur = { at: Date.now(), foren };
  return foren;
}

async function sammeln() {
  let cache = {};
  if (!KOMPLETT) { try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) { cache = {}; } }
  if (cache.w !== CFG.woerter) cache.themen = {};   /* andere Wortgrenze: alles neu zaehlen */
  cache.w = CFG.woerter; cache.themen = cache.themen || {};
  const foren = await struktur(cache);
  const archivForen = Object.values(foren).filter(f => f.archiv);
  log(Object.keys(foren).length + ' Foren, davon ' + archivForen.length + ' Szenenarchive');

  // 1) Szenen in den Archiven
  const themen = new Map();
  for (const f of archivForen) for (const d of await alleSeiten(f.href, 'f')) themenAuf(d, themen);
  if (!themen.size && Object.keys(cache.themen).length > 5) throw new Error('In den Archiven wurden keine Szenen gefunden, vorher waren es ' + Object.keys(cache.themen).length + '. Alter Stand bleibt stehen.');

  // 2) Beitraege zaehlen: nur neue oder veraenderte Szenen
  const todo = [...themen].filter(([tid, t]) => { const c = cache.themen[tid]; return !c || t.last === null || c.last !== t.last; });
  log(themen.size + ' archivierte Szenen, davon ' + todo.length + ' neu oder veraendert');
  for (const [tid, t] of todo) {
    try { cache.themen[tid] = { last: t.last, p: zaehlen(await alleSeiten(t.href, 't')) }; }
    catch (e) { log('Szene ' + tid + ' nicht lesbar: ' + e.message); }
  }
  Object.keys(cache.themen).forEach(tid => { if (!themen.has(+tid)) delete cache.themen[tid]; });

  // 3) Trainingsbuecher
  const buecher = new Map();
  for (const d of await alleSeiten(CFG.buecher, 'f')) themenAuf(d, buecher);

  const daten = {
    v: 1, stand: Date.now(), w: CFG.woerter,
    archiv: [...themen.keys()].sort((a, b) => a - b),
    zaehl: Object.fromEntries(Object.entries(cache.themen).map(([tid, c]) => [tid, c.p])),
    buecher: [...buecher.values()].map(b => [b.href, b.title, b.uid])
  };
  return { cache, daten };
}

const { cache, daten } = await sammeln();
fs.writeFileSync(CACHE, JSON.stringify(cache));
const json = JSON.stringify(daten).replace(/</g, '\\u003c').replace(/[\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
fs.writeFileSync(OUT, '/* Automatisch erzeugt (GitHub Actions, stuendlich). Stand: ' + new Date(daten.stand).toLocaleString('de-DE') + '. Nicht von Hand bearbeiten. */\n'
  + '(function (d) { var o = window.TES_FORUMDATEN; if (!o || !o.stand || d.stand >= o.stand) window.TES_FORUMDATEN = d; })(' + json + ');\n');
log('Fertig: ' + daten.archiv.length + ' archivierte Szenen, ' + daten.buecher.length + ' Trainingsbuecher, ' + abrufe + ' Seitenabrufe.');
