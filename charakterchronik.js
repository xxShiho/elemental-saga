/* Charakterchroniken: stellt [Charakterchronik]-Beitraege als Karte mit Charakterbild, Chronik und Meilensteinen dar
   Themen-Teil. Platzierung: Themen.
   Das Einsetzen der Szenenzeile auf "Beitrag bearbeiten" steht in charakterchronik-editor.js (Platzierung: Auf allen Seiten). */
(function(){
  /* ===== Forumdaten von GitHub: Szenenarchiv, Beitragszahlen und Trainingsbücher, stündlich erzeugt =====
     Derselbe Baustein kommt in alle Module, die diese Daten nutzen. Wer zuerst lädt, stellt window.TES_DATEN bereit.
     Fehlt die Datei oder ist sie älter als drei Stunden, lesen die Module wie bisher direkt im Forum. */
  if (!window.TES_DATEN || (window.TES_DATEN.v || 0) < 2) window.TES_DATEN = (function () {
    var URL = 'https://xxshiho.github.io/elemental-saga/forum-daten.js', MAXALT = 3 * 36e5, P = null;
    function gut(d) { return !!(d && d.v === 1 && d.stand && Date.now() - d.stand < MAXALT); }
    function laden() {
      if (P) return P;
      P = new Promise(function (res) {
        if (gut(window.TES_FORUMDATEN)) { res(window.TES_FORUMDATEN); return; }
        var s = document.createElement('script'), fertig = false;
        var ende = function () { if (fertig) return; fertig = true; res(gut(window.TES_FORUMDATEN) ? window.TES_FORUMDATEN : null); };
        s.src = URL + '?t=' + Math.floor(Date.now() / 600000); s.async = true; s.onload = ende; s.onerror = ende;
        setTimeout(ende, 6000);
        (document.head || document.documentElement).appendChild(s);
      });
      return P;
    }
    /* "heute um 12:17 Uhr", "gestern um 23:17 Uhr" oder "am 24.11. um 9:17 Uhr" */
    function stand(t) {
      var d = new Date(t), h = new Date(), g = new Date(); g.setDate(g.getDate() - 1);
      var uhr = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0') + ' Uhr';
      if (d.toDateString() === h.toDateString()) return 'heute um ' + uhr;
      if (d.toDateString() === g.toDateString()) return 'gestern um ' + uhr;
      return 'am ' + d.getDate() + '.' + (d.getMonth() + 1) + '. um ' + uhr;
    }
    /* Rufbuch-Zeilen aus den Forumdaten. null = selbst lesen (keine Daten, oder man hat gerade selbst ins Rufbuch geschrieben) */
    var EIGEN = 'tesRufGeschrieben';
    function geschrieben() { try { localStorage.setItem(EIGEN, String(Date.now())); } catch (e) { e = null; } }
    async function ruf(nurStarter) {
      var d = await laden(); if (!d || !d.ruf) return null;
      var eigen = 0; try { eigen = +localStorage.getItem(EIGEN) || 0; } catch (e) { eigen = 0; }
      if (eigen && d.stand < eigen) return null;
      return d.ruf.filter(function (z) { return !nurStarter || z[1]; }).map(function (z) { return z[0]; });
    }
    return { v: 2, laden: laden, stand: stand, ruf: ruf, geschrieben: geschrieben };
  })();
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return '&#' + c.charCodeAt(0) + ';'; }); };
  var css = ''
    + '.cc-wrap{max-width:46rem;margin:0 auto;font-family:Inter,sans-serif;color:#e2dac3;text-align:left;hyphens:none;-webkit-hyphens:none}'
    + '.cc-tabs{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px;margin:0;padding:0 28px}'
    + '.cc-tabs a{display:inline-block;padding:8px 18px 7px;border:1px solid rgba(194,167,93,.4);border-bottom:0;border-radius:10px 10px 0 0;background:#15120b;font:600 .75rem Inter,sans-serif;letter-spacing:.06em;color:#d4b866;text-decoration:none;transition:background .2s,color .2s}'
    + '.cc-tabs a:hover{background:#c2a75d;color:#0a0c0a}'
    + '.cc-card{border:1px solid rgba(194,167,93,.4);border-radius:14px;background:#0d0b07;box-shadow:inset 0 0 0 5px #0d0b07,inset 0 0 0 6px rgba(194,167,93,.14);padding:30px 32px 26px;text-align:left}'
    + '.cc-kick{font:.7rem "Bruno Ace SC",sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#b8b1a2}'
    + '.cc-kopf{display:flex;gap:26px;align-items:flex-start;margin:20px 0 0}'
    + '.cc-foto{position:relative;flex:none;margin:4px 0 0 4px;padding:6px 6px 14px;background:#e9e1cc;border-radius:2px;box-shadow:0 6px 16px rgba(0,0,0,.6);transform:rotate(-3deg)}'
    + '.cc-band{position:absolute;top:-10px;left:50%;width:56px;height:20px;margin-left:-28px;background:rgba(236,224,190,.6);box-shadow:0 1px 2px rgba(0,0,0,.25);transform:rotate(-4deg);z-index:1}'
    + '.cc-por{display:flex;align-items:center;justify-content:center;width:118px;height:148px;background-color:#1b1812;background-size:cover;background-position:center top;background-repeat:no-repeat;border-bottom:4px solid var(--cc);font:2.4rem "Bruno Ace SC",sans-serif;color:var(--cc)}'
    + '.cc-id{flex:1;min-width:0;padding-top:6px}'
    + '.cc-name{font:2.25rem/1.15 "Bruno Ace SC",sans-serif;letter-spacing:.04em;color:var(--cc);overflow-wrap:anywhere;text-shadow:0 2px 12px rgba(0,0,0,.8)}'
    + '.cc-acc{margin-top:6px;font-size:.88rem;color:#b8b1a2}'
    + '.cc-acc b{font-weight:600;color:var(--cc)}'
    + '.cc-heim{display:flex;align-items:center;gap:7px;margin-top:10px;font-size:.88rem;color:#e2dac3}'
    + '.cc-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}'
    + '.cc-stat{display:inline-block;padding:5px 12px;border:1px solid rgba(194,167,93,.35);border-radius:14px;font-size:.82rem;color:#e2dac3}'
    + '.cc-stat b{font-weight:600;color:#d4b866;margin-right:5px}'
    + '.cc-h{display:flex;align-items:center;gap:12px;margin:34px 0 18px;font:.82rem "Bruno Ace SC",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#c2a75d}'
    + '.cc-h::after{content:"";flex:1;height:1px;background:linear-gradient(to right,rgba(194,167,93,.45),transparent)}'
    + '.cc-tl{position:relative;margin:0 0 0 6px;padding:0 0 0 30px;list-style:none;border-left:1px solid rgba(194,167,93,.35)}'
    + '.cc-tl li{position:relative;margin:0 0 20px;padding:0}'
    + '.cc-tl li::before{content:"";position:absolute;left:-36px;top:4px;width:11px;height:11px;transform:rotate(45deg);background:var(--cc);box-shadow:0 0 0 4px #0d0b07}'
    + '.cc-when{display:block;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#c2a75d}'
    + '.cc-what{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin-top:3px;font-weight:600;font-size:1.06rem;line-height:1.35;color:#e2dac3}'
    + '.cc-what a{color:#e2dac3;text-decoration:none;border-bottom:1px dotted rgba(194,167,93,.6)}'
    + '.cc-what a:hover{color:#c2a75d}'
    + '.cc-txt{display:block;margin-top:5px;font-size:.94rem;line-height:1.6;font-style:italic;color:#d8cfb8}'
    + '.cc-st{display:inline-block;padding:1px 9px;border:1px solid rgba(194,167,93,.45);border-radius:9px;font:600 .68rem Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#d8cfb8}'
    + '.cc-st.cc-done{border-color:rgba(95,208,139,.5);color:#5fd08b}'
    + '.cc-add{padding:3px 11px;border:1px dashed rgba(194,167,93,.6);border-radius:10px;background:transparent;font:600 .72rem Inter,sans-serif;letter-spacing:.02em;color:#d4b866;cursor:pointer}'
    + '.cc-add:hover{background:rgba(194,167,93,.12)}'
    + '.cc-mehr{display:inline-block;margin:0 0 0 36px;padding:7px 14px;border:1px solid rgba(194,167,93,.35);border-radius:14px;background:rgba(194,167,93,.06);font:600 .75rem Inter,sans-serif;letter-spacing:.04em;color:#d4b866;cursor:pointer}'
    + '.cc-mehr:hover{background:rgba(194,167,93,.14)}'
    + '.cc-alt{display:none}'
    + '.cc-offen .cc-alt{display:block}'
    + '.cc-ms{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}'
    + '.cc-ms li{display:flex;gap:16px;align-items:center;margin:0;padding:14px 16px;border:1px solid rgba(194,167,93,.25);border-radius:12px;background:rgba(194,167,93,.05)}'
    + '.cc-ms .cc-txt{font-style:normal;color:#ece4cf;margin-top:3px}'
    + '.cc-siegel{display:flex;flex:none;align-items:center;justify-content:center;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d8584a,#8e2219 72%);box-shadow:0 3px 8px rgba(0,0,0,.5),inset 0 0 0 5px rgba(0,0,0,.12)}'
    + '.cc-siegel i{display:block;width:70%;height:70%;border-radius:50%;border:1px dashed rgba(255,220,200,.55)}'
    + '.cc-empty{font-style:italic;font-size:.9rem;color:#a39c8d}'
    + '.cc-empty a{color:#d4b866;text-decoration:none;border-bottom:1px dotted rgba(194,167,93,.6)}'
    + '.cc-note{margin:-6px 0 14px;font-size:.8rem;color:#a39c8d}'
    + '.cc-places{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:12px;margin:0 0 14px;padding:0;list-style:none}'
    + '.cc-places li{margin:0;padding:14px 14px 12px;border:1px solid rgba(194,167,93,.3);border-radius:12px;background:rgba(194,167,93,.05);text-align:center}'
    + '.cc-pn{display:block;font:.82rem "Bruno Ace SC",sans-serif;letter-spacing:.06em;color:#d4b866}'
    + '.cc-pk{display:block;margin-top:2px;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#b8b1a2}'
    + '.cc-pd{display:block;margin-top:8px;font-size:.88rem;line-height:1.5;font-style:italic;color:#ece4cf}'
    + '.cc-pm{display:block;margin-top:8px;font-size:.75rem;color:#b8b1a2}'
    + '.cc-plus{color:#5fd08b}'
    + '.cc-minus{color:#f08a78}'
    + '.cc-buch{display:flex;flex-direction:column;margin:0;padding:0;list-style:none;font-size:.88rem}'
    + '.cc-buch li{display:flex;flex-wrap:wrap;gap:2px 14px;margin:0;padding:7px 0;border-bottom:1px solid rgba(194,167,93,.12)}'
    + '.cc-bd{flex:none;width:5.6rem;color:#b8b1a2}'
    + '.cc-bo{flex:none;min-width:7.5rem;font-weight:600;color:#e2dac3}'
    + '.cc-ba{flex:1 1 12rem;color:#d8cfb8}'
    + '.cc-weiter{margin-top:10px;font-size:.82rem;color:#b8b1a2}'
    + '.cc-weiter a{color:#d4b866;text-decoration:none;border-bottom:1px dotted rgba(194,167,93,.6)}'
    + '.cc-fuss{display:flex;align-items:center;justify-content:flex-end;gap:14px;margin-top:30px;padding-top:16px;border-top:1px solid rgba(194,167,93,.15)}'
    + '.cc-zeich{text-align:right}'
    + '.cc-zk{display:block;font:.68rem "Bruno Ace SC",sans-serif;letter-spacing:.15em;text-transform:uppercase;color:#b8b1a2}'
    + '.cc-gez{display:block;margin-top:4px;font-size:.88rem;line-height:1.4;font-style:italic;color:#d8cfb8}'
    + '.cc-fuss .cc-siegel{width:40px;height:40px}'
    + '.cc-aus{display:none}'
    + '.cc-wrap ul,.cc-wrap li{list-style:none;margin-left:0}.cc-wrap li::marker{content:""}'
    + '.cc-wrap div,.cc-wrap span,.cc-wrap li,.cc-wrap b,.cc-wrap a{text-indent:0;hyphens:none;-webkit-hyphens:none;word-break:normal}'
    + '@media(max-width:560px){.cc-card{padding:22px 18px 20px}.cc-tabs{padding:0 12px}.cc-kopf{flex-direction:column;gap:18px}.cc-name{font-size:1.7rem}.cc-tl{padding-left:22px}.cc-tl li::before{left:-28px}.cc-mehr{margin-left:28px}.cc-zeich{text-align:right}}';
  css = css.replace(/\.(cc-[a-z]+)/g, '.$1.$1.$1');
  css = css.replace(/([{;])([^{};]+?)(?=[;}])/g, function(m, a, b){ return a + (/!important/.test(b) || b.indexOf(':') < 0 ? b : b + '!important'); });
  var PH = /LINK ZUR SZENE|LINK ZUM|Ein Satz, was passiert|Was hat sich ver|Titel der Szene|^Ingame-Zeit$/i;
  function splitParts(html){ return html.replace(/<\/(p|div|li)>/gi, '<br>').split(/<br\s*\/?>/i); }
  function txt(h){ var d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/ /g, ' ').trim(); }
  function linkOf(h){ var d = document.createElement('div'); d.innerHTML = h; var a = d.querySelector('a'); var img = d.querySelector('img'); return img ? img.getAttribute('src') : a ? a.getAttribute('href') : txt(h); }
  function parse(inner){
    var out = { name:'', img:'', links:[], scenes:[], ms:[] }, cur = '';
    splitParts(inner).forEach(function(part){
      var t = txt(part); if(!t) return;
      var m = t.match(/^([A-Za-zÀ-ſ ]{3,20}):\s*(.*)$/);
      if(m && !/^\s*-/.test(t)){
        var k = m[1].toLowerCase().trim(), rest = part.replace(/^[\s\S]*?:\s*/, '');
        if(/^szenen/.test(k)){ cur = 's'; return; }
        if(/^meilen/.test(k)){ cur = 'm'; return; }
        cur = '';
        if(/^charakter|^name/.test(k)){ out.name = m[2].trim(); return; }
        if(/^bild/.test(k)){ out.img = linkOf(rest); return; }
        if(/^(herkunft|heimat)/.test(k)){ out.home = m[2].trim(); return; }
        var d = document.createElement('div'); d.innerHTML = rest; var a = d.querySelector('a');
        if(a && !/^LINK/i.test(a.getAttribute('href') || '')) out.links.push({ label:m[1].trim(), href:a.getAttribute('href') });
        return;
      }
      if(/^\s*-/.test(t) && cur){
        var cells = part.replace(/^\s*(<[^>]+>\s*)*-\s*/, function(x){ return x.replace(/-\s*$/, ''); }).split('|');
        if(cur === 's') out.scenes.push({ when:txt(cells[0] || ''), what:(cells[1] || '').trim(), text:txt(cells.slice(2).join('|')) });
        else out.ms.push({ when:txt(cells[0] || ''), text:txt(cells.slice(1).join('|') || cells[0]) });
      }
    });
    return out;
  }
  /* Namensschluessel: ganzer Name, Teil vor " - " (z. B. "Mei - Luftnomaden") und Vorname */
  function nameKeys(s){
    var n = function(x){ return String(x || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, ''); };
    var raw = String(s || '').trim(), head = raw.split(/\s+[-–—|]\s+/)[0], first = head.split(/\s+/)[0];
    return [n(raw), n(head), n(first)].filter(function(k, i, a){ return k && a.indexOf(k) === i; });
  }
  function authorOf(post){
    var a = post && (post.querySelector('.postbody p.author a[href*="/u"]') || post.querySelector('.postprofile a[href*="/u"]'));
    return a ? a.textContent.trim() : '';
  }
  function colorOf(post){
    var c = post && post.querySelector('.postprofile .usr_grp_clr, .postprofile [style*="color"], .postprofile-name [style*="color"]');
    return c && c.style.color ? c.style.color : '#c2a75d';
  }
  /* Eigene Szenenzeilen: Platzhalter leeren statt die ganze Zeile zu verwerfen */
  function manualScenes(list){
    return list.map(function(s){ return { when: PH.test(s.when) ? '' : s.when, what: s.what, text: PH.test(s.text) ? '' : s.text }; })
      .filter(function(s){ return s.what && !/LINK ZUR SZENE|Titel der Szene/i.test(s.what) && (s.text || s.when || /href=/.test(s.what)); });
  }
  function tidOf(html){ var m = String(html || '').match(/href="[^"]*?[/]t(\d+)/); return m ? m[1] : ''; }
  /* manual: Zeilen aus der Chronik; auto: Szenen aus der Suche (oder null, solange sie laedt) */
  var ZEIGEN = 5;   /* so viele Szenen sind offen, der Rest liegt unter "Fruehere Kapitel ansehen" */
  function scenesHtml(manual, auto, note, edit){
    var li = function(when, what, text, st){ return '<li>' + (when ? '<span class="cc-when">' + esc(when) + '</span>' : '') + '<span class="cc-what">' + what + (st || '') + '</span>' + (text ? '<span class="cc-txt">' + esc(text) + '</span>' : '') + '</li>'; };
    var byTid = {}, used = {}, out = [];
    manual.forEach(function(s){ var t = tidOf(s.what); if(t) byTid[t] = s; });
    (auto || []).forEach(function(a){
      var m = byTid[a.tid]; if(m) used[a.tid] = 1;
      var st = '<span class="cc-st' + (a.done ? ' cc-done' : '') + '">' + (a.done ? 'abgeschlossen' : 'läuft') + '</span>';
      var btn = edit && !(m && m.text) ? '<button type="button" class="cc-add" data-tid="' + esc(a.tid) + '" data-title="' + esc(a.title) + '">+ eigene Worte</button>' : '';
      out.push(li((m && m.when ? m.when + ' · ' : '') + ortName(a.place), '<a href="' + esc(a.href) + '">' + esc(a.title) + '</a>', m ? m.text : '', st + btn));
    });
    manual.forEach(function(s){ var t = tidOf(s.what); if(!t || !used[t]) out.push(li(s.when, s.what, s.text)); });
    var h = note ? '<div class="cc-note">' + note + '</div>' : '';
    if(out.length){
      var rest = out.length - ZEIGEN;
      if(rest > 0) out = out.map(function(x, i){ return i < ZEIGEN ? x : x.replace('<li>', '<li class="cc-alt">'); });
      return h + '<ul class="cc-tl">' + out.join('') + '</ul>' + (rest > 0 ? '<button type="button" class="cc-mehr">Frühere Kapitel ansehen (' + rest + ')</button>' : '');
    }
    return h + '<div class="cc-empty">' + (auto === null ? 'Die Szenen werden gesucht …' : 'Die Chronik ist noch leer. Das erste Kapitel wartet.') + '</div>';
  }
  var HAUS = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2a75d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>';
  var SIEGEL = '<span class="cc-siegel"><i></i></span>';
  function render(d, color, who){
    var noimg = !d.img || /^BILD|^LINK/i.test(d.img);
    var shown = String(d.name || '').replace(/\s+[-–—|]\s+[^-–—|]*(feuer|wasser|erd|luft|nomad|nation|st(ä|ae)mme|k(ö|oe)nigreich|inseln)[^-–—|]*$/i, '').trim();
    var name = shown && !/^name$/i.test(shown) ? shown : 'Unbenannt';
    var ms = d.ms.filter(function(m){ return m.text && !PH.test(m.text) && !PH.test(m.when); });
    var h = '<div class="cc-wrap" style="--cc:' + esc(color) + '">';
    if(d.links.length) h += '<div class="cc-tabs">' + d.links.map(function(l){ return '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>'; }).join('') + '</div>';
    h += '<div class="cc-card"><div class="cc-kick">Archiv von Zhendao · Charakterchronik</div><div class="cc-kopf">';
    h += '<div class="cc-foto"><span class="cc-band"></span><div class="cc-por"' + (noimg ? '>' + esc(name.charAt(0).toUpperCase()) : ' style="background-image:url(\'' + esc(String(d.img).replace(/'/g, '%27')) + '\')">') + '</div></div>';
    h += '<div class="cc-id"><div class="cc-name">' + esc(name) + '</div>' + (who ? '<div class="cc-acc">gespielt von <b>' + esc(who) + '</b></div>' : '');
    h += '<div class="cc-heim' + (d.home ? '' : ' cc-aus') + '">' + HAUS + '<span>Heimat: ' + esc(d.home || '') + '</span></div>';
    h += '<div class="cc-stats" data-ms="' + ms.length + '"></div></div></div>';
    h += '<div class="cc-h">Szenenchronik</div><div class="cc-scenes">' + scenesHtml(manualScenes(d.scenes), null) + '</div>';
    h += '<div class="cc-h">Meilensteine</div>';
    if(ms.length) h += '<ul class="cc-ms">' + ms.map(function(m){ return '<li>' + SIEGEL + '<div>' + (m.when ? '<span class="cc-when">' + esc(m.when) + '</span>' : '') + '<span class="cc-txt">' + esc(m.text) + '</span></div></li>'; }).join('') + '</ul>';
    else h += '<div class="cc-empty">Noch keine Meilensteine.</div>';
    var sbl = d.links.filter(function(l){ return /steckbrief/i.test(l.label); })[0];
    if(d.name && !/^name$/i.test(d.name)) h += '<div class="cc-h">Ruf in der Welt</div><div class="cc-ruf" data-name="' + esc(d.name) + '"' + (d.home ? ' data-home="' + esc(d.home) + '"' : '') + (sbl ? ' data-sb="' + esc(sbl.href) + '"' : '') + '><div class="cc-empty">Das Rufbuch wird gelesen …</div></div>';
    h += '<div class="cc-fuss"><div class="cc-zeich"><span class="cc-zk">Im Archiv geführt</span><span class="cc-gez">gez. ' + ARCHIVAR.n + ', ' + ARCHIVAR.a + '<br>im Auftrag von Zhou Kangyi</span></div>' + SIEGEL + '</div>';
    return h + '</div></div>';
  }
  /* Wer die Chroniken im Archiv fuehrt (einer der drei Schreiber von Zhou Kangyi) */
  var ARCHIVAR = { n:'Tao Wen', a:'Archivschreiber' };
  /* Zahlen im Kopf: Szenen, davon abgeschlossen, Meilensteine */
  function zahlen(wrap){
    var box = wrap && wrap.querySelector('.cc-stats'); if(!box) return;
    var sc = wrap.querySelectorAll('.cc-scenes .cc-tl > li').length, dn = wrap.querySelectorAll('.cc-scenes .cc-done').length, ms = +box.getAttribute('data-ms') || 0;
    var st = function(n, a, b){ return '<span class="cc-stat"><b>' + n + '</b>' + (n === 1 ? a : b) + '</span>'; };
    box.innerHTML = (sc ? st(sc, 'Szene', 'Szenen') : '') + (dn ? st(dn, 'abgeschlossen', 'abgeschlossen') : '') + (ms ? st(ms, 'Meilenstein', 'Meilensteine') : '');
  }
  function mehrKnopf(box){
    box.addEventListener('click', function(ev){ var b = ev.target.closest && ev.target.closest('.cc-mehr'); if(!b) return; box.classList.add('cc-offen'); b.parentNode.removeChild(b); });
  }
  function run(){
    var found = false;
    document.querySelectorAll('.postbody .content, .post-entry, .content').forEach(function(c){
      if(c.getAttribute('data-cc') || c.closest('[data-cc]')) return;
      var html = c.innerHTML, m = html.match(/\[\s*charakterchronik\s*\]([\s\S]*?)\[\s*\/\s*charakterchronik\s*\]/i);
      if(!m) return;
      if(Array.prototype.some.call(c.querySelectorAll('[style*="monospace"], [style*="user-select"]'), function(v){ return /\[\s*charakterchronik\s*\]/i.test(v.textContent || ''); })) return;   /* Vorlagen zum Kopieren nicht als Karte zeigen */
      if(c.closest('blockquote, .quote, .codebox')) return;
      c.setAttribute('data-cc', '1');
      if(!found){ var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); found = true; }
      var post = c.closest('.post'), data = parse(m[1]), who = authorOf(post);
      var card = render(data, colorOf(post), who);
      c.innerHTML = html.replace(m[0], card);
      var ruf = c.querySelector('.cc-ruf'); if(ruf && who) ruf.setAttribute('data-account', who);
      var box = c.querySelector('.cc-scenes');
      var pid = post && canEdit(post) ? +(post.id || '').replace(/[^0-9]/g, '') : 0;
      if(box) mehrKnopf(box);
      if(box && who) fillScenes(box, who, manualScenes(data.scenes), pid);
      else if(box) box.innerHTML = scenesHtml(manualScenes(data.scenes), []);
      zahlen(c.querySelector('.cc-wrap'));
    });
  }
  /* ===== Alle Szenen des Charakters: Forensuche nach dem Account, nur Foren aus dem RPG-Bereich =====
     SZENEN.ohne: Foren im RPG-Bereich, die keine Szenen enthalten (Trainingsbuecher, Chroniken, Auftraege, Weltgeschehen, Abwesenheiten). */
  var SZENEN = { ohne: [54, 63, 58, 57, 6], ohneName: /trainingsb|chronik|auftr(ä|ae)ge|weltgeschehen|abwesen/i,
    ohneTitel: /^\s*(alles\s+(ü|ue)ber\b|wichtig\s*:|ank(ü|ue)ndigung\s*:|\[(npc|auftrag|vorschlag)\])/i,   /* Infothemen der Orte sind keine Szenen */
    cache: 'tesCcSzenen3_', stunden: 12, seiten: 5 };
  function rpgForums(doc){
    var out = {}, inRpg = false, stack = [];
    Array.prototype.forEach.call(doc.querySelectorAll('select[name=selected_id] option'), function(o){
      var v = String(o.value || ''), raw = (o.textContent || '').replace(/ /g, ' '), i = raw.indexOf('|--'), name = (i < 0 ? raw : raw.slice(i + 3)).trim();
      var depth = i < 0 ? 0 : Math.round(i / 4);
      if(/^c\d+/.test(v)){ inRpg = /rpg/i.test(name); stack = []; return; }
      var m = v.match(/^f(\d+)/); if(!inRpg || !m) return;
      stack[depth] = name; stack.length = depth + 1;
      if(SZENEN.ohne.indexOf(+m[1]) > -1 || SZENEN.ohneName.test(name)) return;
      var arch = /archiv/i.test(name), place = name;
      if(arch){ for(var k = depth - 1; k >= 0; k--){ if(stack[k] && !/archiv/i.test(stack[k])){ place = stack[k]; break; } } }
      if(arch && place === name) place = name.replace(/^(szenen)?archiv\s*[:\-–]?\s*/i, '') || name;
      out[m[1]] = { name: place, archiv: arch };
    });
    return out;
  }
  async function searchScenes(account){
    /* zuerst die stündlichen Forumdaten von GitHub: alle Szenen mit ihren Mitspielenden */
    if(window.TES_DATEN){
      var dd = null; try{ dd = await window.TES_DATEN.laden(); }catch(e){ dd = null; }
      if(dd && dd.szenen){
        var ak = String(account || '').toLowerCase().trim();
        return dd.szenen.filter(function(x){ return (x[5] || []).some(function(n){ return String(n).toLowerCase().trim() === ak; }); })
          .map(function(x){ return { tid: String(x[0]), href: '/t' + x[0] + '-', title: x[1], place: x[2], done: !!x[3] }; });
      }
    }
    var ck = SZENEN.cache + account.toLowerCase();
    try{ var c = JSON.parse(localStorage.getItem(ck) || 'null'); if(c && Date.now() - c.at < SZENEN.stunden * 36e5) return c.list; }catch(e){ e = null; }
    var get = async function(u){ var r = await fetch(u, { credentials:'same-origin' }); if(!r.ok) throw new Error(r.status); return new DOMParser().parseFromString(await r.text(), 'text/html'); };
    var forums = rpgForums(document), FK = 'tesCcForen1';
    if(Object.keys(forums).length){ try{ localStorage.setItem(FK, JSON.stringify({ at: Date.now(), f: forums })); }catch(e){ e = null; } }
    else {   /* Forenliste eine Woche merken, statt jedes Mal die Startseite zu laden */
      try{ var fc = JSON.parse(localStorage.getItem(FK) || 'null'); if(fc && Date.now() - fc.at < 7 * 864e5) forums = fc.f; }catch(e){ e = null; }
      if(!Object.keys(forums).length){ forums = rpgForums(await get('/')); try{ localStorage.setItem(FK, JSON.stringify({ at: Date.now(), f: forums })); }catch(e){ e = null; } }
    }
    var url = '/search?search_author=' + encodeURIComponent(account) + '&show_results=topics', seen = {}, list = [], pages = 0;
    while(url && pages < SZENEN.seiten){
      var d = await get(url); pages++;
      var rows = d.querySelectorAll('ul.topiclist.topics li.row, li.row');
      if(!rows.length && pages === 1){
        var msg = ((d.querySelector('#page-body .panel, #page-body .message, #page-body p') || {}).textContent || '').trim();
        if(/sekunden|warten|flood/i.test(msg)) throw new Error('flood');
      }
      Array.prototype.forEach.call(rows, function(row){
        var a = row.querySelector('a.topictitle'), f = row.querySelector('.span-tab a[href*="/f"], a[href^="/f"]');
        if(!a || !f) return;
        var tm = (a.getAttribute('href') || '').match(/[/]t(\d+)/), fm = (f.getAttribute('href') || '').match(/[/]f(\d+)/);
        if(!tm || !fm || seen[tm[1]] || !forums[fm[1]]) return;
        if(SZENEN.ohneTitel.test(a.textContent) || /announce|sticky|global/i.test(row.className || '')) return;
        seen[tm[1]] = 1;
        list.push({ tid: tm[1], href: '/t' + tm[1] + '-', title: a.textContent.trim(), place: forums[fm[1]].name || f.textContent.trim(), done: forums[fm[1]].archiv });
      });
      var next = Array.prototype.filter.call(d.querySelectorAll('a[href*="/search"]'), function(x){ return /start=\d+/.test(x.getAttribute('href') || '') && /(weiter|next|»|›)/i.test((x.textContent || '') + (x.getAttribute('title') || '') + (x.className || '')); })[0];
      url = next ? next.getAttribute('href').replace(/&amp;/g, '&') : '';
    }
    try{ localStorage.setItem(ck, JSON.stringify({ at: Date.now(), list: list })); }catch(e){ e = null; }
    return list;
  }
  /* Darf der Betrachter die Chronik bearbeiten? Dann gibt es "+ eigene Worte" */
  function canEdit(post){
    try{
      var u = window._userdata || {}, a = post && (post.querySelector('.postbody p.author a[href*="/u"]') || post.querySelector('.postprofile a[href*="/u"]'));
      var uid = a ? +((a.getAttribute('href').match(/[/]u(\d+)/) || [0, 0])[1]) : 0;
      return (+u.user_id && +u.user_id === uid) || +u.user_level === 1;
    }catch(e){ return false; }
  }
  var ZEILE = 'tesCcZeile';   /* muss mit ZEILE im Editor-Teil uebereinstimmen */
  function bindAdd(box, pid){
    box.addEventListener('click', function(ev){
      var b = ev.target.closest && ev.target.closest('.cc-add'); if(!b) return;
      var line = '- Ingame-Zeit | [url=' + location.origin + '/t' + b.getAttribute('data-tid') + '-]' + b.getAttribute('data-title') + '[/url] | Ein Satz, was passiert ist.';
      try{ sessionStorage.setItem(ZEILE, JSON.stringify({ p: pid, line: line })); }catch(e){ e = null; }
      try{ navigator.clipboard.writeText(line); }catch(e){ e = null; }
      location.href = '/post?p=' + pid + '&mode=editpost';
    });
  }
  /* fillZeile (Zeile auf der Bearbeiten-Seite einsetzen) steht im Editor-Teil */
  function fillScenes(box, account, manual, edit){
    var pid = edit || 0;
    if(pid) bindAdd(box, pid);
    var neu = function(html){ box.innerHTML = html; zahlen(box.closest('.cc-wrap')); };
    neu(scenesHtml(manual, null));
    searchScenes(account).then(function(list){ neu(scenesHtml(manual, list, '', !!pid)); })
      .catch(function(e){
        var old = null; try{ old = JSON.parse(localStorage.getItem(SZENEN.cache + account.toLowerCase()) || 'null'); }catch(x){ old = null; }
        neu(scenesHtml(manual, old ? old.list : [], old ? 'Stand von vorhin, die Suche ist gerade ausgelastet.' : (e && e.message === 'flood' ? 'Die Szenenliste lädt gleich, die Forensuche braucht eine kurze Pause.' : ''), !!pid));
      });
  }
  /* ===== Ruf in der Welt: alle Rufbuch-Zeilen, in deren letzter Spalte der Charakter steht =====
     Rufbuch-Zeile: TT.MM.JJJJ | Ort | Punkte | Nationen | Anlass | Charaktere */
  var RICHTUNG = /^(norden|osten|westen|sueden|zentrum)$/;
  var RUF = { thema: '/t36-rpg-gesellschaftliche-stimmung', marker: /✦\s*RUFBUCH\s*✦/i, cache: 'tesRufbuchZeilen4', minuten: 360, zeigen: 5 };
  var RLINE = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{2,4})\s*\|\s*([^|]+?)\s*\|\s*([+\-−–]?)\s*(\d+)\s*(?:\|\s*(.*?))?\s*$/;
  var rnorm = function(s){ return String(s || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, ''); };
  function bookLines(docs){
    var out = [];
    docs.forEach(function(doc){
      doc.querySelectorAll('div.post[id^="p"], div[id^="p"]').forEach(function(p){
        if(!/^p\d+$/.test(p.id)) return;
        var c = p.querySelector('.content'); if(!c) return;
        var t, tmp = document.createElement('div'); tmp.innerHTML = c.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr)>/gi, '\n');
        t = (tmp.textContent || '').replace(/ /g, ' ');
        if(!RUF.marker.test(t)) return;
        t.split('\n').forEach(function(raw){ zeileLesen(raw, out); });
      });
    });
    return out;
  }
  function zeileLesen(raw, out){
          var m = raw.match(RLINE); if(!m) return;
          var rest = (m[7] || '').split('|'); if(rest.length < 3) return;   // ohne Charakter-Spalte zaehlt die Zeile hier nicht
          var y = +m[3]; if(y < 100) y += 2000;
          var chars = rest.pop(), anlass = rest.slice(1).join('|').trim(), ort = m[4].trim();
          if(/^[-–—]$/.test(ort) || RICHTUNG.test(rnorm(ort))) return;   // freie Orte und ganze Himmelsrichtungen zaehlen hier nicht
          out.push({ t: new Date(y, +m[2] - 1, +m[1]).getTime(), ort: ort, pts: (m[5] && m[5] !== '+' ? -1 : 1) * +m[6], anlass: anlass, chars: chars.split(/\s*(?:,|;|&|\bund\b)\s*/i).map(function(x){ return x.trim(); }).filter(Boolean) });
  }
  async function loadBook(){
    /* zuerst die stündlichen Forumdaten von GitHub */
    if(window.TES_DATEN){ var zz = null; try{ zz = await window.TES_DATEN.ruf(); }catch(e){ zz = null; } if(zz){ var out0 = []; zz.forEach(function(raw){ zeileLesen(raw, out0); }); return out0; } }
    try{ var c = JSON.parse(localStorage.getItem(RUF.cache) || 'null'); if(c && Date.now() - c.at < RUF.minuten * 6e4) return c.lines; }catch(e){ e = null; }
    var get = async function(u){ var r = await fetch(u, { credentials:'same-origin' }); if(!r.ok) throw new Error(r.status); return new DOMParser().parseFromString(await r.text(), 'text/html'); };
    var first = await get(RUF.thema), docs = [first], id = (RUF.thema.match(/^[/]t(\d+)/) || [])[1], offs = {};
    first.querySelectorAll('a[href]').forEach(function(a){ var m = (a.getAttribute('href') || '').replace(/^https?:[/][/][^/]+/, '').match(new RegExp('^[/]t' + id + 'p(\\d+)-')); if(m && +m[1] > 0) offs[m[1]] = 1; });
    for(var k in offs) docs.push(await get('/t' + id + 'p' + k + '-'));
    var lines = bookLines(docs);
    try{ localStorage.setItem(RUF.cache, JSON.stringify({ at: Date.now(), lines: lines })); }catch(e){ e = null; }
    return lines;
  }
  /* ===== Bekanntheit: weich, ohne Rang. Nur feste Orte zaehlen. =====
     stufen: ab so vielen Eintraegen an einem Ort gilt der jeweilige Satz.
     faktor: Orte, an denen alle viel spielen, brauchen mehr Eintraege (Zhendao doppelt).
     ton: Summe der Punkte am Ort -> Zusatz, wie man ueber den Charakter denkt. */
  var BEKANNT = {
    stufen: [
      { ab: 1,  text: 'Man hat dich hier schon gesehen' },
      { ab: 5,  text: 'Ein bekanntes Gesicht' },
      { ab: 10, text: 'Man kennt deinen Namen' },
      { ab: 15, text: 'Du gehörst hier fast dazu' }
    ],
    faktor: { zhendao: 2 },
    heimat: 1,   /* Heimatort startet bei dieser Stufe (0 = erste, 1 = "Ein bekanntes Gesicht") */
    ton: { gut: 3, schlecht: -2, gutText: 'und man spricht gut von dir', schlechtText: 'doch man behält dich im Auge' },
    /* gleiche Orte unter verschiedenen Namen zusammenfassen: Schreibweise -> Anzeigename */
    namen: { 'zhendao': 'Zhendao', 'stadtderviernationen': 'Zhendao', 'diestadtderviernationen': 'Zhendao', 'zentralstadt': 'Zhendao', 'stadt': 'Zhendao',
      'ascheninsel': 'Aschen-Inseln', 'ascheninseln': 'Aschen-Inseln', 'emberinsel': 'Aschen-Inseln', 'emberinseln': 'Aschen-Inseln', 'kyoshiinsel': 'Kyoshi-Inseln', 'kyoshiinseln': 'Kyoshi-Inseln', 'sikua': "Siku'a", 'sikuadaseisdorf': "Siku'a", 'agnaqela': "Agna Qel'a", 'siwong': 'Si-Wong-Wüste', 'siwongwueste': 'Si-Wong-Wüste' },
    /* eigener Satz fuer die hoechste Stufe (optional, Schluessel = Anzeigename klein ohne Sonderzeichen) */
    ortssatz: {
      'zhendao': 'In Zhendao grüßt man dich auf dem Markt mit Namen',
      'basingse': 'Selbst im Oberen Ring hat man von dir gehört',
      'omashu': 'Die Postboten auf den Rutschen winken dir zu',
      'siwongwueste': 'Die Sandsegler teilen ihr Wasser mit dir',
      'taku': 'Im Hafen von Taku hält man dir einen Platz am Kai frei',
      'gaoling': 'In Gaoling öffnen sich für dich auch die besseren Türen',
      'kyoshiinseln': 'Die Kriegerinnen der Insel nicken dir zu',
      'agnaqela': 'Man lädt dich an die Feuer der Familien ein',
      'sikua': 'Im Eisdorf gibt es für dich immer eine warme Decke',
      'suedlicherwasserstamm': 'Die Kinder des Stammes kennen deine Geschichten',
      'nebelsumpf': 'Der Sumpf scheint dich wiederzuerkennen',
      'haribulkan': 'Auf den Straßen von Hari Bulkan senkt man vor dir nicht mehr den Blick',
      'shujing': 'In Shu Jing nennt man dich einen Freund des Ortes',
      'janghui': 'Die Fischer von Jang Hui vertrauen dir ihre Boote an',
      'ascheninseln': 'Auf den Aschen-Inseln erzählt man sich Geschichten über dich',
      'noerdlicherlufttempel': 'Die Mönche teilen ihren Tee mit dir',
      'oestlicherlufttempel': 'Die Nonnen heißen dich willkommen wie eine der Ihren',
      'westlicherlufttempel': 'Unter den Felsen des Tempels bist du kein Fremder mehr',
      'suedlicherlufttempel': 'Die Windglocken des Tempels klingen für dich vertraut'
    }
  };
  var okey = function(s){ return rnorm(s).replace(/\s+/g, ''); };
  function ortName(raw){ var k = okey(raw); return BEKANNT.namen[k] || String(raw).trim(); }
  function beschreibung(ort, n, pts){
    var f = BEKANNT.faktor[okey(ort)] || 1, st = -1;
    BEKANNT.stufen.forEach(function(s, i){ if(n >= s.ab * f) st = i; });
    if(st < 0) return '';
    var top = st === BEKANNT.stufen.length - 1, t = (top && BEKANNT.ortssatz[okey(ort)]) || BEKANNT.stufen[st].text;
    var T = BEKANNT.ton;
    return t + (pts >= T.gut ? ', ' + T.gutText : pts <= T.schlecht ? ', ' + T.schlechtText : '') + '.';
  }
  function rufHtml(lines, names, home){
    var keys = []; names.forEach(function(n){ nameKeys(n).forEach(function(k){ if(keys.indexOf(k) < 0) keys.push(k); }); });
    var hits = function(l){ return l.chars.some(function(c){ return nameKeys(c).some(function(k){ return keys.indexOf(k) > -1; }); }); };
    var mine = lines.filter(hits).sort(function(a, b){ return b.t - a.t; });
    if(!mine.length && !home) return '<div class="cc-empty">Noch keine Spuren im Rufbuch.</div>';
    var orte = {}, order = [], hk = home ? okey(home) : '';
    mine.forEach(function(l){ var nm = ortName(l.ort), k = okey(nm); if(!orte[k]){ orte[k] = { ort: nm, n: 0, p: 0 }; order.push(k); } orte[k].n++; orte[k].p += l.pts; });
    if(hk && !orte[hk]){ orte[hk] = { ort: home, n: 0, p: 0 }; order.push(hk); }
    /* Heimatort: zaehlt ab der eingestellten Stufe, weitere Eintraege kommen obendrauf */
    order.forEach(function(k){ var o = orte[k]; o.eff = o.n + (k === hk ? (BEKANNT.stufen[BEKANNT.heimat] || { ab: 0 }).ab * (BEKANNT.faktor[k] || 1) : 0); });
    order.sort(function(a, b){ return (b === hk) - (a === hk) || orte[b].eff - orte[a].eff || orte[b].p - orte[a].p; });
    var sign = function(p){ return '<b class="' + (p < 0 ? 'cc-minus' : 'cc-plus') + '">' + (p > 0 ? '+' : p < 0 ? '−' : '±') + Math.abs(p) + '</b>'; };
    var h = '<ul class="cc-places">' + order.map(function(k){
      var o = orte[k], isHome = k === hk;
      return '<li><span class="cc-pn">' + esc(o.ort) + '</span><span class="cc-pk">' + (isHome ? 'Heimat' : 'besucht') + '</span><span class="cc-pd">' + esc(beschreibung(o.ort, o.eff, o.p)) + '</span><span class="cc-pm">' + (o.n ? o.n + (o.n === 1 ? ' Eintrag' : ' Einträge') + ' · ' + sign(o.p) : 'noch keine Einträge') + '</span></li>';
    }).join('') + '</ul>';
    if(mine.length){
      h += '<ul class="cc-buch">' + mine.slice(0, RUF.zeigen).map(function(l){
        var d = new Date(l.t);
        return '<li><span class="cc-bd">' + ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear() + '</span><span class="cc-bo">' + esc(ortName(l.ort)) + ' ' + sign(l.pts) + '</span>' + (l.anlass ? '<span class="cc-ba">' + esc(l.anlass) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
      h += '<div class="cc-weiter">' + (mine.length > RUF.zeigen ? 'und ' + (mine.length - RUF.zeigen) + ' weitere Einträge im ' : 'Alles nachlesen im ') + '<a href="/h5-gesellschaftliche-stimmung">Rufbuch</a></div>';
    }
    return h;
  }
  /* ===== Heimatort: aus "Herkunft:" in der Chronik oder aus dem verlinkten Steckbrief (zuerst im Block [Steckbriefdaten]) ===== */
  var ORTE = [ ['Zhendao', 'Zhendao', 'Stadt der Vier Nationen', 'Zentralstadt'], ['Nördlicher Lufttempel'], ['Östlicher Lufttempel'], ['Westlicher Lufttempel'], ['Südlicher Lufttempel'],
    ["Agna Qel'a"], ["Siku'a", 'Eisdorf'], ['Südlicher Wasserstamm'], ['Nebelsumpf'], ['Taku'], ['Ba Sing Se'], ['Omashu'], ['Si-Wong-Wüste', 'Si Wong'], ['Gaoling'],
    ['Kyoshi-Inseln', 'Kyoshi'], ['Hari Bulkan'], ['Shu Jing'], ['Jang Hui'], ['Aschen-Inseln', 'Aschen', 'Ember-Inseln', 'Ember'] ];
  var HKEY = /^[ \t]*(?:\[b\])?[ \t]*(herkunft|heimat|heimatort|geburtsort|aufgewachsen in|stammt aus)[ \t]*(?:\[\/b\])?[ \t]*:[ \t]*([^\n]+)/im;
  function placeIn(v){
    var s = okey(v), best = null, len = 0;
    ORTE.forEach(function(o){ o.forEach(function(n){ var k = okey(n); if(k && s.indexOf(k) > -1 && k.length > len){ best = o[0]; len = k.length; } }); });
    return best;
  }
  async function homeOf(box){
    var own = box.getAttribute('data-home'); if(own) return placeIn(own);
    var sb = box.getAttribute('data-sb') || ''; sb = sb.replace(/^https?:[/][/]([^/]+)/i, function(a, host){ return host === location.host ? '' : a; });
    if(!/^[/]t\d+/.test(sb)) return null;
    var ck = 'tesHeimat2_' + sb.match(/^[/]t(\d+)/)[1];
    try{ var c = JSON.parse(localStorage.getItem(ck) || 'null'); if(c && Date.now() - c.at < 7 * 864e5) return c.h || null; }catch(e){ e = null; }
    var home = null;
    try{
      var r = await fetch(sb, { credentials:'same-origin' }), d = new DOMParser().parseFromString(await r.text(), 'text/html');
      var post = d.querySelector('div.post[id^="p"] .content, .postbody .content');
      if(post){ var tmp = document.createElement('div'); tmp.innerHTML = post.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|td)>/gi, '\n'); var tx = tmp.textContent || '', db = tx.match(/\[\s*steckbriefdaten\s*\]([\s\S]*?)\[\s*\/\s*steckbriefdaten\s*\]/i), m = (db && db[1].match(HKEY)) || tx.match(HKEY); if(m) home = placeIn(m[2]); }
    }catch(e){ home = null; }
    try{ localStorage.setItem(ck, JSON.stringify({ at: Date.now(), h: home || '' })); }catch(e){ e = null; }
    return home;
  }
  function fillRuf(){
    var boxes = document.querySelectorAll('.cc-ruf[data-name]:not([data-done])');
    if(!boxes.length) return;
    boxes.forEach(function(b){ b.setAttribute('data-done', '1'); });
    loadBook().then(function(lines){
      boxes.forEach(function(b){ homeOf(b).then(function(home){
        b.innerHTML = rufHtml(lines, [b.getAttribute('data-name'), b.getAttribute('data-account') || ''].filter(Boolean), home);
        var w = b.closest('.cc-wrap'), hm = w && w.querySelector('.cc-heim');
        if(hm && home){ hm.querySelector('span').textContent = 'Heimat: ' + home; hm.classList.remove('cc-aus'); }
      }); });
    }).catch(function(){ boxes.forEach(function(b){ b.innerHTML = '<div class="cc-empty">Das Rufbuch konnte gerade nicht gelesen werden.</div>'; }); });
  }
  function boot(){ run(); fillRuf(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
