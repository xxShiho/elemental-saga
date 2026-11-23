/* The Elemental Saga - Achievements-Wochenauswertung fuer GitHub Actions.
   Liest den RPG-Bereich wie ein Gast (nur neue oder veraenderte Themen, der Rest kommt aus achievements/cache.json),
   rechnet bis zum letzten Sonntag 0:00 Uhr (Zeitzone Europe/Berlin) und schreibt achievements-data.js.
   Gleiche Rechnung wie runAchievements() in der HTML-Seite. Umgebung: KOMPLETT=true liest alles neu. */
process.env.TZ = process.env.TZ || 'Europe/Berlin';
import { parseHTML } from 'linkedom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CFG = {
  base: process.env.FORUM || 'https://the-elemental-saga.forumieren.de',
  category: '/c3-rpg-bereich',   // Kategorie, deren Foren (inkl. Unterforen) zaehlen
  excludeTopics: [],             // Themen-IDs, die nicht zaehlen, z. B. [67, 80]
  delay: +(process.env.PAUSE || 600)   // Pause zwischen Seitenabrufen (ms), schont das Forum
};
const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const CACHE = path.join(HIER, 'cache.json');
const OUT = path.join(REPO, 'achievements-data.js');
const KOMPLETT = /^(1|true|ja)$/i.test(process.env.KOMPLETT || '');

const STAT_KEYS = ['RPG-Beitr\u00e4ge', 'Treue Seele (Monate in Folge)', 'L\u00e4ngste Tagesserie', 'Mitspieler', 'Regionen', 'L\u00e4ngster Beitrag (Worte)',
  'Abgeschlossene Szenen', 'Schnelle Antworten', 'Seelenverwandte (Szenen)', 'Jahre dabei',
  'Beitr\u00e4ge letzter Monat', 'Neue Szenen letzter Monat', 'Abgeschlossene Szenen letzter Monat', 'Beitr\u00e4ge dieser Monat'];

/* Stichtag: der letzte Sonntag, 0:00 Uhr */
const CUT = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime(); })();

