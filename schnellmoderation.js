/* The Elemental Saga - Schnellmoderation: Leiste im Thema, Mehrfachauswahl in der Themenliste, Schnellziele */
/* Startet erst, wenn die Seite geladen ist. So ist TES_GEMEINSAM immer schon da, egal in welcher Reihenfolge die Module laden. */
(function (start) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); })(function () {
/* ===== Einstellungen: nur hier etwas ändern. Team und Archive kommen aus TES_GEMEINSAM ===== */
window.TES_MOD = {
  schattenthema: false,   /* true = beim Verschieben bleibt im alten Forum ein Hinweis-Link stehen */
  nativeAusblenden: true, /* die alte Moderationsauswahl unter dem Thema ausblenden */
  /* Zusätzliche Schnellziele: Forum-Nummer: [ [Beschriftung, Ziel-Forum, 'sperren' oder ''], ... ]
     "Ins Archiv" und "Ins Szenenarchiv" entstehen automatisch aus TES_GEMEINSAM.archiv */
  ziele: {
    8: [['Angenommen', 22, 'sperren'], ['Abgelehnt', 23, 'sperren']],
    9: [['Angenommen', 55, 'sperren'], ['Abgelehnt', 56, 'sperren']]
  }
};
/* ===== Ab hier nichts ändern ===== */
!function () {
  "use strict";
  var C = window.TES_MOD, GOLD = '#c2a75d', U = {};
  var G = window.TES_GEMEINSAM || {};
  if (!window.TES_GEMEINSAM) try { console.warn('[TES] TES_GEMEINSAM fehlt (ist das Modul auf allen Seiten aktiv?): Schnellmoderation ohne Archiv-Schnellziele.'); } catch (e) { e = null; }
  C.mods = (C.mods || []).concat(G.team || []);
  (function () {
    var inplay = [];
    Object.keys(G.inplay || {}).forEach(function (k) { inplay = inplay.concat(G.inplay[k]); });
    Object.keys(G.archiv || {}).forEach(function (f) {
      var list = C.ziele[f] || (C.ziele[f] = []);
      if (!list.some(function (z) { return z[1] === G.archiv[f]; })) list.unshift([inplay.indexOf(+f) > -1 ? 'Ins Szenenarchiv' : 'Ins Archiv', G.archiv[f], 'sperren']);
    });
  })();
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); };
  var parse = function (h) { return new DOMParser().parseFromString(h, 'text/html'); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var path = function (h) { return String(h || '').replace(/^https?:[/][/][^/]+/i, ''); };

  function isMod() {
    if (U.session_logged_in != 1) return false;
    if (U.user_level == 1 || U.user_level == 2) return true;
    if ((C.mods || []).map(norm).indexOf(norm(U.username)) > -1) return true;
    return !!document.querySelector('fieldset.quickmod, a[href*="/modcp?mode="]');
  }
  function tidValue() {
    var i = document.querySelector('input[name="tid"]');
    if (i && i.value) return i.value;
    var links = document.querySelectorAll('a[href*="tid="]');
    for (var k = 0; k < links.length; k++) { var m = links[k].getAttribute('href').match(/[?&;]tid=([0-9a-f]{8,})/i); if (m) return m[1]; }
    return '';
  }
  function topicIdHere() { var m = location.pathname.match(/^[/]t([0-9]+)(?:p[0-9]+)?-/); return m ? +m[1] : 0; }
  function forumIdHere() {
    var m = location.pathname.match(/^[/]f([0-9]+)(?:p[0-9]+)?-/);
    if (m) return +m[1];
    var nt = document.querySelector('a[href*="mode=newtopic"]');
    if (nt) { m = nt.getAttribute('href').match(/[?&;]f=([0-9]+)/); if (m) return +m[1]; }
    var crumbs = document.querySelectorAll('.breadcrumb-nav a.nav[href], .NavigationUF a.nav[href], a.nav[href]');
    for (var i = crumbs.length - 1; i >= 0; i--) { m = path(crumbs[i].getAttribute('href')).match(/^[/]f([0-9]+)-/); if (m) return +m[1]; }
    return 0;
  }

  /* Forenliste aus der "Gehe zu"-Auswahl */
  function forumList() {
    var sel = document.querySelector('select[name="selected_id"]'), out = [], stack = [];
    if (!sel) return out;
    Array.prototype.forEach.call(sel.options, function (o) {
      var m = String(o.value).match(/^([cf])([0-9]+)$/);
      if (!m) return;
      var raw = o.textContent.replace(/\u00a0/g, ' '), dash = raw.indexOf('--'), depth = dash < 0 ? 0 : Math.max(0, Math.round((dash - 1) / 4));
      var name = raw.replace(/^[\s|]*-*/, '').trim();
      stack[depth] = name; stack.length = depth + 1;
      out.push({ cat: m[1] === 'c', id: +m[2], name: name, depth: depth, label: depth >= 2 ? stack[depth - 1] + ' › ' + name : name });
    });
    return out;
  }
  function forumName(id) { var f = forumList().filter(function (x) { return !x.cat && x.id === id; })[0]; return f ? f.label : 'f' + id; }
  function moveSelect(current) {
    var h = '<select class="tm-to"><option value="">Verschieben nach …</option>', open = false;
    forumList().forEach(function (f) {
      if (f.cat) { if (open) h += '</optgroup>'; h += '<optgroup label="' + esc(f.name) + '">'; open = true; return; }
      h += '<option value="' + f.id + '"' + (f.id === current ? ' disabled' : '') + '>' + esc(f.label) + '</option>';
    });
    return h + (open ? '</optgroup>' : '') + '</select>';
  }

  /* ---------- Moderation ausführen ---------- */
  var LABEL = { lock: 'Sperren', unlock: 'Entsperren', sticky: 'Wichtig', announce: 'Ankündigung', normal: 'Normal', move: 'Verschieben', trash: 'In den Papierkorb verschieben', delete: 'Löschen' };
  function messageOf(d) {
    var el = d.querySelector('#page-body .panel .inner, #page-body .panel, .message, .main-content, #page-body p');
    return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 240) : '';
  }
  function formData(form, target, pick) {
    var fd = new FormData();
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      var t = (el.type || '').toLowerCase();
      if (t === 'submit' || t === 'button' || t === 'image' || t === 'reset' || t === 'file') return;
      if (t === 'checkbox' || t === 'radio') {
        var on = el.hasAttribute('checked');
        if (/shadow|schatten/i.test(el.name)) on = !!C.schattenthema;
        if (on) fd.append(el.name, el.value || 'on');
        return;
      }
      if (el.tagName === 'SELECT') {
        var v = '';
        if (target) Array.prototype.forEach.call(el.options, function (o) { if (String(o.value).replace(/^f/, '') === String(target)) v = o.value; });
        if (!v) { var s = el.querySelector('option[selected]') || el.options[0]; v = s ? s.value : ''; }
        fd.append(el.name, v);
        return;
      }
      fd.append(el.name, el.value);
    });
    if (pick) fd.append(pick.name, pick.value);
    return fd;
  }
  /* Bestätigungsseiten (Löschen, Verschieben ...) selbst durchklicken */
  function confirmStep(d) {
    var forms = Array.prototype.filter.call(d.querySelectorAll('form'), function (f) {
      var a = f.getAttribute('action') || '';
      return /modcp|merge|post/i.test(a) && (f.getAttribute('method') || '').toLowerCase() === 'post' && !f.closest('#quick_reply') && f.name !== 'jumpbox';
    });
    for (var i = 0; i < forms.length; i++) {
      var subs = Array.prototype.filter.call(forms[i].querySelectorAll('input[type=submit], button[type=submit], button:not([type])'), function (b) { return !/^(nein|no|abbrechen|cancel|zurück)$/i.test((b.value || b.textContent || '').trim()) && !/cancel/i.test(b.name || ''); });
      var pick = subs.filter(function (b) { return b.name === 'confirm'; })[0] || subs[0];
      if (pick) return { form: forms[i], pick: { name: pick.name || 'confirm', value: pick.value || pick.textContent || 'Ja' } };
    }
    return null;
  }
  async function send(url, fd) {
    var r = await fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' });
    return parse(await r.text());
  }
  async function run(action, ids, forum, target) {
    var tid = tidValue();
    if (!tid) throw new Error('Kein Sicherheitsschlüssel (tid) gefunden. Bist du eingeloggt?');
    var fd = new FormData();
    fd.append('tid', tid); fd.append('f', String(forum));
    ids.forEach(function (id) { fd.append('topic_id_list[]', String(id)); });
    fd.append(action, LABEL[action]);
    var d = await send('/modcp?tid=' + tid, fd);
    for (var step = 0; step < 3; step++) {
      var c = confirmStep(d);
      if (!c) break;
      var act = c.form.getAttribute('action') || '/modcp';
      d = await send(act, formData(c.form, target, c.pick));
    }
    var msg = messageOf(d);
    if (/keine berechtigung|nicht berechtigt|nicht erlaubt|fehler|error|ungültig/i.test(msg)) throw new Error(msg);
    return msg;
  }
  async function doAll(job, ids, forum, done) {
    try {
      if (job.lock) { busy('Wird gesperrt …'); await run('lock', ids, forum); }
      busy(job.text || 'Einen Moment …');
      await run(job.action, ids, forum, job.target);
      toast(done, true);
      setTimeout(function () { if (job.after) location.href = job.after; else location.reload(); }, 900);
    } catch (e) {
      toast('Hat nicht geklappt: ' + esc(e.message || e), false);
    }
  }

  /* ---------- Aussehen ---------- */
  function css() {
    if (document.getElementById('tm-css')) return;
    var s = document.createElement('style');
    s.id = 'tm-css';
    s.textContent = [
      '.tm-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:10px 0 14px;padding:9px 12px;border:1px solid rgba(194,167,93,.35);border-radius:12px;background:#0a0d0d;font:13px/1.4 Inter,sans-serif;color:#e2dac3}',
      '.tm-bar .tm-k{margin-right:4px;font:.62rem "Bruno Ace SC",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(194,167,93,.8)}',
      '.tm-bar .tm-sep{width:1px;height:20px;margin:0 4px;background:rgba(194,167,93,.2)}',
      '.tm-b{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border:1px solid rgba(194,167,93,.4);border-radius:14px;background:rgba(194,167,93,.06);color:#e2dac3;font:12.5px Inter,sans-serif;cursor:pointer;white-space:nowrap;text-decoration:none}',
      '.tm-b:hover{border-color:' + GOLD + ';background:rgba(194,167,93,.14);color:#f5ecd0}',
      '.tm-b.gold{border-color:' + GOLD + ';color:' + GOLD + '}',
      '.tm-b.red{border-color:rgba(226,115,95,.55);color:#f0a090}',
      '.tm-b.red:hover{background:rgba(226,115,95,.14)}',
      '.tm-b:disabled{opacity:.45;cursor:default}',
      '.tm-seg{display:inline-flex;border:1px solid rgba(194,167,93,.4);border-radius:14px;overflow:hidden}',
      '.tm-seg .tm-b{border:0;border-radius:0}',
      '.tm-seg .tm-b+.tm-b{border-left:1px solid rgba(194,167,93,.25)}',
      '.tm-to{max-width:230px;padding:4px 8px;border:1px solid rgba(194,167,93,.4);border-radius:14px;background:#050707;color:#e2dac3;font:12.5px Inter,sans-serif}',
      '.tm-more{position:relative}',
      '.tm-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:99990;display:none;min-width:190px;padding:6px;border:1px solid rgba(194,167,93,.4);border-radius:10px;background:#0a0c0b;box-shadow:0 8px 24px rgba(0,0,0,.5)}',
      '.tm-menu.on{display:block}',
      '.tm-menu a{display:block;padding:6px 10px;border-radius:6px;color:#e2dac3;font:12.5px Inter,sans-serif;text-decoration:none}',
      '.tm-menu a:hover{background:rgba(194,167,93,.12)}',
      '.tm-ask{display:inline-flex;align-items:center;gap:6px;color:#f0a090;font-size:12.5px}',
      '.tm-hide{display:none !important}',
      '.tm-chk{position:absolute;left:6px;top:6px;z-index:5;width:20px;height:20px;margin:0;border:1px solid rgba(194,167,93,.6);border-radius:5px;background:rgba(5,7,7,.85);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#050707;font:700 13px Inter,sans-serif;line-height:1}',
      '.tm-chk.on{background:' + GOLD + ';border-color:' + GOLD + '}',
      '.tm-sel{outline:1px solid ' + GOLD + ' !important;outline-offset:-1px;background-color:rgba(194,167,93,.07) !important}',
      '#tm-float{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99985;display:none;max-width:calc(100vw - 24px);margin:0;box-shadow:0 8px 30px rgba(0,0,0,.6)}',
      '#tm-float.on{display:flex}',
      '#tm-float .tm-n{font-weight:600;color:#efe3bd}',
      '#tm-toast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99995;max-width:90vw;padding:8px 18px;border:1px solid rgba(194,167,93,.55);border-radius:18px;background:rgba(5,7,7,.96);color:#efe3bd;font:13.5px Inter,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5)}',
      '#tm-toast.bad{border-color:rgba(226,115,95,.6);color:#f0a090}',
      '#tm-all{display:inline-flex;align-items:center;gap:6px;margin:6px 0;cursor:pointer;color:rgba(226,218,195,.7);font:12.5px Inter,sans-serif}',
      '@media (max-width:640px){.tm-bar{gap:5px;padding:8px}.tm-b{padding:4px 9px;font-size:12px}.tm-to{max-width:160px}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  var toastTimer = null;
  function toast(html, ok) {
    var t = document.getElementById('tm-toast');
    if (!t) { t = document.createElement('div'); t.id = 'tm-toast'; document.body.appendChild(t); }
    t.className = ok === false ? 'bad' : '';
    t.innerHTML = html;
    clearTimeout(toastTimer);
    if (ok !== null) toastTimer = setTimeout(function () { t.remove(); }, ok === false ? 7000 : 3000);
  }
  function busy(text) { toast('⏳ ' + esc(text), null); }

  /* Gemeinsame Bedienelemente für Leiste und Auswahlleiste */
  function controls(forum, opts) {
    var h = '';
    h += '<button type="button" class="tm-b" data-x="lock">???? Sperren</button><button type="button" class="tm-b" data-x="unlock">???? Entsperren</button>';
    h += '<span class="tm-seg"><button type="button" class="tm-b" data-x="normal">Normal</button><button type="button" class="tm-b" data-x="sticky">Wichtig</button><button type="button" class="tm-b" data-x="announce">Ankündigung</button></span>';
    h += '<span class="tm-sep"></span>';
    (C.ziele[forum] || []).forEach(function (z, i) { h += '<button type="button" class="tm-b gold" data-z="' + i + '" title="' + esc((z[2] ? 'Sperren und ' : '') + 'nach „' + forumName(z[1]) + '“ verschieben') + '">➜ ' + esc(z[0]) + '</button>'; });
    h += moveSelect(forum) + '<button type="button" class="tm-b" data-x="move">Verschieben</button>';
    h += '<span class="tm-sep"></span><button type="button" class="tm-b" data-x="trash">???? Papierkorb</button><button type="button" class="tm-b red" data-x="delete">Löschen</button>';
    if (opts && opts.more) h += opts.more;
    return h;
  }
  function wire(box, forum, getIds, after) {
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-x], [data-z], [data-ok], [data-no], .tm-more > .tm-b');
      if (!b || !box.contains(b)) return;
      if (b.parentNode.classList.contains('tm-more')) { b.nextElementSibling.classList.toggle('on'); return; }
      var ids = getIds();
      if (!ids.length) return toast('Bitte zuerst Themen auswählen.', false);
      var n = ids.length === 1 ? 'Thema' : ids.length + ' Themen';
      if (b.hasAttribute('data-no')) { var ask = b.closest('.tm-ask'); ask.previousElementSibling.classList.remove('tm-hide'); ask.remove(); return; }
      if (b.hasAttribute('data-z')) {
        var z = C.ziele[forum][+b.getAttribute('data-z')];
        return doAll({ action: 'move', target: z[1], lock: !!z[2], text: 'Wird nach „' + forumName(z[1]) + '“ verschoben …' }, ids, forum, '✓ ' + n + ' nach „' + esc(forumName(z[1])) + '“ verschoben' + (z[2] ? ' und gesperrt' : '') + '.');
      }
      var a = b.getAttribute('data-x') || b.getAttribute('data-ok');
      if (a === 'move') {
        var to = +(box.querySelector('.tm-to') || {}).value;
        if (!to) return toast('Bitte erst ein Ziel-Forum auswählen.', false);
        return doAll({ action: 'move', target: to, text: 'Wird verschoben …' }, ids, forum, '✓ ' + n + ' nach „' + esc(forumName(to)) + '“ verschoben.');
      }
      if ((a === 'delete' || a === 'trash') && !b.hasAttribute('data-ok')) {
        b.classList.add('tm-hide');
        b.insertAdjacentHTML('afterend', '<span class="tm-ask">' + (a === 'delete' ? n + ' endgültig löschen?' : n + ' in den Papierkorb?') + ' <button type="button" class="tm-b red" data-ok="' + a + '">Ja</button><button type="button" class="tm-b" data-no="1">Nein</button></span>');
        return;
      }
      var done = { lock: 'gesperrt', unlock: 'entsperrt', normal: 'auf Normal gesetzt', sticky: 'als Wichtig markiert', announce: 'als Ankündigung markiert', trash: 'in den Papierkorb verschoben', delete: 'gelöscht' }[a];
      doAll({ action: a, text: LABEL[a] + ' …', after: (a === 'delete' || a === 'trash') && after ? after : '' }, ids, forum, '✓ ' + n + ' ' + done + '.');
    });
    document.addEventListener('click', function (ev) { if (!ev.target.closest('.tm-more')) box.querySelectorAll('.tm-menu.on').forEach(function (m) { m.classList.remove('on'); }); });
  }

  /* ---------- Im Thema ---------- */
  function topicBar() {
    var t = topicIdHere(), f = forumIdHere(), tid = tidValue();
    if (!t || !f || document.getElementById('tm-topic')) return;
    var h1 = document.querySelector('h1.page-title');
    if (!h1) return;
    css();
    var locked = !!document.querySelector('a[href*="mode=unlock"]');
    var more = '<span class="tm-more"><button type="button" class="tm-b">Mehr ▾</button><div class="tm-menu">' +
      '<a href="/modcp?mode=split&amp;t=' + t + '&amp;tid=' + tid + '">Thema teilen</a>' +
      '<a href="/merge?t=' + t + '&amp;tid=' + tid + '">Themen zusammenführen</a>' +
      '<a href="/modcp?f=' + f + '&amp;tid=' + tid + '">Ganzes Forum moderieren</a></div></span>';
    var bar = document.createElement('div');
    bar.className = 'tm-bar'; bar.id = 'tm-topic';
    bar.innerHTML = '<span class="tm-k">Moderation</span>' + controls(f, { more: more });
    if (locked) bar.querySelector('[data-x=lock]').classList.add('tm-hide'); else if (document.querySelector('a[href*="mode=lock"]')) bar.querySelector('[data-x=unlock]').classList.add('tm-hide');
    var anchor = h1.parentNode.querySelector('.topic-actions') || h1;
    anchor.parentNode.insertBefore(bar, anchor.nextSibling);
    wire(bar, f, function () { return [t]; }, '/f' + f + '-');
    if (C.nativeAusblenden) {
      document.querySelectorAll('fieldset.quickmod').forEach(function (q) { (q.closest('form') || q).classList.add('tm-hide'); });
      document.querySelectorAll('a.btn-flat[href*="/modcp?mode="], a.btn-flat[href*="/merge?"]').forEach(function (a) { var p = a.closest('p'); if (p) p.classList.add('tm-hide'); });
    }
  }

  /* ---------- In der Themenliste eines Forums ---------- */
  function forumTools() {
    var f = forumIdHere();
    if (!f || !/^[/]f[0-9]+/.test(location.pathname) || document.getElementById('tm-float')) return;
    var rows = Array.prototype.filter.call(document.querySelectorAll('.topiclist.topics li.row-custom, .topiclist.topics li.row'), function (r) { return r.querySelector('a.topictitle-custom[href], a.topictitle[href]'); });
    if (!rows.length) return;
    css();
    var sel = {};
    function count() { return Object.keys(sel).length; }
    var bar = document.createElement('div');
    bar.className = 'tm-bar'; bar.id = 'tm-float';
    bar.innerHTML = '<span class="tm-n"></span><span class="tm-sep"></span>' + controls(f) + '<button type="button" class="tm-b" data-clear="1" title="Auswahl aufheben">✕</button>';
    document.body.appendChild(bar);
    function update() {
      var n = count();
      bar.classList.toggle('on', n > 0);
      bar.querySelector('.tm-n').textContent = n + (n === 1 ? ' Thema' : ' Themen');
      var all = document.getElementById('tm-all');
      if (all) all.querySelector('.tm-chk').classList.toggle('on', n === rows.length);
    }
    rows.forEach(function (row) {
      var a = row.querySelector('a.topictitle-custom[href], a.topictitle[href]'), m = path(a.getAttribute('href')).match(/^[/]t([0-9]+)/);
      if (!m) return;
      var id = +m[1];
      if (getComputedStyle(row).position === 'static') row.style.position = 'relative';
      var c = document.createElement('span');
      c.className = 'tm-chk'; c.title = 'Auswählen'; c.setAttribute('role', 'checkbox');
      c.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        if (sel[id]) delete sel[id]; else sel[id] = 1;
        c.classList.toggle('on', !!sel[id]); c.textContent = sel[id] ? '✓' : '';
        row.classList.toggle('tm-sel', !!sel[id]);
        update();
      });
      row.appendChild(c);
      row._tm = { id: id, c: c };
    });
    var first = rows[0].closest('.forumbg, .forabg, ul') || rows[0].parentNode;
    var all = document.createElement('label');
    all.id = 'tm-all';
    all.innerHTML = '<span class="tm-chk" style="position:static"></span>Alle Themen dieser Seite auswählen';
    all.addEventListener('click', function (ev) {
      ev.preventDefault();
      var on = count() !== rows.length;
      rows.forEach(function (r) { if (!r._tm) return; if (on) sel[r._tm.id] = 1; else delete sel[r._tm.id]; r._tm.c.classList.toggle('on', on); r._tm.c.textContent = on ? '✓' : ''; r.classList.toggle('tm-sel', on); });
      update();
    });
    first.parentNode.insertBefore(all, first);
    bar.addEventListener('click', function (ev) {
      if (!ev.target.closest('[data-clear]')) return;
      rows.forEach(function (r) { if (!r._tm) return; r._tm.c.classList.remove('on'); r._tm.c.textContent = ''; r.classList.remove('tm-sel'); });
      sel = {}; update();
    });
    wire(bar, f, function () { return Object.keys(sel).map(Number); });
    update();
  }

  /* Für andere Scripts (Szenenübersicht, Team-Übersicht): Themen sperren und ins Archiv verschieben */
  window.TES_MOD_API = {
    run: run,
    archivieren: async function (ids, forum, target) {
      target = target || (G.archiv || {})[forum];
      if (!target) throw new Error('Für Forum f' + forum + ' ist kein Archiv eingetragen.');
      await run('lock', ids, forum);
      return run('move', ids, forum, target);
    }
  };
  function init() {
    U = window._userdata || {};
    if (!isMod() || /^[/](post|privmsg|admin|modcp|merge)/.test(location.pathname)) return;
    try { console.info('[Schnellmoderation] geladen · Forum f' + forumIdHere() + (topicIdHere() ? ' · Thema t' + topicIdHere() : '')); } catch (e) { e = null; }
    try { if (topicIdHere()) topicBar(); else forumTools(); } catch (e) { try { console.warn('[Schnellmoderation]', e); } catch (x) { x = null; } }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}();
});
