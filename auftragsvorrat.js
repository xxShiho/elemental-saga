/* The Elemental Saga - Auftragsvorrat: vorbereitete Aufträge per Knopfdruck ins Auftragsbrett stellen
   Einbinden: als JS-Modul "Auf allen Seiten" aktivieren (braucht tes-auftraege.js für die Ortsnamen).

   So geht es:
   - In den Vorrats-Themen (CFG.vorrat) stehen im ersten Beitrag beliebig viele [Auftrag]-Blöcke.
   - Admins und Moderatoren sehen unter jeder Auftragskarte den Knopf "Im Auftragsbrett veröffentlichen".
   - Ein Klick fragt nach, ein zweiter stellt den Auftrag als neues Thema ins Auftragsbrett:
     Titel = "Titel:" des Auftrags, Beschreibung = "Ort · offen" (bei Kampfaufträgen "Ort · offen · Kampf: Klasse").
   - Danach wird der Block aus dem Vorrats-Beitrag entfernt.
   - In der Teamzentrale erscheint im Reiter "Aufträge" ein Hinweis, sobald weniger als CFG.mindestOffen Aufträge offen sind.
     Ein Klick lädt den Vorrat, von dort lässt sich direkt veröffentlichen.
   Geprüft wird erst beim Klick, nicht beim Seitenaufruf. */