function altesErgebnis() {
  try { const t = fs.readFileSync(OUT, 'utf8'), m = t.match(/\}\)\((\{[\s\S]*\})\);\s*$/) || t.match(/ACH_DATA\s*=\s*(\{[\s\S]*\});/); return m ? JSON.parse(m[1]) : null; } catch (e) { return null; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('[Achievements]', ...a);
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
const MON = { jan: 0, feb: 1, 'm\u00e4r': 2, mrz: 2, mar: 2, apr: 3, mai: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dez: 11 };
function parseDate(txt) {
  const now = new Date(), t = txt.replace(/\s+/g, ' ');
  let m = t.match(/(Heute|Gestern) um (\d(?:\d)?):(\d\d)/);
  if (m) { const d = new Date(now); if (m[1] === 'Gestern') d.setDate(d.getDate() - 1); d.setHours(+m[2], +m[3], 0, 0); return d; }
  m = t.match(/(\d(?:\d)?)\.? ([A-Za-z\u00e4\u00c4][A-Za-z\u00e4\u00c4][A-Za-z\u00e4\u00c4])[a-z\u00e4]*\.? (\d\d\d\d) - (\d(?:\d)?):(\d\d)/);
  if (m && MON[m[2].toLowerCase()] !== undefined) return new Date(+m[3], MON[m[2].toLowerCase()], +m[1], +m[4], +m[5]);
  return null;
}
/* Farbe wie im Browser (style.color) als rgb(r, g, b) */
function farbe(el) {
  if (!el) return '';
  const m = (el.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i); if (!m) return '';
  const c = m[1].replace(/!important/i, '').trim();
  let h = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (h) { let x = h[1]; if (x.length === 3) x = x.replace(/./g, z => z + z); return 'rgb(' + [0, 2, 4].map(i => parseInt(x.substr(i, 2), 16)).join(', ') + ')'; }
  h = c.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
  return h ? 'rgb(' + h[1] + ', ' + h[2] + ', ' + h[3] + ')' : c;
}
const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const monKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

async function auswerten() {
  // 1) Foren der Kategorie samt Unterforen einsammeln
  log('Lese Foren ...');
  const cat = await get(CFG.category);
  const forums = new Map();
  const queue = [...cat.querySelectorAll('#page-body a.forumtitle, #page-body a.forumtitleUF')]
    .map(a => ({ href: pfad(a.getAttribute('href')), name: a.textContent.trim(), nation: a.textContent.trim() }));
  if (!queue.length) throw new Error('Auf der Kategorieseite wurden keine Foren gefunden. Hat Forumieren den Abruf blockiert?');
  const topics = new Map();
  while (queue.length) {
    const f = queue.shift(), fid = idOf(f.href, 'f');
    if (!fid || forums.has(fid)) continue;
    forums.set(fid, f);
    log('Lese Forum ' + f.name + ' ...');
    const first = await get(f.href), docs = [first];
    for (const u of pageUrls(first, f.href, 'f')) docs.push(await get(u));
    for (const d of docs) {
      d.querySelectorAll('ul.forumsUF a.forumtitleUF, ul.forums a.forumtitle').forEach(a =>
        queue.push({ href: pfad(a.getAttribute('href')), name: a.textContent.trim(), nation: f.nation }));
      d.querySelectorAll('a.topictitle-custom, a.topictitle').forEach(a => {
        const href = pfad(a.getAttribute('href')), tid = idOf(href, 't');
        if (!tid || topics.has(tid) || CFG.excludeTopics.includes(tid)) return;
        const row = a.closest('li') || a.parentElement;
        let last = null;
        if (row) row.querySelectorAll('a[href*="#"]').forEach(l => { const m = pfad(l.getAttribute('href')).match(new RegExp('^/t' + tid + '\\D.*#(\\d+)$')); if (m) last = Math.max(last || 0, +m[1]); });
        topics.set(tid, { href: href.replace(/#.*$/, ''), forum: fid, last });
      });
    }
  }

  // 2) Nur neue oder veraenderte Themen einlesen
  let store = {};
  if (!KOMPLETT) { try { store = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) { store = {}; } }
  topics.forEach((t, tid) => { if (store[tid] && store[tid].f === undefined && store[tid].last === t.last) store[tid].f = t.forum; });
  const todo = [...topics].filter(([tid, t]) => !store[tid] || t.last === null || store[tid].last !== t.last || store[tid].f !== t.forum);
  log(topics.size + ' Themen, davon ' + todo.length + ' neu oder veraendert');
  const catId = CFG.category.replace(/-.*/, '');
  for (const [tid, t] of todo) {
    const first = await get(t.href), docs = [first];
    const crumbsAll = [...first.querySelectorAll('.breadcrumb-nav a')];
    if (!crumbsAll.some(a => pfad(a.getAttribute('href')).indexOf(catId + '-') === 0)) { store[tid] = { last: t.last, f: t.forum, skip: 1 }; continue; }
    const crumbs = crumbsAll.filter(a => /^\/f/.test(pfad(a.getAttribute('href'))));
    const entry = { last: t.last, f: t.forum, nation: crumbs[0] ? crumbs[0].textContent.trim() : (forums.get(t.forum) || {}).nation, archived: crumbs.some(a => /archiv/i.test(a.textContent)) ? 1 : 0, p: [] };
    for (const u of pageUrls(first, t.href, 't')) docs.push(await get(u));
    const seen = new Set();
    for (const d of docs) d.querySelectorAll('div.post[id^="p"]').forEach(p => {
      if (seen.has(p.id)) return; seen.add(p.id);
      const au = p.querySelector('.postbody p.author'); if (!au) return;
      const ua = [...au.querySelectorAll('a[href]')].filter(a => /^\/u\d/.test(pfad(a.getAttribute('href'))))[0];
      const name = (ua ? ua.textContent : au.textContent.replace(/^.*?von\s*/, '').split(/\s+(Mo|Di|Mi|Do|Fr|Sa|So|Heute|Gestern)\b/)[0]).trim();
      const date = parseDate(au.textContent); if (!name || !date) return;
      const c = p.querySelector('.content'), av = p.querySelector('.postprofile dt img'), col = ua && ua.querySelector('[style*="color"]');
      let words = 0;
      if (c) { const k = c.cloneNode(true); k.querySelectorAll('blockquote, .signature_div, .codebox').forEach(e => e.remove()); words = k.textContent.trim().split(/\s+/).filter(Boolean).length; }
      const uid = ua ? +((pfad(ua.getAttribute('href')).match(/^\/u(\d+)/) || [])[1] || 0) : 0;
      entry.p.push([date.getTime(), name, words, farbe(col), av ? av.getAttribute('src') : '', uid]);
    });
    store[tid] = entry;
  }
  Object.keys(store).forEach(tid => { if (!topics.has(+tid)) delete store[tid]; });
  const posts = [];
  for (const [tid, e] of Object.entries(store)) {
    if (e.skip) continue;
    e.p.forEach(q => q[0] < CUT && posts.push({ topic: +tid, nation: e.nation, archived: !!e.archived, date: new Date(q[0]), name: q[1], words: q[2], color: q[3], ava: q[4], uid: q[5] || 0 }));
  }
  const topicCount = Object.values(store).filter(e => !e.skip).length;
  log(posts.length + ' Beitraege, werte aus ...');

  // 3) Auswerten
  const users = new Map(), topicAuthors = new Map();
  for (const p of posts) {
    if (!users.has(p.name)) users.set(p.name, { name: p.name, posts: 0, days: new Set(), months: new Set(), nations: new Set(), topics: new Set(), monthCount: {} });
    const u = users.get(p.name);
    if (p.ava) u.ava = p.ava; if (p.color) u.color = p.color; if (p.uid) u.uid = p.uid;
    u.maxWords = Math.max(u.maxWords || 0, p.words);
    u.posts++; u.days.add(dayKey(p.date)); u.months.add(monKey(p.date)); u.topics.add(p.topic);
    u.monthCount[monKey(p.date)] = (u.monthCount[monKey(p.date)] || 0) + 1;
    if (p.nation) u.nations.add(p.nation);
    if (!topicAuthors.has(p.topic)) topicAuthors.set(p.topic, new Set());
    topicAuthors.get(p.topic).add(p.name);
  }
  const tinfo = new Map();
  for (const p of posts) {
    const t = tinfo.get(p.topic) || { first: p, last: p, archived: p.archived };
    if (p.date < t.first.date) t.first = p; if (p.date > t.last.date) t.last = p;
    tinfo.set(p.topic, t);
  }
  const today = new Date(CUT - 1); today.setHours(0, 0, 0, 0);
  const shift = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
  const prev = (k, next) => next(k, -1);
  function runs(keys, next) {
    let best = 0;
    for (const k of keys) { if (keys.has(prev(k, next))) continue; let len = 0, c = k; while (keys.has(c)) { len++; c = next(c, 1); } best = Math.max(best, len); }
    return best;
  }
  const nextDay = (k, s) => dayKey(shift(new Date(k + 'T12:00'), s));
  const nextMon = (k, s) => { const [y, m] = k.split('-').map(Number); return monKey(new Date(y, m - 1 + s, 1)); };
  function current(keys, start, next) { let c = start, len = 0; if (!keys.has(c)) c = next(c, -1); while (keys.has(c)) { len++; c = next(c, -1); } return len; }
  const monStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const monEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMon = monKey(monStart), thisMon = monKey(today);
  const fmtD = d => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
  const period = monStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) + ' (' + fmtD(monStart) + ' \u2013 ' + fmtD(monEnd) + ')';
  const doneAll = {}, quick = {}, pair = {}, byTopic = new Map();
  posts.forEach(p => { if (!byTopic.has(p.topic)) byTopic.set(p.topic, []); byTopic.get(p.topic).push(p); });
  byTopic.forEach(list => {
    list.sort((x, y) => x.date - y.date);
    for (let i = 1; i < list.length; i++) if (list[i].name !== list[i - 1].name && list[i].date - list[i - 1].date <= 864e5) quick[list[i].name] = (quick[list[i].name] || 0) + 1;
    const who = [...new Set(list.map(p => p.name))];
    if (list[0].archived) who.forEach(n => doneAll[n] = (doneAll[n] || 0) + 1);
    who.forEach(x => who.forEach(y => { if (x !== y) { pair[x] = pair[x] || {}; pair[x][y] = (pair[x][y] || 0) + 1; } }));
  });
  const firstPost = {};
  posts.forEach(p => { if (!firstPost[p.name] || p.date < firstPost[p.name]) firstPost[p.name] = p.date; });
  const years = n => { const f = firstPost[n]; if (!f) return 0; let y = today.getFullYear() - f.getFullYear(); if (today.getMonth() < f.getMonth() || (today.getMonth() === f.getMonth() && today.getDate() < f.getDate())) y--; return Math.max(0, y); };
  const started = {}, finished = {};
  for (const [tid, t] of tinfo) {
    if (monKey(t.first.date) === lastMon) started[t.first.name] = (started[t.first.name] || 0) + 1;
    if (t.archived && monKey(t.last.date) === lastMon) topicAuthors.get(tid).forEach(n => finished[n] = (finished[n] || 0) + 1);
  }
  const rows = [...users.values()].map(u => {
    const partners = new Set(); u.topics.forEach(t => topicAuthors.get(t).forEach(a => a !== u.name && partners.add(a)));
    const r = {
      Name: u.name, 'RPG-Beitr\u00e4ge': u.posts,
      'Beitr\u00e4ge letzter Monat': u.monthCount[lastMon] || 0, 'Beitr\u00e4ge dieser Monat': u.monthCount[thisMon] || 0,
      'L\u00e4ngste Tagesserie': runs(u.days, nextDay), 'Aktuelle Tagesserie': current(u.days, dayKey(today), nextDay),
      'Neue Szenen letzter Monat': started[u.name] || 0, 'Abgeschlossene Szenen letzter Monat': finished[u.name] || 0,
      'Treue Seele (Monate in Folge)': runs(new Set([...u.months].filter(m => m !== thisMon)), nextMon),
      Mitspieler: partners.size, Regionen: u.nations.size, 'L\u00e4ngster Beitrag (Worte)': u.maxWords || 0,
      'Abgeschlossene Szenen': doneAll[u.name] || 0, 'Schnelle Antworten': quick[u.name] || 0,
      'Seelenverwandte (Szenen)': Math.max(0, ...Object.values(pair[u.name] || {})), 'Jahre dabei': years(u.name)
    };
    r._u = u;
    return r;
  }).sort((a, b) => b['RPG-Beitr\u00e4ge'] - a['RPG-Beitr\u00e4ge']);
  return {
    store,
    m: { v: 1, t: CUT, period, info: posts.length + ' Beitr\u00e4ge in ' + topicCount + (topicCount === 1 ? ' Thema' : ' Themen'),
      u: rows.map(r => [r.Name, r._u.color || '', r._u.ava || ''].concat(STAT_KEYS.map(k => r[k]), [r._u.uid || 0])) }
  };
}

const alt = altesErgebnis();
if (alt && alt.t === CUT && !KOMPLETT) { log('Der Stand vom ' + new Date(CUT).toLocaleDateString('de-DE') + ' ist schon da. Nichts zu tun.'); process.exit(0); }
const { store, m } = await auswerten();
if (!m.u.length && alt && alt.u && alt.u.length) throw new Error('Die Auswertung ergab keine Beitraege. Alter Stand bleibt stehen.');
fs.writeFileSync(CACHE, JSON.stringify(store));
const json = JSON.stringify(m).replace(/</g, '\\u003c').replace(/[\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
fs.writeFileSync(OUT, '/* Automatisch erzeugt (GitHub Actions). Stand: ' + new Date(CUT).toLocaleDateString('de-DE') + ', 0:00 Uhr. Nicht von Hand bearbeiten. */\n'
  + '(function (d) { var o = window.ACH_DATA; if (!o || !o.t || d.t >= o.t) window.ACH_DATA = d; })(' + json + ');\n');
log('Fertig: ' + m.info + ', ' + m.u.length + ' Mitglieder, ' + abrufe + ' Seitenabrufe.');
