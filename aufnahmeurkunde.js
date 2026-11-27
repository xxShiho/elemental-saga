/* Aufnahmeurkunde fuer angenommene Bewerbungen: ersetzt [Angenommen] in Beitraegen durch die Urkunde mit den naechsten Schritten; schlichte Karte fuer abgelehnte Bewerbungen
   Eigene Steckbrief-Designs: Name, Nation, Kraftquelle, Titelbild, Spieler/in und Originalaussehen kommen bevorzugt aus [Steckbriefdaten]. */
(function(){
  var CHRONIK = '/f63-charakterchroniken';
  var AVATARE = '/t101-avatarliste-eintragungen-ubersicht';
  var TB_FALLBACK = '/f54-trainingsbucher';
  /* ===== Aufnahmeurkunde: ersetzt [Angenommen] ===== */
  var NAT_INFO = {
    feuer:  { wort:'aus der Feuernation',      ink:'#a8261d', c:'#ff4c4c' },
    wasser: { wort:'aus den Wasserst\u00e4mmen', ink:'#0a6596', c:'#00bbff' },
    erde:   { wort:'aus dem Erdk\u00f6nigreich',  ink:'#1d7a45', c:'#2fd677' },
    luft:   { wort:'von den Luftnomaden',      ink:'#9a6512', c:'#F7B955' }
  };
  /* Ingame-Zeit auf der Urkunde: bei Bedarf anpassen */
  var INGAME_ZEIT = 'im Jahr 4 n.G.K.';
  function escH(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){ return '&#' + ch.charCodeAt(0) + ';'; }); }
  function autorVon(post){
    var a = post ? (post.querySelector('.postbody p.author a[href*="/u"]') || post.querySelector('.postprofile a[href*="/u"]')) : null;
    return a ? a.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function titelNation(t){
    var v = String(t || '').toLowerCase();
    return /feuer/.test(v) ? 'feuer' : /wasser/.test(v) ? 'wasser' : /erdk|erdnation|- *erde/.test(v) ? 'erde' : /luft|nomad/.test(v) ? 'luft' : '';
  }
  function urkundeCss(){
    if(document.getElementById('tes-uk-css')) return;
    var s = document.createElement('style'); s.id = 'tes-uk-css';
    var P = '.tes-uk.tes-uk ';
    s.textContent = [
      '.tes-uk.tes-uk{max-width:40rem!important;margin:.6rem auto!important;font-family:Inter,sans-serif!important;font-style:normal!important;text-transform:none!important;letter-spacing:normal!important;text-align:left!important;line-height:1.6!important}',
      P + '.uk-blatt{position:relative!important;margin:0 0 1.4rem!important;padding:2rem 2.2rem 1.5rem!important;border-radius:4px!important;background:linear-gradient(172deg,#f1e6c8,#e4d3aa)!important;color:#2b2114!important;box-shadow:0 10px 28px rgba(0,0,0,.6),inset 0 0 40px rgba(130,90,30,.2)!important;text-align:center!important}',
      P + '.uk-blatt:before{content:""!important;position:absolute!important;inset:9px!important;border:1px solid rgba(122,82,30,.45)!important;border-radius:2px!important;box-shadow:inset 0 0 0 3px rgba(241,230,200,.6),inset 0 0 0 4px rgba(122,82,30,.25)!important;pointer-events:none!important}',
      P + '.uk-blatt *{-webkit-hyphens:none!important;hyphens:none!important}',
      P + '.uk-kopf,' + P + '.uk-titel,' + P + '.uk-text,' + P + '.uk-name,' + P + '.uk-gruss,' + P + '.uk-weiter-h{text-align:center!important}',
      P + '.uk-kopf{font-family:"Bruno Ace SC",sans-serif!important;font-size:.72rem!important;letter-spacing:.18em!important;text-transform:uppercase!important;color:#7a531c!important;margin:0!important}',
      P + '.uk-titel{font-family:"Dancing Script",cursive!important;font-size:2.3rem!important;font-weight:700!important;line-height:1.15!important;color:#5c3a10!important;margin:.2rem 0 .9rem!important}',
      P + '.uk-zier{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;margin:0 0 1rem!important}',
      P + '.uk-zier i{display:block!important;width:7px!important;height:7px!important;border-radius:50%!important;background:var(--c)!important;box-shadow:0 0 0 1px rgba(0,0,0,.25)!important}',
      P + '.uk-zier:before,' + P + '.uk-zier:after{content:""!important;flex:0 1 90px!important;height:1px!important;background:linear-gradient(90deg,transparent,rgba(122,82,30,.55))!important}',
      P + '.uk-zier:after{background:linear-gradient(270deg,transparent,rgba(122,82,30,.55))!important}',
      P + '.uk-text{max-width:30rem!important;margin:0 auto!important;font-size:1.02rem!important;line-height:1.75!important;color:#2b2114!important}',
      P + '.uk-name{display:block!important;margin:.35rem 0 .2rem!important;font-family:"Bruno Ace SC",sans-serif!important;font-size:1.5rem!important;letter-spacing:.04em!important;color:var(--ink,#2b2114)!important}',
      P + '.uk-nat{font-weight:600!important;color:var(--ink,#2b2114)!important}',
      P + '.uk-gruss{margin:.8rem 0 0!important;font-style:italic!important;color:#4a3820!important}',
      P + '.uk-fuss{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:12px!important;margin:1.4rem 0 0!important}',
      P + '.uk-fuss>div{flex:1 1 0!important;min-width:0!important;font-size:.82rem!important;line-height:1.45!important;color:#4a3820!important}',
      P + '.uk-ort{text-align:left!important}',
      P + '.uk-sign{text-align:right!important}',
      P + '.uk-hand{display:block!important;text-align:right!important;font-family:"Dancing Script",cursive!important;font-size:1.45rem!important;font-weight:700!important;line-height:1.1!important;color:#2b2114!important;border-bottom:1px solid rgba(43,33,20,.45)!important;padding:0 4px 2px!important;margin:0 0 3px!important}',
      P + '.uk-fuss>.uk-siegel{flex:0 0 auto!important;display:flex!important;align-items:center!important;justify-content:center!important;width:6.9rem!important;height:6.9rem!important;border-radius:50%!important;background:radial-gradient(circle at 38% 32%,#c4473b,#8e241c 62%,#6e1a14)!important;box-shadow:0 3px 8px rgba(0,0,0,.45),inset 0 0 0 4px rgba(0,0,0,.12)!important;transform:rotate(-9deg)!important}',
      P + '.uk-siegel span{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;width:5.9rem!important;height:5.9rem!important;border:1px dashed rgba(255,226,200,.55)!important;border-radius:50%!important}',
      P + '.uk-siegel b{display:block!important;margin:0!important;padding:0!important;white-space:nowrap!important;-webkit-hyphens:none!important;hyphens:none!important;word-break:keep-all!important;overflow-wrap:normal!important;text-align:center!important;line-height:1!important;font-family:"Bruno Ace SC",sans-serif!important;font-weight:400!important;font-size:.54rem!important;letter-spacing:.02em!important;color:#ffe9d4!important;text-transform:uppercase!important}',
      P + '.uk-siegel em{display:flex!important;gap:3px!important}',
      P + '.uk-siegel em i{display:block!important;width:5px!important;height:5px!important;border-radius:50%!important;background:var(--c)!important}',
      P + '.uk-weiter-h{display:flex!important;align-items:center!important;gap:1rem!important;margin:0 0 1rem!important;font-family:"Bruno Ace SC",sans-serif!important;font-size:1rem!important;letter-spacing:.1em!important;color:#c2a75d!important}',
      P + '.uk-weiter-h:before,' + P + '.uk-weiter-h:after{content:""!important;flex:1!important;height:1px!important;background:linear-gradient(to right,transparent,rgba(194,167,93,.5))!important}',
      P + '.uk-weiter-h:after{background:linear-gradient(to left,transparent,rgba(194,167,93,.5))!important}',
      P + '.uk-weg{padding:1.2rem 1.4rem .9rem!important;border:1px solid rgba(194,167,93,.32)!important;border-radius:16px!important;background:rgb(10,8,5)!important;color:#d6d0c3!important}',
      P + '.uk-schritt{display:flex!important;gap:.9rem!important;align-items:flex-start!important;margin:0 0 .95rem!important}',
      P + '.uk-nr{flex:0 0 2rem!important;height:2rem!important;border:1px solid rgba(194,167,93,.5)!important;border-radius:50%!important;text-align:center!important;font-family:"Bruno Ace SC",sans-serif!important;font-size:.8rem!important;line-height:2rem!important;color:#c2a75d!important}',
      P + '.uk-st{flex:1!important;min-width:0!important}',
      P + '.uk-st b{display:block!important;margin:0 0 .1rem!important;font-family:"Bruno Ace SC",sans-serif!important;font-weight:400!important;font-size:.84rem!important;letter-spacing:.06em!important;color:#c2a75d!important}',
      P + '.uk-st div{font-size:.93rem!important;line-height:1.7!important;color:#d6d0c3!important}',
      P + '.uk-st a{font-weight:600!important;color:#c2a75d!important;text-decoration:none!important;border-bottom:1px dotted rgba(194,167,93,.6)!important}',
      P + '.uk-st strong{font-weight:600!important;color:#e0c77d!important}',
      P + '.uk-ende{margin:.3rem 0 0!important;padding:.8rem 0 0!important;border-top:1px solid rgba(194,167,93,.15)!important;text-align:center!important;font-style:italic!important;font-size:.88rem!important;color:#aaa392!important}',
      '@media(max-width:560px){' + P + '.uk-blatt{padding:1.6rem 1.2rem 1.3rem!important}' + P + '.uk-fuss{flex-wrap:wrap!important;justify-content:center!important}' + P + '.uk-fuss>div{flex:1 1 100%!important;text-align:center!important}' + P + '.uk-hand{display:block!important;text-align:center!important;width:fit-content!important;min-width:9rem!important;margin:.4rem auto 3px!important}' + P + '.uk-fuss>.uk-siegel{order:-1!important;margin:0 calc(50% - 3.45rem) .4rem!important}' + P + '.uk-titel{font-size:1.9rem!important}}',
      /* schlichte Ablehnung */
      '.tes-ab.tes-ab{max-width:36rem!important;margin:.5rem auto!important;padding:1rem 1.3rem!important;border:1px solid rgba(160,154,140,.32)!important;border-left:3px solid rgba(160,154,140,.6)!important;border-radius:12px!important;background:rgba(10,8,5,.75)!important;font-family:Inter,sans-serif!important;font-style:normal!important;text-transform:none!important;letter-spacing:normal!important;text-align:left!important;color:#cfc8b8!important;line-height:1.65!important}',
      '.tes-ab.tes-ab .ab-t{margin:0 0 .3rem!important;font-family:"Bruno Ace SC",sans-serif!important;font-size:.9rem!important;letter-spacing:.06em!important;color:#d9d2c2!important}',
      '.tes-ab.tes-ab .ab-x{font-size:.93rem!important;color:#cfc8b8!important}',
      '.tes-ab.tes-ab .ab-f{margin:.55rem 0 0!important;font-size:.84rem!important;color:#a39c8c!important}',
      '.tes-ab.tes-ab a{color:#c2a75d!important;font-weight:600!important;text-decoration:none!important}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }
  var ZIER = '<span class="uk-zier"><i style="--c:#F7B955"></i><i style="--c:#00bbff"></i><i style="--c:#2fd677"></i><i style="--c:#ff4c4c"></i></span>';
  var SIEGEL_PUNKTE = '<em><i style="--c:#F7B955"></i><i style="--c:#00bbff"></i><i style="--c:#2fd677"></i><i style="--c:#ff4c4c"></i></em>';
  function verweis(h, t){ return '<a href="' + h + '">' + t + '</a>'; }
  function urkunde(c, tb){
    var stempelPost = c.closest('div.post');
    var posts = postsOf(document), erster = posts[0] && !posts[0].el.contains(c) ? posts[0].el : null;
    var titel = (document.querySelector('h1.page-title, h2.topic-title, .page-title') || { textContent:'' }).textContent.replace(/\s+/g, ' ').trim();
    var text1 = erster ? textOf(erster.querySelector('.content')) : '';
    var name = plain(fieldOf(text1, 'Name')) || (erster ? autorVon(erster) : '') || cleanName(titel);
    var nat = NAT_INFO[nationOf(text1)] || NAT_INFO[titelNation(titel)] || null;
    var wer = autorVon(stempelPost) || 'das Team';
    var natHtml = nat ? ' <span class="uk-nat">' + nat.wort + '</span>' : '';
    return '<div class="tes-uk"' + (nat ? ' style="--ink:' + nat.ink + '"' : '') + '>'
      + '<div class="uk-blatt">'
      + '<div class="uk-kopf">Verwaltung von Zhendao</div>'
      + '<div class="uk-titel">Aufnahmeurkunde</div>' + ZIER
      + '<div class="uk-text">Hiermit nimmt die Verwaltung<span class="uk-name">' + escH(name || 'unseren Neuzugang') + '</span>' + natHtml + ' in die Stadt der Vier Nationen auf.'
      + '<div class="uk-gruss">Willkommen in Zhendao! M\u00f6ge dein Weg hier ein guter sein.</div></div>'
      + '<div class="uk-fuss"><div class="uk-ort">Ausgestellt in Zhendao<br>' + INGAME_ZEIT + '</div>'
      + '<div class="uk-siegel"><span>' + SIEGEL_PUNKTE + '<b>Angenommen</b></span></div>'
      + '<div class="uk-sign"><span class="uk-hand">' + escH(wer) + '</span>f\u00fcr die Verwaltung</div></div>'
      + '</div>'
      + '<div class="uk-weiter-h">So geht es weiter</div>'
      + '<div class="uk-weg">'
      + '<div class="uk-schritt"><span class="uk-nr">1</span><div class="uk-st"><b>Deine Papiere einreichen</b><div>Klicke unten auf den Button <strong>Steckbrief ver\u00f6ffentlichen und Chronik anlegen</strong>. Dein Steckbrief erscheint dann unter ' + verweis('/f10-charaktere-des-forums', 'Charaktere des Forums') + ', deine ' + verweis(CHRONIK, 'Charakterchronik') + ' wird angelegt, dein Trainingsbuch und dein Profil werden verlinkt, du wirst in die ' + verweis(AVATARE, 'Avatarliste') + ' eingetragen und eine Reservierung wird gel\u00f6scht. Alles geschieht in deinem Namen. Das dauert etwa eine bis anderthalb Minuten. Lass die Seite bitte so lange ge\u00f6ffnet, bis \u201eGeschafft\u201c erscheint. Danach sperrt das Team deinen Steckbrief, sp\u00e4tere \u00c4nderungen laufen \u00fcber ein Charakterupdate.</div></div></div>'
      + '<div class="uk-schritt"><span class="uk-nr">2</span><div class="uk-st"><b>Deine Chronik beginnen</b><div>Deine Chronik ist schon angelegt. Erg\u00e4nze dort im Spiel nach und nach eigene Worte zu deinen abgeschlossenen Szenen oder Meilensteine deines Charakters.</div></div></div>'
      + '<div class="uk-schritt"><span class="uk-nr">3</span><div class="uk-st"><b>Gesellschaft finden</b><div>Hast du noch niemanden zum Spielen gefunden, nutze unten den Button <strong>Spielpartner suchen</strong>. Dann ist dein Eintrag f\u00fcr die ' + verweis('/t105-', 'Suche nach Spielpartnern') + ' schon vorbereitet.</div></div></div>'
      + '<div class="uk-schritt"><span class="uk-nr">4</span><div class="uk-st"><b>Deine erste Szene</b><div>W\u00e4hle einen Ort, kopiere die ' + verweis('/t106-szenenvorlage#253', 'Szenenvorlage') + ' in den ersten Beitrag und leg los.</div></div></div>'
      + '<div class="uk-ende">Viel Spa\u00df beim Spielen! Bei Fragen ist das Team jederzeit f\u00fcr dich da.</div>'
      + '</div></div>';
  }
  function restNach(c, re){
    var k = c.cloneNode(true);
    var s = Array.prototype.filter.call(k.querySelectorAll('strong, b'), function(x){ return re.test(x.textContent || ''); })[0];
    if(s){
      var n = s.nextSibling;
      while(n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim()))){ var nx = n.nextSibling; n.parentNode.removeChild(n); n = nx; }
      s.parentNode.removeChild(s);
    }
    return k.innerHTML;
  }
  /* ===== schlichte Ablehnung: "\u2716 Bewerbung abgelehnt" ===== */
  function ablehnungen(){
    document.querySelectorAll(SEL).forEach(function(c){
      if(c.getAttribute('data-tesab') || c.closest('[data-tesab], blockquote, .quote, .codebox')) return;
      var t = (c.textContent || '').replace(/^\s+/, '');
      if(t.indexOf('\u2716 Bewerbung abgelehnt') !== 0) return;
      var orig = c.textContent;
      var rest = restNach(c, /\u2716\s*Bewerbung abgelehnt/);
      c.setAttribute('data-tesab', '1'); c.setAttribute('data-tesst', '1');
      c.innerHTML = '<div class="tes-ab"><div class="ab-t">Bewerbung nicht angenommen</div><div class="ab-x">' + rest + '</div>'
        + '<div class="ab-f">Fragen dazu? Schreib dem Team gern eine PN.</div><span style="display:none">' + escH(orig) + '</span></div>';
    });
  }
  var SEL = '.postbody .content, .post-entry, .content';
  function tbLink(){
    var posts = document.querySelectorAll(SEL), i, j, as, a, h;
    for(i = 0; i < posts.length; i++){
      if(posts[i].closest('[data-tesst]')) continue;
      as = posts[i].querySelectorAll('a[href]');
      for(j = 0; j < as.length; j++){
        a = as[j]; h = a.getAttribute('href') || '';
        if(/\/t\d+/.test(h) && /trainingsb/i.test(decodeURIComponent(h) + ' ' + (a.textContent || ''))) return h;
      }
    }
    return TB_FALLBACK;
  }
  /* Trainingsbuch des Bewerbers in f54 suchen, falls die Bewerbung keinen Link enthaelt */
  async function findTrainingsbuch(uid, name){
    var hit = tbLink(); if(hit !== TB_FALLBACK) return hit;
    var n = String(name || '').toLowerCase().replace(/[^a-z0-9\u00e4\u00f6\u00fc\u00df]/g, '');
    var clean = function(t){ return String(t || '').toLowerCase().replace(/trainingsbuch/g, '').replace(/[^a-z0-9\u00e4\u00f6\u00fc\u00df]/g, ''); };
    var path = TB_FALLBACK, seen = {}, byUid = '';
    for(var page = 0; page < 6 && path; page++){
      var d = parse(await getText(path)), next = '';
      var links = d.querySelectorAll('a.topictitle'); if(!links.length) links = d.querySelectorAll('a[href^="/t"]');
      for(var i = 0; i < links.length; i++){
        var a = links[i], h = (a.getAttribute('href') || '').replace(/^https?:[/][/][^/]+/, '').replace(/#.*$/, '');
        if(!/^[/]t\d+-/.test(h)) continue;
        if(n && clean(a.textContent) === n) return h;
        var row = a.closest('li, tr, dl');
        if(!byUid && uid && row && row.querySelector('a[href="/u' + uid + '"], a[href$="/u' + uid + '"]')) byUid = h;
      }
      d.querySelectorAll('a[href*="/f54p"]').forEach(function(x){ var hh = (x.getAttribute('href') || '').replace(/^https?:[/][/][^/]+/, ''); if(!seen[hh] && !next){ seen[hh] = 1; next = hh; } });
      path = next;
    }
    return byUid || TB_FALLBACK;
  }
  /* Ein Thema sperren, mit dem Sperr-Link von dessen eigener Seite */
  async function lockTopic(tid){
    var d = parse(await getText('/t' + tid + '-'));
    var a = Array.prototype.filter.call(d.querySelectorAll('a[href*="modcp"]'), function(x){ return /mode=lock(&|$)/.test((x.getAttribute('href') || '').replace(/&amp;/g, '&')); })[0];
    if(!a){
      if(Array.prototype.some.call(d.querySelectorAll('a[href*="modcp"]'), function(x){ return /mode=unlock(&|$)/.test(x.getAttribute('href') || ''); })) return true;
      throw new Error('Sperr-Link im Steckbrief nicht gefunden');
    }
    var f = parse(await getText(a.getAttribute('href').replace(/&amp;/g, '&'))).querySelector('form[action*="modcp"]');
    if(f && f.querySelector('input[type=submit]')) await modForm(f);
    return true;
  }
  /* ===== Ein-Klick-Veroeffentlichung fuer den Bewerber ===== */
  var F_STECKBRIEF = 10, F_CHRONIK = 63, T_AVATAR = 101, T_RESERV = 22, T_PARTNER = 105;
  var F_BEWERBUNG = 8, F_ANGENOMMEN = 22, F_ABGELEHNT = 23;
  var SLEEPX = window.TES_FAST ? 50 : 12000, SLEEPY = window.TES_FAST ? 50 : 20000;
  var CHRONIK_TPL = ['[Charakterchronik]', 'Charakter: %NAME%', 'Bild: %BILD%', 'Steckbrief: [url=%SB%]Steckbrief[/url]', 'Trainingsbuch: [url=%TB%]Trainingsbuch[/url]', '', 'Szenenchronik:', '- Ingame-Zeit | [url=LINK ZUR SZENE]Titel der Szene[/url] | Ein Satz, was passiert ist.', '', 'Meilensteine:', '- Ingame-Zeit | Was hat sich ver\u00e4ndert?', '[/Charakterchronik]'].join('\n');
  var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var parse = function(t){ return new DOMParser().parseFromString(t, 'text/html'); };
  var getText = function(u){ return fetch(u, { credentials:'same-origin' }).then(function(r){ if(!r.ok) throw new Error('Seite nicht erreichbar (' + r.status + ')'); return r.text(); }); };
  function myId(){ try{ return +window._userdata.user_id || 0; }catch(e){ return 0; } }
  function topicId(){ var m = location.pathname.match(/^[/]t([0-9]+)/); return m ? +m[1] : 0; }
  function postsOf(doc){
    return Array.prototype.map.call(doc.querySelectorAll('div.post[id^="p"]'), function(p){
      var a = p.querySelector('.postbody p.author a[href^="/u"]') || p.querySelector('.postprofile a[href^="/u"]');
      var img = p.querySelector('.postprofile dt img');
      return { pid: +(p.id.replace(/[^0-9]/g, '')), uid: a ? +((a.getAttribute('href').match(/[0-9]+/) || [0])[0]) : 0, ava: img ? img.getAttribute('src') : '', el: p };
    }).filter(function(x){ return x.pid; });
  }
  async function rawPost(pid){
    var d = parse(await getText('/post?p=' + pid + '&mode=editpost'));
    var ta = d.querySelector('form[name=post] textarea[name=message], textarea#text_editor_textarea');
    var sj = d.querySelector('form[name=post] input[name=subject]');
    if(!ta) throw new Error('Der Text von Beitrag ' + pid + ' konnte nicht gelesen werden. Darfst du ihn noch bearbeiten?');
    return { message: ta.value || ta.textContent || '', subject: sj ? sj.value : '' };
  }
  function findTopic(html, url){
    var src = String(url || '') + ' ' + html;
    var m = src.match(/http-equiv="refresh"[^>]*url=[^"]*?[/]t([0-9]+)/i) || String(url || '').match(/[/]t([0-9]+)/) || src.match(/viewtopic[?]t=([0-9]+)/) || src.match(/href="[^"]*?[/]t([0-9]+)(?:p[0-9]+)?-[^"#]*#[0-9]+"/);
    return m ? +m[1] : 0;
  }
  async function submit(formUrl, subject, message, needTopic, say){
    for(var attempt = 1; attempt <= 6; attempt++){
      var d = parse(await getText(formUrl)), f = d.querySelector('form[name=post]');
      if(!f) throw new Error('Kein Schreib-Formular gefunden. Hast du dort Schreibrechte?');
      var fd = new FormData();
      f.querySelectorAll('input[type=hidden]').forEach(function(i){ if(i.name) fd.append(i.name, i.value); });
      if(subject != null) fd.set('subject', subject);
      fd.set('message', message);
      var btn = f.querySelector('input[type=submit][name=post]');
      fd.append('post', btn ? btn.value : 'Senden');
      var r = await fetch(f.getAttribute('action') || '/post', { method:'POST', body:fd, credentials:'same-origin' });
      var html = await r.text(), tid = findTopic(html, r.url);
      var txt = (parse(html).querySelector('#page-body .panel, #page-body .message, #page-body p') || { textContent:'' }).textContent.replace(/[ ]+/g, ' ').trim();
      var bad = /sekunden|warten|flood|zu schnell|seconds|fehler|nicht berechtigt|keine berechtigung/i.test(txt);
      if(!bad && (tid || (!needTopic && /erfolgreich|eingetragen|gespeichert/i.test(html)))) return tid || 1;
      if(/sekunden|warten|flood|zu schnell|seconds/i.test(txt) && attempt < 6){ say('Forumieren verlangt eine kurze Pause \u2026 neuer Versuch in 20 Sekunden'); await sleep(SLEEPY); continue; }
      throw new Error(txt || 'Der Beitrag konnte nicht gespeichert werden.');
    }
  }
  async function updateTrainingsbuch(tbHref, appTid, sbTid, say){
    var path = tbHref.replace(/^https?:[^/]*[/][/][^/]+/, '');
    var m = path.match(/^[/]t([0-9]+)/); if(!m) return { ok:false, raw:'' };
    var first = postsOf(parse(await getText('/t' + m[1] + '-')))[0]; if(!first) return { ok:false, raw:'' };
    var editUrl = '/post?p=' + first.pid + '&mode=editpost';
    var raw = await rawPost(first.pid), msg = raw.message, url = location.origin + '/t' + sbTid + '-';
    var re1 = new RegExp('(https?:[^\\s\\]\\[]*)?[/]t' + appTid + '(p[0-9]+)?(-[^\\s\\]\\[#]*)?(#[0-9]+)?', 'g');
    var out = msg.replace(/^([ \t]*(?:\[b\])?[ \t]*Steckbrief[ \t]*(?:\[\/b\])?[ \t]*:)[^\r\n]*$/im, '$1 ' + url);
    if(out === msg) out = msg.replace(re1, url);
    if(out === msg) out = msg.replace(/(steckbrief[^\n]{0,40}?\[url=)[^\]]*(\])/i, '$1' + url + '$2');
    if(out === msg) return { ok:false, raw:msg };
    say('Aktualisiere den Steckbrief-Link in deinem Trainingsbuch \u2026');
    await submit(editUrl, raw.subject, out, false, say);
    return { ok:true, raw:msg };
  }
  async function updateProfile(links, say){
    say('Trage die Links in deinem Profil ein \u2026');
    var d = parse(await getText('/profile?mode=editprofile&page_profil=informations'));
    var f = d.querySelector('form#ucp') || d.querySelector('form[action*="profile"]');
    if(!f) return false;
    var fd = new FormData(), hit = 0;
    f.querySelectorAll('input, textarea, select').forEach(function(el){
      var n = el.name, t = (el.type || '').toLowerCase();
      if(!n || t === 'submit' || t === 'button' || t === 'file' || t === 'image' || t === 'reset') return;
      if((t === 'checkbox' || t === 'radio') && !el.checked) return;
      if(el.tagName === 'SELECT'){ var o = el.querySelector('option[selected]') || el.options[0]; if(o) fd.append(n, o.value); return; }
      var v = el.tagName === 'TEXTAREA' ? el.textContent : el.value;
      var dl = el.closest('dl'), lab = dl && dl.querySelector('dt') ? dl.querySelector('dt').textContent : '';
      Object.keys(links).forEach(function(k){ if(new RegExp(k, 'i').test(lab)){ v = links[k]; hit++; } });
      fd.append(n, v);
    });
    if(!hit) return false;
    var sb = f.querySelector('input[type=submit][name]');
    fd.append(sb ? sb.name : 'submit', sb ? sb.value : 'Absenden');
    var r = await fetch(f.getAttribute('action') || '/profile', { method:'POST', body:fd, credentials:'same-origin' });
    var html = await r.text();
    return r.ok && !/fehler|ung(\u00fc|ue)ltig|error/i.test((parse(html).querySelector('#page-body .error, #page-body p.error') || { textContent:'' }).textContent);
  }
  function cleanName(t){ return String(t || '').replace(/\s*[-\u2013|:]\s*(steckbrief|bewerbung|charakterbewerbung).*$/i, '').replace(/^(steckbrief|bewerbung)\s*[-\u2013|:]\s*/i, '').replace(/\s+[-\u2013|]\s+[^-\u2013|]*(feuer|wasser|erd|luft|nomad|nation|st(\u00e4|ae)mme|k(\u00f6|oe)nigreich|inseln)[^-\u2013|]*$/i, '').trim(); }

  function fieldOf(text, label){
    var re = new RegExp('^[ \\t]*(?:\\[b\\])?[ \\t]*' + label + '[ \\t]*(?:\\[\\/b\\])?[ \\t]*:[ \\t]*(.*)$', 'im');
    var m = String(text || '').match(re); return m ? m[1].trim() : '';
  }
  function plain(v){ return String(v || '').replace(/<[^>]*>/g, '').replace(/\[\/?[a-z*]+(=[^\]]*)?\]/gi, '').trim(); }
  /* Eigene Steckbrief-Designs: Angaben stehen im Block [Steckbriefdaten] und haben Vorrang */
  function daten(msg){ var m = String(msg || '').match(/\[\s*steckbriefdaten\s*\]([\s\S]*?)\[\s*\/\s*steckbriefdaten\s*\]/i); return m ? zeilen(m[1]) : ''; }
  function zeilen(t){ return String(t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|td)>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\[\/?(b|i|u|color|size|font)(=[^\]]*)?\]/gi, ''); }
  function feld(msg, label){ return fieldOf(daten(msg), label) || fieldOf(msg, label) || fieldOf(zeilen(msg), label); }
  function imgOf(v){ var m = String(v || '').match(/\[img\]([^\[\s]+)\[\/img\]/i) || String(v || '').match(/(https?:[^\s\[\]"]+\.(?:png|jpe?g|gif|webp)[^\s\[\]"]*)/i); return m ? m[1] : ''; }
  function urlOf(v){ return imgOf(v) || ((String(v || '').match(/(https?:[^\s\[\]"<>]+)/i) || [])[1] || ''); }
  function textOf(el){ var d = document.createElement('div'); d.innerHTML = (el ? el.innerHTML : '').replace(/<br\s*\/?>/gi, '\n'); return (d.textContent || '').replace(/\u00a0/g, ' '); }
  async function topicDocs(path){
    var first = parse(await getText(path)), docs = [first], seen = {};
    var id = (path.match(/[/]t([0-9]+)/) || [0, ''])[1];
    first.querySelectorAll('a[href]').forEach(function(a){
      var h = a.getAttribute('href') || '', m = h.match(new RegExp('^[/]t' + id + 'p([0-9]+)-'));
      if(m && !seen[m[1]]){ seen[m[1]] = h; }
    });
    for(var k in seen){ try{ docs.push(parse(await getText(seen[k]))); }catch(e){ e = null; } }
    return docs;
  }
  async function findReservation(me, name){
    var docs = await topicDocs('/t' + T_RESERV + '-'), cand = [];
    docs.forEach(function(d, di){ postsOf(d).forEach(function(p, pi){ if(p.uid === me && !(di === 0 && pi === 0)) cand.push(p); }); });
    if(!cand.length) return null;
    var low = String(name || '').toLowerCase();
    var hit = cand.filter(function(p){ var t = textOf(p.el.querySelector('.content')); var n = fieldOf(t, 'Charaktername').toLowerCase(); return n && low && (n.indexOf(low) >= 0 || low.indexOf(n) >= 0); })[0];
    if(!hit && cand.length === 1) hit = cand[0];
    if(!hit) return null;
    var t = textOf(hit.el.querySelector('.content'));
    if(/(^|\n)\s*Status\s*:\s*(angenommen|erledigt|vergeben)/i.test(t)) return null;
    var img = hit.el.querySelector('.content img');
    var ln = Array.prototype.filter.call(hit.el.querySelectorAll('.content a[href]'), function(a){ return /^https?:/i.test(a.getAttribute('href')) && /\.(png|jpe?g|gif|webp)|servimg|imgur|2img|ibb\.co|postimg/i.test(a.getAttribute('href')); })[0];
    var rb = urlOf(fieldOf(t, 'Avatarbild')) || (ln ? ln.getAttribute('href') : '') || (img ? img.getAttribute('src') : '');
    return { pid: hit.pid, herkunft: fieldOf(t, 'Aussehensherkunft'), bild: rb };
  }
  async function closeReservation(pid, say){
    say('Markiere deine Reservierung als angenommen \u2026');
    var raw = await rawPost(pid), msg = raw.message;
    var out = /(^|\n)[ \t]*(?:\[b\])?[ \t]*Status[ \t]*(?:\[\/b\])?[ \t]*:/i.test(msg) ? msg.replace(/^([ \t]*(?:\[b\])?[ \t]*Status[ \t]*(?:\[\/b\])?[ \t]*:)[^\r\n]*$/im, '$1 angenommen') : msg.replace(/\s*$/, '') + '\n\nStatus: angenommen';
    await submit('/post?p=' + pid + '&mode=editpost', raw.subject, out, false, say);
  }
  async function deleteReservation(pid, say){
    say('L\u00f6sche deine Reservierung \u2026');
    var d = parse(await getText('/post?p=' + pid + '&mode=delete'));
    var f = Array.prototype.filter.call(d.querySelectorAll('form'), function(x){ return x.querySelector('input[name=confirm], input[type=submit][value*="Ja"], input[type=submit][value*="ja"]'); })[0];
    if(!f) return false;
    var fd = new FormData();
    f.querySelectorAll('input').forEach(function(el){
      var t = (el.type || '').toLowerCase();
      if(!el.name || t === 'checkbox' || t === 'radio') return;
      if(t === 'submit'){ if(el.name === 'confirm' || /^ja$/i.test(el.value)) fd.append(el.name, el.value); return; }
      fd.append(el.name, el.value);
    });
    if(!fd.has('confirm')) fd.append('confirm', 'Ja');
    var act = f.getAttribute('action') || ('/post?p=' + pid + '&mode=delete');
    await fetch(act, { method:'POST', body:fd, credentials:'same-origin' });
    await sleep(window.TES_FAST ? 50 : 2000);
    var chk = parse(await getText('/post?p=' + pid + '&mode=editpost').catch(function(){ return ''; }));
    return !chk.querySelector('form[name=post] textarea[name=message], textarea#text_editor_textarea');
  }
  function partnerDraft(name, sbUrl){
    return ['Wer sucht einen Spielpartner? ' + (sbUrl ? '[url=' + sbUrl + ']' + name + '[/url]' : name), 'Was wird gesucht: ', 'Bevorzugte Kontaktaufnahme (PN, Discord, Brieftaube): PN', 'Zus\u00e4tzliche Infos und W\u00fcnsche: ', 'Status: offen'].join('\n');
  }
  function partnerBox(name, sbUrl){
    var d = document.createElement('div');
    d.setAttribute('style', 'margin:12px 0 0;padding:12px 0 0;border-top:1px solid rgba(194,167,93,.18);font-size:12.5px;color:rgba(226,218,195,.65)');
    d.innerHTML = 'Noch niemanden zum Spielen gefunden, zum Beispiel \u00fcber Discord oder Gesuche? Dann kannst du dich hier in die Spielpartnersuche eintragen. Die Vorlage ist schon vorbereitet, du erg\u00e4nzt nur noch, was du suchst.<br>'
      + '<button type="button" style="margin-top:8px;padding:6px 18px;border:1px solid rgba(194,167,93,.6);border-radius:20px;background:transparent;color:#c2a75d;font:.62rem &quot;Bruno Ace SC&quot;,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer">Spielpartner suchen</button>';
    d.querySelector('button').addEventListener('click', function(){
      try{ sessionStorage.setItem('tesPartnerDraft', partnerDraft(name, sbUrl)); }catch(e){ e = null; }
      location.href = '/post?t=' + T_PARTNER + '&mode=reply';
    });
    return d;
  }
  function fillPartnerDraft(){
    if(location.pathname !== '/post' || !new RegExp('[?&]t=' + T_PARTNER + '(&|$)').test(location.search) || !/mode=reply/.test(location.search)) return;
    var draft = null; try{ draft = sessionStorage.getItem('tesPartnerDraft'); }catch(e){ draft = null; }
    if(!draft) return;
    var tries = 0;
    (function put(){
      var ta = document.getElementById('text_editor_textarea') || document.querySelector('form[name=post] textarea[name=message]');
      var $ = window.jQuery, inst = null;
      try{ if($ && ta && $(ta).sceditor) inst = $(ta).sceditor('instance'); }catch(e){ inst = null; }
      if(inst && inst.val){ inst.val(draft); }
      else if(ta){ ta.value = draft; }
      if((ta || inst) && tries > 2){ try{ sessionStorage.removeItem('tesPartnerDraft'); }catch(e){ e = null; } return; }
      if(++tries < 12) setTimeout(put, 400);
    })();
  }
  function modUrl(mode, tid){
    var a = Array.prototype.filter.call(document.querySelectorAll('a[href*="modcp"]'), function(x){ var h = x.getAttribute('href') || ''; return new RegExp('mode=' + mode + '(&|$)').test(h) && new RegExp('[?&]t=' + tid + '(&|$)').test(h.replace(/&amp;/g, '&')); })[0];
    if(a) return a.getAttribute('href').replace(/&amp;/g, '&');
    var html = document.documentElement.innerHTML.replace(/&amp;/g, '&');
    var tok = (html.match(/modcp[?][^"'\s<>]*?[?&]tid=([0-9a-zA-Z]+)/) || [])[1];
    var sid = (html.match(/[?&]sid=([0-9a-f]{8,})/i) || [])[1];
    return '/modcp?mode=' + mode + '&t=' + tid + (tok ? '&tid=' + tok : '') + (sid ? '&sid=' + sid : '');
  }
  function sidOf(){ return (document.documentElement.innerHTML.match(/[?&;]sid=([0-9a-f]{8,})/i) || [])[1] || ''; }
  async function modForm(f, extra){
    var fd = new FormData();
    f.querySelectorAll('input').forEach(function(i){ var t = (i.type || '').toLowerCase(); if(!i.name || t === 'submit' || ((t === 'checkbox' || t === 'radio') && !i.checked)) return; fd.append(i.name, i.value); });
    Object.keys(extra || {}).forEach(function(k){ fd.set(k, extra[k]); });
    var go = f.querySelector('input[type=submit][name=confirm]') || f.querySelector('input[type=submit][name]');
    if(go) fd.append(go.name, go.value);
    var r = await fetch(f.getAttribute('action') || '/modcp', { method:'POST', body:fd, credentials:'same-origin' });
    if(!r.ok) throw new Error('Moderationsaktion fehlgeschlagen (' + r.status + ')');
  }
  async function closeAway(tid, fid){
    var d = parse(await getText(modUrl('move', tid)));
    var f = Array.prototype.filter.call(d.querySelectorAll('form[action*="modcp"]'), function(x){ return x.querySelector('select') && (x.querySelector('input[name=confirm]') || x.querySelector('input[name=mode][value=move]') || x.querySelector('select[name=new_forum]')); })[0] || d.querySelector('form[action*="modcp"]'), sel = f ? (f.querySelector('select[name=new_forum]') || f.querySelector('select')) : null;
    if(!f || !sel) throw new Error('Verschieben-Formular nicht gefunden. Siehst du in diesem Thema die Moderations-Werkzeuge?');
    var opt = Array.prototype.filter.call(sel.options, function(o){ return String(o.value).replace(/[^0-9]/g, '') === String(fid); })[0];
    if(!opt) throw new Error('Zielforum f' + fid + ' nicht gefunden.');
    var ex = {}; ex[sel.name] = opt.value; await modForm(f, ex);
    var where = (opt.textContent || '').replace(/^[\s|\-\u2014.]+/, '').trim();
    try{
      var lf = parse(await getText(modUrl('lock', tid))).querySelector('form[action*="modcp"]');
      if(lf && lf.querySelector('input[type=submit]')) await modForm(lf);
    }catch(e){ return where + ' (Schlie\u00dfen hat nicht geklappt)'; }
    return where;
  }
  function addReject(){
    var level = 0; try{ level = +window._userdata.user_level || 0; }catch(e){ level = 0; }
    var tid = topicId(); if(level < 1 || !tid) return;
    if(!document.querySelector('#page-body a[href*="/f' + F_BEWERBUNG + '-"], .breadcrumb-nav a[href*="/f' + F_BEWERBUNG + '-"], a.nav[href*="/f' + F_BEWERBUNG + '-"]')) return;
    var any = Array.prototype.some.call(document.querySelectorAll('div.post .content'), function(x){ var t = x.textContent || ''; return /\[\s*angenommen/i.test(t) || t.indexOf('Bewerbung abgelehnt') >= 0 || x.querySelector('[data-tesst], .tesst'); });
    if(any || document.querySelector('[data-tesst]')) return;
    var first = postsOf(document)[0]; if(!first) return;
    var c = first.el.querySelector('.content'); if(!c) return;
    var box = document.createElement('div');
    box.setAttribute('style', 'max-width:40rem;margin:16px auto 4px;padding:10px 16px;border:1px dashed rgba(255,76,76,.35);border-radius:14px;font:13px/1.6 Inter,sans-serif;color:rgba(226,218,195,.7);text-align:center');
    box.innerHTML = 'Nur f\u00fcr das Team sichtbar. <button type="button" style="margin-left:8px;padding:5px 16px;border:1px solid rgba(255,76,76,.55);border-radius:20px;background:transparent;color:#ff7a7a;font:.6rem &quot;Bruno Ace SC&quot;,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer">Bewerbung ablehnen</button><div class="trj-st" style="font-size:12px"></div>';
    c.appendChild(box);
    var b = box.querySelector('button'), st = box.querySelector('.trj-st');
    b.addEventListener('click', async function(){
      if(b.disabled || !window.confirm('Diese Bewerbung ablehnen, verschieben und schlie\u00dfen?')) return;
      b.disabled = true; b.style.opacity = '.5';
      try{
        st.textContent = 'Schreibe den Hinweis \u2026';
        await submit('/post?t=' + tid + '&mode=reply', null, '[b]\u2716 Bewerbung abgelehnt[/b]\nDie Bewerbung wurde nach \u201eAbgelehnt\u201c verschoben und geschlossen.', false, function(t){ st.textContent = t; });
        st.textContent = 'Verschiebe und schlie\u00dfe \u2026';
        var w = await closeAway(tid, F_ABGELEHNT);
        box.innerHTML = '\u2716 Abgelehnt. Bewerbung verschoben nach \u201e' + w + '\u201c und geschlossen.';
      }catch(err){ st.textContent = '\u2716 ' + err.message; b.disabled = false; b.style.opacity = '1'; }
    });
  }
  /* Hinweis nach dem Veroeffentlichen: Startseite und Willkommens-Checkliste brauchen etwas, bis sie es merken */
  var HINWEIS = '<div style="margin:10px 0 0;padding:8px 12px;border:1px solid rgba(95,208,139,.35);border-radius:10px;background:rgba(95,208,139,.06);font-size:12.5px;line-height:1.5;color:#bfe8cc">Bis alle Daten auf der Startseite stimmen und dein Ankunftsbogen verschwindet, kann es bis zu einer Stunde dauern. Bitte nicht wundern.</div>';
  function addPublish(c){
    var tid = topicId(); if(!tid) return;
    var me = myId(), mine = postsOf(document);
    var first = mine.filter(function(p){ return p.el.querySelector('.content') && !p.el.contains(c); })[0];
    var done = null; try{ done = JSON.parse(localStorage.getItem('tesPub_' + tid) || 'null'); }catch(e){ done = null; }
    var box = document.createElement('div');
    box.setAttribute('style', 'max-width:40rem;margin:14px auto 0;padding:14px 18px;border:1px dashed rgba(194,167,93,.45);border-radius:14px;background:rgba(194,167,93,.05);font:14px/1.6 Inter,sans-serif;color:#e2dac3;text-align:center');
    var link = function(h, t){ return '<a href="' + h + '" style="color:#c2a75d;font-weight:600">' + t + '</a>'; };
    var MARK = 'Steckbrief und Charakterchronik wurden ver\u00f6ffentlicht';
    var markPost = Array.prototype.filter.call(document.querySelectorAll('div.post .content'), function(x){ return (x.textContent || '').indexOf(MARK) >= 0; })[0];
    var level = 0; try{ level = +window._userdata.user_level || 0; }catch(e){ level = 0; }
    var isAuthor = me && first && first.uid === me;
    if(markPost || done){
      var sbA = markPost ? markPost.querySelector('a[href*="/t"]') : null;
      var sbUrl = done ? location.origin + '/t' + done.sb + '-' : (sbA ? sbA.getAttribute('href') : '');
      var nm = (done && done.name) || cleanName((document.querySelector('h1.page-title, h2.topic-title, .page-title') || { textContent:'' }).textContent.trim());
      var inBew = !!document.querySelector('#page-body a[href*="/f' + F_BEWERBUNG + '-"], .breadcrumb-nav a[href*="/f' + F_BEWERBUNG + '-"], a.nav[href*="/f' + F_BEWERBUNG + '-"]');
      var inArch = !!document.querySelector('a.nav[href*="/f' + F_ANGENOMMEN + '-"], .breadcrumb-nav a[href*="/f' + F_ANGENOMMEN + '-"], a.nav[href*="/f' + F_ABGELEHNT + '-"], .breadcrumb-nav a[href*="/f' + F_ABGELEHNT + '-"]');
      if(level >= 1 && markPost && (inArch || !inBew)) return;
      if(level >= 1 && markPost){
        box.innerHTML = 'Der Bewerber hat alles eingetragen.<br><button type="button" style="margin-top:8px;padding:7px 20px;border:1px solid #c2a75d;border-radius:20px;background:#c2a75d;color:#0a0c0a;font:.64rem &quot;Bruno Ace SC&quot;,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer">Steckbrief sperren und Bewerbung archivieren</button><div class="tpub-st" style="margin:8px 0 0;font-size:12.5px;color:rgba(226,218,195,.65)"></div>';
        c.appendChild(box);
        var ab = box.querySelector('button'), ast = box.querySelector('.tpub-st');
        ab.addEventListener('click', async function(){
          if(ab.disabled) return; ab.disabled = true; ab.style.opacity = '.5';
          var sbTid = done ? done.sb : (((sbA && sbA.getAttribute('href')) || '').match(/[/]t([0-9]+)/) || [])[1], lockMsg = '';
          if(sbTid){
            ast.textContent = 'Sperre den Steckbrief \u2026';
            try{ await lockTopic(sbTid); lockMsg = 'Steckbrief gesperrt. '; }catch(e){ lockMsg = 'Steckbrief bitte von Hand sperren (' + e.message + '). '; }
          } else lockMsg = 'Steckbrief nicht gefunden, bitte von Hand sperren. ';
          ast.textContent = 'Verschiebe ins Archiv \u2026';
          try{ var where = await closeAway(tid, F_ANGENOMMEN); setTimeout(function(){ if(box.parentNode) box.parentNode.removeChild(box); }, 6000); box.innerHTML = '\u2713 ' + lockMsg + 'Bewerbung verschoben nach \u201e' + where + '\u201c und geschlossen.'; }
          catch(err){ ast.textContent = '\u2716 ' + err.message; ab.disabled = false; ab.style.opacity = '1'; }
        });
        return;
      }
      if(!isAuthor) return;
      box.innerHTML = '\u2713 Erledigt' + (done ? ': ' + link('/t' + done.sb + '-', 'Dein Steckbrief') + ' \u00b7 ' + link('/t' + done.ch + '-', 'Deine Charakterchronik') : ': Steckbrief und Charakterchronik sind ver\u00f6ffentlicht.') + HINWEIS;
      box.appendChild(partnerBox(nm, sbUrl));
      c.appendChild(box);
      return;
    }
    if(!isAuthor) return;
    box.innerHTML = '<div style="margin:0 0 8px">Mit einem Klick werden Steckbrief, Charakterchronik, Trainingsbuch, Profil, Avatarliste und Reservierung f\u00fcr dich erledigt, alles in deinem Namen.<br><span style="font-size:12.5px;color:rgba(226,218,195,.6)">Das dauert etwa eine bis anderthalb Minuten. Bitte lass die Seite ge\u00f6ffnet, bis \u201eGeschafft\u201c erscheint.</span></div>'
      + '<button type="button" style="padding:8px 22px;border:1px solid #c2a75d;border-radius:20px;background:#c2a75d;color:#0a0c0a;font:.68rem &quot;Bruno Ace SC&quot;,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer">Steckbrief ver\u00f6ffentlichen und Chronik anlegen</button>'
      + '<div class="tpub-st" style="margin:8px 0 0;font-size:12.5px;color:rgba(226,218,195,.65)"></div>';
    c.appendChild(box);
    var b = box.querySelector('button'), st = box.querySelector('.tpub-st');
    var say = function(t){ st.textContent = t; };
    b.addEventListener('click', async function(){
      if(b.disabled) return;
      b.disabled = true; b.style.opacity = '.5';
      try{
        say('Lese deine Bewerbung \u2026');
        var page1 = location.pathname.replace(/^[/]t([0-9]+)p[0-9]+-/, '/t$1-');
        var ps = /^[/]t[0-9]+p[0-9]+-/.test(location.pathname) ? postsOf(parse(await getText(page1))) : mine;
        if(ps.length < 2) throw new Error('Im Thema wurden keine zwei Beitr\u00e4ge gefunden.');
        if(ps[1].uid !== me && !confirm('Beitrag 2 stammt nicht von dir. Trotzdem Beitrag 1 und 2 \u00fcbernehmen?')) throw new Error('Abgebrochen.');
        var p1 = await rawPost(ps[0].pid), p2 = await rawPost(ps[1].pid);
        var title = p1.subject || (document.querySelector('h1.page-title, h2.topic-title, .page-title') || { textContent:'' }).textContent.trim();
        say('Ver\u00f6ffentliche deinen Steckbrief \u2026');
        var sb = await submit('/post?f=' + F_STECKBRIEF + '&mode=newtopic', title, p1.message, true, say);
        if(!sb) throw new Error('Das neue Thema wurde angelegt, aber nicht gefunden. Bitte schau unter Charaktere des Forums nach.');
        var sbUrl = location.origin + '/t' + sb + '-';
        say('Pause, damit Forumieren mitkommt \u2026'); await sleep(SLEEPX);
        say('Setze Teil 2 des Steckbriefs darunter \u2026');
        await submit('/post?t=' + sb + '&mode=reply', null, p2.message, false, say);
        await sleep(SLEEPX);
        var uname0 = ''; try{ uname0 = window._userdata.username || ''; }catch(e){ uname0 = ''; }
        var tb = TB_FALLBACK; try{ say('Suche dein Trainingsbuch \u2026'); tb = await findTrainingsbuch(me, uname0 || cleanName(title)); }catch(e){ tb = tbLink(); }
        var name = cleanName(title) || title, tbOk = false, tbRaw = '';
        if(tb !== TB_FALLBACK){ try{ var tr = await updateTrainingsbuch(tb, tid, sb, say); tbOk = tr.ok; tbRaw = tr.raw; }catch(e){ tbOk = false; } if(tbOk) await sleep(SLEEPX); }
        var charName = plain(feld(p1.message, 'Name')) || plain(fieldOf(tbRaw, 'Name')) || name;
        var nation = plain(feld(p1.message, 'Nation')) || plain(fieldOf(tbRaw, 'Nation'));
        var kraft = plain(feld(p1.message, 'Kraftquelle')) || plain(fieldOf(tbRaw, 'Kraftquelle'));
        var bild = ps[0].ava || imgOf(feld(p1.message, 'Avatarbild')) || imgOf(feld(p1.message, 'Bild')) || imgOf(fieldOf(tbRaw, 'Bild'));
        var spieler = plain(feld(p1.message, 'Spieler/in')) || plain(feld(p1.message, 'Spieler'));
        var aussehen = plain(feld(p1.message, 'Originalaussehen'));
        say('Lege deine Charakterchronik an \u2026');
        var msg = CHRONIK_TPL.split('%NAME%').join(charName).split('%BILD%').join(bild ? '[img]' + bild + '[/img]' : '[img]LINK ZUM BILD[/img]')
          .split('%SB%').join(sbUrl).split('%TB%').join(tb === TB_FALLBACK ? 'LINK' : (tb.charAt(0) === '/' ? location.origin + tb : tb));
        var ch = await submit('/post?f=' + F_CHRONIK + '&mode=newtopic', 'Charakterchronik von ' + charName, msg, true, say);
        try{ localStorage.setItem('tesPub_' + tid, JSON.stringify({ sb:sb, ch:ch, name:charName })); }catch(e){ e = null; }
        var abs = function(h){ return h.charAt(0) === '/' ? location.origin + h : h; };
        var pl = { 'steckbrief': sbUrl };
        if(tb !== TB_FALLBACK) pl['trainingsbuch'] = abs(tb);
        if(ch) pl['chronik'] = location.origin + '/t' + ch + '-';
        var profOk = false;
        try{ await sleep(SLEEPX); profOk = await updateProfile(pl, say); }catch(e){ profOk = false; }
        var res = null, resOk = false, avaOk = false;
        try{ say('Suche deine Reservierung \u2026'); res = await findReservation(me, charName); }catch(e){ res = null; }
        try{
          say('Trage dich in die Avatarliste ein \u2026'); await sleep(SLEEPX);
          var avaBild = (res && res.bild) || urlOf(feld(p1.message, 'Titelbild')) || bild;
          var uname = spieler; if(!uname){ try{ uname = window._userdata.username || ''; }catch(e){ uname = ''; } }
          var herkunft = aussehen || (res && res.herkunft) || plain(feld(p1.message, 'Aussehensherkunft'));
          await submit('/post?t=' + T_AVATAR + '&mode=reply', null, ['Spielername: ' + uname, 'Avatarbild: ' + (avaBild || ''), 'Name des Charakters: ' + charName, 'Aussehensherkunft: ' + herkunft, 'Link zum Steckbrief: [url=' + sbUrl + ']' + charName + '[/url]', 'Nation: ' + nation, 'Kraftquelle: ' + kraft].join('\n'), false, say);
          avaOk = true;
        }catch(e){ avaOk = false; }
        var resDel = false;
        if(res){ try{ await sleep(SLEEPX); resDel = await deleteReservation(res.pid, say); }catch(e){ resDel = false; } if(resDel) resOk = true; else { try{ await sleep(SLEEPX); await closeReservation(res.pid, say); resOk = true; }catch(e){ resOk = false; } } }
        var noted = true;
        try{
          say('Gebe dem Team Bescheid \u2026'); await sleep(SLEEPX);
          await submit('/post?t=' + tid + '&mode=reply', null, '[b]\u2713 ' + MARK + '.[/b]\n\nSteckbrief: [url=' + sbUrl + ']' + title + '[/url]\nCharakterchronik: ' + (ch ? '[url=' + location.origin + '/t' + ch + '-]Charakterchronik von ' + charName + '[/url]' : 'angelegt')
            + (tbOk ? '\nTrainingsbuch: Steckbrief-Link aktualisiert' : '\nTrainingsbuch: Steckbrief-Link bitte pr\u00fcfen')
            + (profOk ? '\nProfil: Links eingetragen' : '\nProfil: Links bitte pr\u00fcfen')
            + (avaOk ? '\nAvatarliste: eingetragen' : '\nAvatarliste: bitte pr\u00fcfen')
            + (res ? (resOk ? (resDel ? '\nReservierung: gel\u00f6scht' : '\nReservierung: als angenommen markiert (L\u00f6schen war nicht m\u00f6glich)') : '\nReservierung: bitte pr\u00fcfen') : '\nReservierung: keine gefunden')
            + '\n\nDieses Thema kann jetzt archiviert werden.', false, say);
        }catch(e){ noted = false; }
        var line = function(ok, yes, no){ return '<br>' + (ok ? '\u2713 ' + yes : '\u2716 ' + no); };
        box.innerHTML = '\u2713 Geschafft! ' + link('/t' + sb + '-', 'Dein Steckbrief') + ' \u00b7 ' + (ch ? link('/t' + ch + '-', 'Deine Charakterchronik') : 'Charakterchronik angelegt')
          + '<div style="margin-top:6px;font-size:12.5px;color:rgba(226,218,195,.65)">'
          + line(tbOk, 'Trainingsbuch verlinkt jetzt deinen neuen Steckbrief.', 'Trainingsbuch: Bitte trag den Steckbrief-Link kurz selbst ein.')
          + line(profOk, 'Dein Profil verlinkt Steckbrief, Trainingsbuch und Charakterchronik.', 'Profil: Bitte trag die Links unter Profil bearbeiten selbst ein.')
          + line(avaOk, 'Du stehst in der Avatarliste.', 'Avatarliste: Bitte trag dich kurz selbst ein.')
          + (res ? line(resOk, resDel ? 'Deine Reservierung wurde gel\u00f6scht.' : 'Deine Reservierung ist als angenommen markiert.', 'Reservierung: Bitte setze sie kurz selbst auf angenommen.') : '')
          + (noted ? '' : '<br>Gib dem Team bitte kurz Bescheid, dass alles erledigt ist.') + '</div>' + HINWEIS;
        box.appendChild(partnerBox(charName, sbUrl));
      }catch(err){
        say('\u2716 ' + (err && err.message ? err.message : 'Unbekannter Fehler'));
        b.disabled = false; b.style.opacity = '1';
      }
    });
  }
  /* ===== Gruppe zuordnen: sobald Administration oder Moderation [Angenommen] setzt =====
     Die Gruppen stehen in TES_GEMEINSAM (nationGruppen, besucherGruppe). */
  var NATION_WORT = [['feuer', 'feuer'], ['wasser', 'wasser'], ['erd', 'erde'], ['luft', 'luft'], ['wind', 'luft']];
  function gem(){ return window.TES_GEMEINSAM || {}; }
  function lowerName(s){ return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function colorHex(el){
    var sp = el ? (el.querySelector('[style*="color"]') || el) : null, st = sp ? (sp.getAttribute('style') || '') : '';
    var m = st.match(/color:\s*#?([0-9a-f]{6})/i); return m ? m[1].toLowerCase() : '';
  }
  function isTeamAuthor(post){
    var a = post.querySelector('.postbody p.author a[href*="/u"]') || post.querySelector('.postprofile a[href*="/u"]');
    if(!a) return false;
    var G = gem(), name = lowerName(a.textContent), col = colorHex(a);
    return (G.team || []).map(lowerName).indexOf(name) >= 0 || (G.teamColors || []).map(function(c){ return String(c).toLowerCase().replace('#', ''); }).indexOf(col) >= 0;
  }
  function nationOf(text){
    var m = String(text || '').match(/(^|\n)[ \t]*Nation[ \t]*:[ \t]*([^\n]+)/i); if(!m) return '';
    var v = m[2].toLowerCase(), hit = NATION_WORT.filter(function(w){ return v.indexOf(w[0]) >= 0; })[0];
    return hit ? hit[1] : '';
  }
  async function groupPage(path){
    var d = parse(await getText(path)), f = d.querySelector('form[name=post]');
    return { doc:d, form:f, name:((d.querySelector('h1.page-title .usr_grp_clr, h1.page-title span[style*="color"]') || d.querySelector('h1.page-title') || {}).textContent || path).trim() };
  }
  function inGroup(gp, uid){ return !!gp.doc.querySelector('table a[href="/u' + uid + '"], table a[href$="/u' + uid + '"]'); }
  async function groupPost(gp, path, extra){
    var fd = new FormData();
    gp.form.querySelectorAll('input[type=hidden]').forEach(function(i){ if(i.name) fd.append(i.name, i.value); });
    Object.keys(extra).forEach(function(k){ fd.append(k, extra[k]); });
    var r = await fetch(gp.form.getAttribute('action') || path, { method:'POST', body:fd, credentials:'same-origin' });
    if(!r.ok) throw new Error('Gruppenseite antwortet nicht (' + r.status + ')');
  }
  async function besucherPath(){
    var G = gem();
    if(G.besucherGruppe) return G.besucherGruppe;
    try{ var c = sessionStorage.getItem('tesBesucherGruppe'); if(c) return c; }catch(e){ e = null; }
    var d = parse(await getText('/groups')), a = Array.prototype.filter.call(d.querySelectorAll('a[href]'), function(x){ return /^[/]g\d+-/.test((x.getAttribute('href') || '').replace(/^https?:[/][/][^/]+/, '')) && /^\s*besucher\s*$/i.test(x.textContent || ''); })[0];
    var p = a ? a.getAttribute('href').replace(/^https?:[/][/][^/]+/, '') : '';
    try{ if(p) sessionStorage.setItem('tesBesucherGruppe', p); }catch(e){ e = null; }
    return p;
  }
  async function assignGroup(c){
    var level = 0; try{ level = +window._userdata.user_level || 0; }catch(e){ level = 0; }
    if(level !== 1 && level !== 2) return;
    var tid = topicId(), stampPost = c.closest('div.post'); if(!tid || !stampPost) return;
    if(!document.querySelector('#page-body a[href*="/f' + F_BEWERBUNG + '-"], .breadcrumb-nav a[href*="/f' + F_BEWERBUNG + '-"], a.nav[href*="/f' + F_BEWERBUNG + '-"]')) return;
    if(!isTeamAuthor(stampPost)) return;
    var G = gem(), groups = G.nationGruppen || {};
    var note = document.createElement('div');
    note.setAttribute('style', 'max-width:40rem;margin:10px auto 0;padding:8px 14px;border:1px dashed rgba(194,167,93,.35);border-radius:12px;font:12.5px/1.6 Inter,sans-serif;color:rgba(226,218,195,.7);text-align:center');
    var say = function(t){ note.innerHTML = 'Nur f\u00fcr das Team: ' + t; };
    c.appendChild(note);
    var done = null; try{ done = JSON.parse(localStorage.getItem('tesGrp_' + tid) || 'null'); }catch(e){ done = null; }
    if(done){ say('\u2713 ' + done.text); return; }
    try{
      say('Ordne den Account der Nation zu \u2026');
      var page1 = location.pathname.replace(/^[/]t([0-9]+)p[0-9]+-/, '/t$1-');
      var first = (/^[/]t[0-9]+p[0-9]+-/.test(location.pathname) ? postsOf(parse(await getText(page1))) : postsOf(document))[0];
      if(!first || !first.uid) throw new Error('Der Verfasser der Bewerbung wurde nicht gefunden.');
      var al = first.el.querySelector('.postbody p.author a[href^="/u"]') || first.el.querySelector('.postprofile a[href^="/u"]');
      var uname = al ? al.textContent.trim() : '';
      var nation = nationOf(textOf(first.el.querySelector('.content')));
      if(!nation){ try{ var rw = (await rawPost(first.pid)).message; nation = nationOf(daten(rw)) || nationOf(zeilen(rw)); }catch(e){ nation = ''; } }
      if(!nation) throw new Error('In der Bewerbung steht keine Nation mit Feuer, Wasser, Erd oder Luft.');
      var path = groups[nation]; if(!path) throw new Error('F\u00fcr ' + nation + ' ist in TES_GEMEINSAM keine Gruppe eingetragen.');
      var gp = await groupPage(path);
      if(!inGroup(gp, first.uid)){
        if(!gp.form || !gp.form.querySelector('input[name=add]')) throw new Error('Du darfst in ' + gp.name + ' keine Mitglieder hinzuf\u00fcgen. Daf\u00fcr musst du Moderator dieser Gruppe sein.');
        await groupPost(gp, path, { username: uname, add: gp.form.querySelector('input[name=add]').value });
        gp = await groupPage(path);
        if(!inGroup(gp, first.uid)) throw new Error(uname + ' konnte nicht zu ' + gp.name + ' hinzugef\u00fcgt werden.');
      }
      var text = uname + ' ist in der Gruppe ' + gp.name, bp = '';
      try{ bp = await besucherPath(); }catch(e){ bp = ''; }
      if(bp){
        var bg = await groupPage(bp);
        if(inGroup(bg, first.uid)){
          var rm = bg.form && bg.form.querySelector('input[name=remove]');
          if(rm){ await groupPost(bg, bp, { 'members[]': String(first.uid), remove: rm.value }); bg = await groupPage(bp); }
          text += inGroup(bg, first.uid) ? ', aus den Besuchern konnte der Account nicht entfernt werden' : ' und nicht mehr bei den Besuchern';
        }
      } else text += ' (die Gruppe Besucher wurde nicht gefunden)';
      try{ localStorage.setItem('tesGrp_' + tid, JSON.stringify({ text: text + '.' })); }catch(e){ e = null; }
      say('\u2713 ' + text + '.');
    }catch(err){ say('\u2716 ' + (err && err.message ? err.message : 'Gruppe konnte nicht zugeordnet werden.')); }
  }
  function run(){
    var re = /\[\s*angenommen\s*(?:=\s*([^\]\s]+)\s*)?\]/i;
    document.querySelectorAll(SEL).forEach(function(c){
      if(c.getAttribute('data-tesst') || c.closest('[data-tesst]')) return;
      if(c.closest('blockquote, .quote, .codebox, textarea')) return;
      var m = c.innerHTML.match(re);
      if(!m) return;
      var mono = c.querySelector('[style*="monospace"], code, .codebox');
      if(mono && re.test(mono.textContent || '') && !re.test(c.innerHTML.replace(mono.outerHTML, ''))) return;
      var tb = m[1] ? m[1].replace(/&amp;/g, '&') : tbLink();
      c.setAttribute('data-tesst', '1');
      urkundeCss();
      var uk = urkunde(c, tb);
      c.innerHTML = c.innerHTML.replace(re, function(){ return uk; });
      try{ addPublish(c); }catch(e){ if(window.console) console.warn(e); }
      try{ assignGroup(c); }catch(e){ if(window.console) console.warn(e); }
    });
  }
  function boot(){ try{ urkundeCss(); ablehnungen(); }catch(e){ e = null; } run(); try{ addReject(); }catch(e){ e = null; } try{ fillPartnerDraft(); }catch(e){ e = null; } }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