(function () {
  var CFG = {
    vorrat: [258, 259, 260, 261, 262, 263],   /* Themen mit vorbereiteten Aufträgen */
    /* volle Adressen der Vorrats-Themen (Kurzadressen öffnen bei Forumieren nicht) */
    pfade: ['/t259-auftrage-zhendao', '/t260-auftrage-norden', '/t263-auftrage-osten', '/t261-auftrage-westen', '/t262-auftrage-suden', '/t258-kampfauftrage'],
    ziel: 58,                                 /* Auftragsbrett */
    mindestOffen: 10                          /* darunter meldet die Teamzentrale "Vorrat nachlegen" */
  };

  var ud = window._userdata || {};
  var TEAM = ud.session_logged_in == 1 && (+ud.user_level === 1 || +ud.user_level === 2);
  var PFAD = location.pathname;
  var tidHier = +((PFAD.match(/^\/t(\d+)/) || [])[1] || 0);
  if (!TEAM) return;
  var VORRATSSEITE = CFG.vorrat.indexOf(tidHier) > -1 && !/^\/t\d+p\d+/.test(PFAD);

  var AB = /\[\s*auftrag\s*\]([\s\S]*?)\[\s*\/\s*auftrag\s*\]/gi;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var parse = function (t) { return new DOMParser().parseFromString(t, 'text/html'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var plain = function (s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, ''); };
  function feld(body, name) { var m = String(body || '').match(new RegExp('^[ \\t]*' + name + '[ \\t]*:[ \\t]*([^\\n]*)', 'im')); return m ? m[1].trim() : ''; }

  /* ---------- Forum ---------- */
  async function getText(url) { var r = await fetch(url, { credentials: 'same-origin' }); if (!r.ok) throw new Error('Seite nicht erreichbar (' + r.status + ')'); return r.text(); }
  async function formOf(url) {
    var f = parse(await getText(url)).querySelector('form[name=post]');
    if (!f) throw new Error('Das Schreib-Formular wurde nicht gefunden. Fehlen dir hier die Rechte?');
    return f;
  }
  function rohtext(f) { var ta = f.querySelector('textarea[name=message]'); return ta ? String(ta.value || ta.textContent || '').replace(/\r/g, '') : ''; }
  /* Formular abschicken wie der Browser. felder: { subject, description, message }, null = unverändert lassen */
  async function senden(formUrl, felder, say) {
    for (var n = 1; n <= 5; n++) {
      var f = await formOf(formUrl), fd = new FormData();
      f.querySelectorAll('input, select, textarea').forEach(function (el) {
        var t = (el.getAttribute('type') || '').toLowerCase();
        if (!el.name || el.disabled || el.name === 'message' || /^(submit|button|image|file|reset)$/.test(t)) return;
        if ((t === 'checkbox' || t === 'radio') && !el.checked) return;
        fd.append(el.name, el.tagName === 'TEXTAREA' ? (el.value || el.textContent || '') : el.value);
      });
      if (felder.subject != null) fd.set('subject', felder.subject);
      if (felder.description != null) {
        if (!f.querySelector('[name=description]')) throw new Error('Im Formular fehlt das Feld für die Themenbeschreibung.');
        fd.set('description', felder.description);
      }
      fd.set('message', felder.message);
      var btn = f.querySelector('input[type=submit][name=post]');
      fd.append('post', btn ? btn.value : 'Senden');
      var r = await fetch(f.getAttribute('action') || '/post', { method: 'POST', body: fd, credentials: 'same-origin' });
      var txt = ((parse(await r.text()).querySelector('#page-body .panel, #page-body .message, #page-body p') || {}).textContent || '').replace(/\s+/g, ' ').trim();
      if (/sekunden|warten|flood|zu schnell|seconds/i.test(txt)) {
        if (n === 5) throw new Error('Forumieren lässt gerade nicht schreiben. Versuch es gleich nochmal.');
        say && say('Kurze Pause, Forumieren bremst …');
        await sleep(20000); continue;
      }
      /* "existiert nicht" ist kein Fehler: Forumieren leitet nach dem Speichern zurzeit auf eine kaputte Adresse */
      if (/fehler|nicht berechtigt|keine berechtigung/i.test(txt) && !/existiert\s+nicht/i.test(txt)) throw new Error(txt);
      return;
    }
  }
  /* alle Themen im Auftragsbrett, alle Seiten */
  async function themenImBrett() {
    var out = [], seiten = ['/f' + CFG.ziel + '-'], gesehen = {};
    for (var i = 0; i < seiten.length && i < 10; i++) {
      var d = parse(await getText(seiten[i]));
      d.querySelectorAll('a.topictitle, a.topictitle-custom').forEach(function (a) {
        var h = String(a.getAttribute('href') || '').replace(/^https?:\/\/[^\/]+/, ''), m = h.match(/^\/t(\d+)/);
        if (m) out.push({ tid: +m[1], href: h.replace(/[#?].*$/, ''), titel: (a.textContent || '').trim() });
      });
      d.querySelectorAll('a[href]').forEach(function (a) {
        var h = String(a.getAttribute('href') || '').replace(/^https?:\/\/[^\/]+/, '').replace(/[#?].*$/, '');
        if (new RegExp('^/f' + CFG.ziel + 'p\\d+-').test(h) && !gesehen[h]) { gesehen[h] = 1; seiten.push(h); }
      });
    }
    return out;
  }

  /* ---------- Auftrag vorbereiten ---------- */
  function bloecke(msg) { var out = [], m; AB.lastIndex = 0; while ((m = AB.exec(msg))) out.push({ ganz: m[0], inner: m[1] }); return out; }
  function mitStatusOffen(block) {
    if (/^[ \t]*Status[ \t]*:.*$/im.test(block)) return block.replace(/^([ \t]*Status[ \t]*:).*$/im, '$1 offen');
    if (/^[ \t]*Beschreibung[ \t]*:/im.test(block)) return block.replace(/^([ \t]*Beschreibung[ \t]*:)/im, 'Status: offen\n$1');
    return block.replace(/\[\s*\/\s*auftrag\s*\]\s*$/i, 'Status: offen\n[/Auftrag]');
  }
  /* Ort für die Themenbeschreibung, so geschrieben wie im Forum ("Zhendao" wird zu "Stadt der Vier Nationen") */
  function ortName(ort) {
    var A = window.TES_AUFTRAG, id = A && A.forumFuer ? A.forumFuer(ort) : 0, name = id && A.cfg && A.cfg.orte ? A.cfg.orte[id] : '';
    return String(name || ort || '').replace(/^(Die|Der|Das)\s+(?=\S{3})/, '').trim();
  }
  function beschreibung(inner) {
    var art = feld(inner, 'Art'), kampf = /kampf/i.test(art), kl = feld(inner, 'Schwierigkeit');
    return ortName(feld(inner, 'Ort')) + ' · offen' + (kampf ? ' · Kampf' + (kl ? ': ' + kl.toLowerCase() : '') : '');
  }

  async function veroeffentlichen(pid, titel, say) {
    say('Lese den Vorrat …');
    var roh = rohtext(await formOf('/post?p=' + pid + '&mode=editpost'));
    var b = bloecke(roh).filter(function (x) { return plain(feld(x.inner, 'Titel')) === plain(titel); })[0];
    if (!b) throw new Error('Diesen Auftrag gibt es im Vorrat nicht mehr. Vielleicht ist er schon veröffentlicht. Bitte Seite neu laden.');
    var t = feld(b.inner, 'Titel'), ort = feld(b.inner, 'Ort');
    if (!t) throw new Error('Im Auftrag fehlt die Zeile „Titel:“.');
    if (!ort) throw new Error('Im Auftrag fehlt die Zeile „Ort:“.');

    say('Prüfe das Auftragsbrett …');
    var vorher = await themenImBrett();
    if (vorher.some(function (x) { return plain(x.titel) === plain(t); })) throw new Error('Im Auftragsbrett gibt es schon ein Thema „' + t + '“. Bitte dort prüfen.');

    say('Stelle „' + t + '“ ins Auftragsbrett …');
    await senden('/post?f=' + CFG.ziel + '&mode=newtopic', { subject: t, description: beschreibung(b.inner), message: mitStatusOffen(b.ganz) }, say);

    /* erst weiter, wenn das neue Thema wirklich da ist */
    var neu = null;
    for (var i = 0; i < 4 && !neu; i++) {
      if (i) await sleep(2500);
      var alt = {}; vorher.forEach(function (x) { alt[x.tid] = 1; });
      neu = (await themenImBrett()).filter(function (x) { return !alt[x.tid] && plain(x.titel) === plain(t); })[0] || null;
    }
    if (!neu) throw new Error('Das neue Thema ist im Auftragsbrett nicht aufgetaucht. Der Auftrag bleibt im Vorrat. Bitte im Auftragsbrett nachsehen.');

    say('Entferne den Auftrag aus dem Vorrat …');
    var roh2 = rohtext(await formOf('/post?p=' + pid + '&mode=editpost')), at = roh2.indexOf(b.ganz);
    if (at < 0) throw new Error('Veröffentlicht, aber der Block im Vorrat hat sich inzwischen geändert. Bitte dort von Hand löschen.');
    var rest = (roh2.slice(0, at).replace(/[ \t]*\n?[ \t]*$/, '') + '\n' + roh2.slice(at + b.ganz.length).replace(/^[ \t]*\n?/, '')).replace(/\n{3,}/g, '\n\n').trim();
    await senden('/post?p=' + pid + '&mode=editpost', { message: rest || 'Alle Aufträge aus diesem Vorrat sind veröffentlicht.' }, say);
    return neu;
  }

  /* ---------- Vorrat lesen (für die Teamzentrale) ---------- */
  function textOf(html) { var d = document.createElement('div'); d.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n'); return (d.textContent || '').replace(/\u00a0/g, ' '); }
  async function liste() {
    var out = [];
    for (var i = 0; i < CFG.pfade.length; i++) {
      var doc = parse(await getText(CFG.pfade[i]));
      var post = Array.prototype.filter.call(doc.querySelectorAll('div.post[id^="p"], div[id^="p"]'), function (x) { return /^p\d+$/.test(x.id); })[0];
      var c = post && post.querySelector('.content'); if (!c) continue;
      var name = ((doc.querySelector('h1.page-title') || {}).textContent || CFG.pfade[i]).trim();
      bloecke(textOf(c.innerHTML)).forEach(function (b) {
        var t = feld(b.inner, 'Titel'); if (!t) return;
        out.push({ pid: +post.id.slice(1), pfad: CFG.pfade[i], thema: name, titel: t, ort: feld(b.inner, 'Ort'), kampf: /kampf/i.test(feld(b.inner, 'Art')), klasse: feld(b.inner, 'Schwierigkeit') });
      });
    }
    return out;
  }
  var VORRAT = null, OFFEN = 0;
  var BOXST = 'max-width:100%!important;margin:0 0 14px!important;padding:14px 16px!important;border:1px solid rgba(230,195,90,.45)!important;border-left:3px solid #e6c35a!important;border-radius:12px!important;background:rgba(230,195,90,.06)!important;font:13px/1.55 Inter,sans-serif!important;color:#e2dac3!important';
  var KLEIN = 'display:inline-block!important;margin:0 0 0 8px!important;padding:5px 14px!important;border:1px solid #c2a75d!important;border-radius:16px!important;background:transparent!important;color:#c2a75d!important;font:600 10.5px Inter,sans-serif!important;letter-spacing:.12em!important;text-transform:uppercase!important;cursor:pointer!important';
  function vorratHtml() {
    if (!VORRAT) return '';
    if (!VORRAT.length) return '<div style="margin-top:10px!important;color:rgba(226,218,195,.6)!important">Der Vorrat ist leer. Neue Aufträge in die Vorrats-Themen schreiben.</div>';
    var gruppen = {};
    VORRAT.forEach(function (v) { (gruppen[v.thema] = gruppen[v.thema] || { pfad: v.pfad, l: [] }).l.push(v); });
    return Object.keys(gruppen).map(function (g) {
      return '<div style="margin:12px 0 4px!important;font:10.5px \'Bruno Ace SC\',sans-serif!important;letter-spacing:.12em!important;color:rgba(194,167,93,.75)!important"><a href="' + esc(gruppen[g].pfad) + '" style="color:inherit!important;text-decoration:none!important">' + esc(g) + '</a> · ' + gruppen[g].l.length + '</div>'
        + gruppen[g].l.map(function (v) {
          return '<div style="display:flex!important;align-items:center!important;gap:8px!important;padding:6px 0!important;border-top:1px solid rgba(194,167,93,.1)!important"><span style="flex:1!important;min-width:0!important"><b style="font-weight:600!important">' + esc(v.titel) + '</b> <small style="color:rgba(226,218,195,.55)!important">' + esc(v.ort) + (v.kampf ? ' · <span style="color:#e8876a!important">Kampf' + (v.klasse ? ': ' + esc(v.klasse) : '') + '</span>' : (v.klasse ? ' · ' + esc(v.klasse) : '')) + '</small></span>'
            + '<button type="button" data-vorrat-pub="' + v.pid + '" data-titel="' + esc(v.titel) + '" style="' + KLEIN + '">veröffentlichen</button></div>';
        }).join('');
    }).join('');
  }
  /* Hinweis für die Teamzentrale: auftr = Liste der gelesenen Aufträge (mit st.status) */
  function hinweis(auftr) {
    OFFEN = (auftr || []).filter(function (a) { return a.neu && a.st && a.st.status === 'offen'; }).length;
    if (OFFEN >= CFG.mindestOffen) return '';
    return '<div id="tes-vorrat-box" style="' + BOXST + '"><span class="tt-dran">Nur noch ' + OFFEN + ' offene ' + (OFFEN === 1 ? 'Auftrag' : 'Aufträge') + '</span> im Auftragsbrett. Zeit, aus dem Vorrat nachzulegen.'
      + (VORRAT ? '' : '<button type="button" data-vorrat-laden="1" style="' + KLEIN + '">Vorrat ansehen</button>')
      + '<div class="tv-say" style="margin-top:6px!important;font-size:12px!important;color:rgba(226,218,195,.6)!important"></div><div class="tv-liste">' + vorratHtml() + '</div></div>';
  }
  window.TES_VORRAT = { cfg: CFG, liste: liste, veroeffentlichen: veroeffentlichen };
  window.TES_VORRAT_HINWEIS = hinweis;
  document.addEventListener('click', async function (e) {
    var box = e.target.closest && e.target.closest('#tes-vorrat-box'); if (!box) return;
    var say = function (t, farbe) { var s = box.querySelector('.tv-say'); s.textContent = t; s.style.setProperty('color', farbe || 'rgba(226,218,195,.6)', 'important'); };
    var laden = e.target.closest('[data-vorrat-laden]');
    if (laden) {
      laden.disabled = true; say('Lese die Vorrats-Themen …');
      try { VORRAT = await liste(); laden.remove(); say(VORRAT.length + ' vorbereitete Aufträge im Vorrat.'); box.querySelector('.tv-liste').innerHTML = vorratHtml(); }
      catch (er) { laden.disabled = false; say(er.message, '#e2735f'); }
      return;
    }
    var b = e.target.closest('[data-vorrat-pub]'); if (!b || b.disabled) return;
    var titel = b.getAttribute('data-titel');
    if (!b.getAttribute('data-scharf')) { b.setAttribute('data-scharf', '1'); b.textContent = 'wirklich?'; setTimeout(function () { if (b.isConnected && !b.disabled) { b.removeAttribute('data-scharf'); b.textContent = 'veröffentlichen'; } }, 6000); return; }
    b.disabled = true; b.textContent = 'läuft …';
    try {
      var neu = await veroeffentlichen(+b.getAttribute('data-vorrat-pub'), titel, function (t) { say(t); });
      VORRAT = VORRAT.filter(function (v) { return !(v.pid === +b.getAttribute('data-vorrat-pub') && v.titel === titel); });
      OFFEN++;
      box.querySelector('.tv-liste').innerHTML = vorratHtml();
      var d = box.querySelector('.tt-dran'); if (d) d.textContent = 'Jetzt ' + OFFEN + ' offene ' + (OFFEN === 1 ? 'Auftrag' : 'Aufträge');
      say('✓ „' + neu.titel + '“ ist im Auftragsbrett.', '#8fe0a9');
    } catch (er) { b.disabled = false; b.removeAttribute('data-scharf'); b.textContent = 'veröffentlichen'; say(er.message, '#e2735f'); }
  });

  /* ---------- Knöpfe ---------- */
  var KN = 'display:inline-block!important;margin:0!important;padding:8px 18px!important;border:1px solid #c2a75d!important;border-radius:18px!important;background:#c2a75d!important;color:#0a0c0a!important;font:700 11px/1.2 Inter,sans-serif!important;letter-spacing:.14em!important;text-transform:uppercase!important;cursor:pointer!important';
  var BOX = 'display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:8px 12px!important;max-width:46rem!important;margin:-4px auto 18px!important;padding:10px 14px!important;border:1px dashed rgba(194,167,93,.35)!important;border-radius:12px!important;font:400 12.5px/1.5 Inter,sans-serif!important;color:rgba(226,218,195,.75)!important';
  function knopf(karte, pid, titel) {
    var box = document.createElement('div'); box.className = 'tes-vorrat'; box.setAttribute('style', BOX);
    box.innerHTML = '<button type="button" style="' + KN + '">Im Auftragsbrett veröffentlichen</button><span class="v-say"></span>';
    karte.parentNode.insertBefore(box, karte.nextSibling);
    var b = box.querySelector('button'), say = function (t, farbe) { var s = box.querySelector('.v-say'); s.textContent = t; s.style.setProperty('color', farbe || 'rgba(226,218,195,.75)', 'important'); };
    var scharf = false, uhr = null;
    b.addEventListener('click', async function () {
      if (!scharf) { scharf = true; b.textContent = 'Wirklich veröffentlichen?'; say('Noch ein Klick stellt „' + titel + '“ ins Auftragsbrett.'); clearTimeout(uhr); uhr = setTimeout(function () { scharf = false; b.textContent = 'Im Auftragsbrett veröffentlichen'; say(''); }, 6000); return; }
      clearTimeout(uhr); b.disabled = true; b.style.setProperty('opacity', '.55', 'important');
      try {
        var neu = await veroeffentlichen(pid, titel, say);
        karte.style.setProperty('opacity', '.35', 'important');
        box.innerHTML = '<span style="color:#8fe0a9!important">✓ Veröffentlicht und aus dem Vorrat entfernt:</span> <a href="' + esc(neu.href) + '" style="color:#c2a75d!important">' + esc(neu.titel) + '</a>';
      } catch (e) {
        say(e.message, '#e2735f'); scharf = false; b.disabled = false; b.style.removeProperty('opacity'); b.textContent = 'Im Auftragsbrett veröffentlichen';
      }
    });
  }
  function boot() {
    var post = Array.prototype.filter.call(document.querySelectorAll('div.post[id^="p"], div[id^="p"]'), function (x) { return /^p\d+$/.test(x.id); })[0];
    var c = post && post.querySelector('.content'); if (!c) return;
    var pid = +post.id.slice(1), tries = 0;
    (function warten() {
      /* die Karten setzt tes-weltkarten.js, darauf kurz warten */
      var karten = c.querySelectorAll('.tes-au');
      if (!karten.length && ++tries < 20) { setTimeout(warten, 300); return; }
      if (c.querySelector('.tes-vorrat')) return;
      Array.prototype.forEach.call(karten, function (k) {
        var t = k.querySelector('.au-title'); if (t && t.textContent.trim()) knopf(k, pid, t.textContent.trim());
      });
    })();
  }
  if (!VORRATSSEITE) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
