/* Bijou — інтерактив для демо-запрошень:
   анкета (поля, вибір варіантів, кнопка відповіді), музика, карти, легкі анімації натискання.
   Працює поверх сторінок, експортованих з Figma: шукає елементи за текстом і будовою. */
(function () {
  var root = document.querySelector('.bj');
  if (!root) return;
  var EN = document.documentElement.lang === 'en';
  var txt = function (e) { return (e.textContent || '').replace(/\s+/g, ' ').trim(); };
  var ps = [].slice.call(root.querySelectorAll('p'));
  var cs = function (e) { return getComputedStyle(e); };
  var clear = function (c) { return !c || c === 'transparent' || /rgba\(0, 0, 0, 0\)/.test(c); };
  var tap = function (e) { e.classList.add('bjx-tap'); };

  var st = document.createElement('style');
  st.textContent =
    '.bjx-tap{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .18s ease,background-color .25s ease,border-color .25s ease,color .25s ease,opacity .25s ease}' +
    '.bjx-tap:active{opacity:.82}' +
    '.bjx-pop{}' +
    '.bjx-in{all:unset;display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;letter-spacing:inherit;line-height:inherit;text-align:inherit;resize:none;cursor:text}' +
    '.bjx-in::placeholder{color:inherit;opacity:1}' +
    '.bjx-playing .bjx-art{animation:bjxSpin 14s linear infinite;border-radius:50%}@keyframes bjxSpin{to{transform:rotate(360deg)}}' +
    
    '.bjx-eq{display:inline-flex;gap:2px;align-items:flex-end;height:12px;margin-left:8px;vertical-align:middle}.bjx-eq i{width:3px;background:currentColor;animation:bjxEq .9s ease-in-out infinite}.bjx-eq i:nth-child(2){animation-delay:.2s}.bjx-eq i:nth-child(3){animation-delay:.4s}@keyframes bjxEq{0%,100%{height:3px}50%{height:12px}}' +
    '.bjx-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;z-index:99;background:rgba(20,16,16,.92);color:#fff;font:15px/1.4 system-ui,sans-serif;padding:14px 20px;border-radius:14px;max-width:86vw;text-align:center;transition:.35s}' +
    '.bjx-toast.on{opacity:1;transform:translate(-50%,0)}';
  document.head.appendChild(st);

  function toast(m) {
    var t = document.querySelector('.bjx-toast');
    if (!t) { t = document.createElement('div'); t.className = 'bjx-toast'; document.body.appendChild(t); }
    t.textContent = m; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 3200);
  }

  /* ---------- 0. Краї й хвилі між блоками: накриваємо стик на 1px, щоб не просвічувала тонка лінія ---------- */
  (function () {
    var W = root.getBoundingClientRect().width || 390;
    [].forEach.call(root.querySelectorAll('div'), function (d) {
      if (!d.querySelector('img') || d.querySelector('p')) return;
      var r = d.getBoundingClientRect(), pos = cs(d).position;
      if (r.width < W * .94 || r.height < 16 || r.height > 90 || (pos !== 'static' && pos !== 'relative')) return;
      if (d.parentElement && d.parentElement.closest('[data-bjx-edge]')) return;
      d.setAttribute('data-bjx-edge', '');
      d.style.marginTop = '-1px'; d.style.marginBottom = '-1px'; d.style.height = (r.height + 2) + 'px'; d.style.zIndex = '1';
    });
  })();

  /* ---------- 1. Поля анкети: підказка в рамці → справжнє поле вводу ---------- */
  ps.forEach(function (p) {
    var box = p.parentElement, s = txt(p);
    if (!box || box === root || box.children.length !== 1) return;
    var bs = cs(box), framed = parseFloat(bs.borderBottomWidth) > 0;
    var label = box.previousElementSibling;
    var LBL = /(ім.?я|прізвищ|гост|алергі|побажан|меню|name|guest|телефон|коментар|allerg|wish)/i;
    var isField = (framed && label && label.tagName === 'P' && LBL.test(txt(label)) && s.length < 40) ||
                  /^\*?(напишіть|write)/i.test(s);
    if (!isField) return;
    // сам текст із макета стає редагованим: вигляд лишається точно як у Figma
    p.textContent = s; p.style.whiteSpace = 'pre-wrap';
    p.setAttribute('data-ph', s); p.setAttribute('data-bjx-field', '');
    try { p.contentEditable = 'plaintext-only'; } catch (e) {}
    if (p.contentEditable !== 'plaintext-only') p.contentEditable = 'true';
    p.style.minHeight = (parseFloat(cs(p).lineHeight) || 24) + 'px'; p.spellcheck = false; p.style.outline = 'none'; p.style.cursor = 'text'; p.style.minWidth = '2ch';
    if (/гост|guest/i.test(s)) p.inputMode = 'numeric';
    var ph = s, dim = function (on) { p.style.opacity = on ? '.55' : ''; };
    p.addEventListener('focus', function () {
      if (txt(p) === ph) { p.textContent = ''; }
    });
    p.addEventListener('blur', function () { if (!txt(p)) { p.textContent = ph; dim(false); } });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !/напишіть|write/i.test(ph)) { e.preventDefault(); p.blur(); } });
    box.style.cursor = 'text';
    box.addEventListener('click', function (e) { if (e.target !== p) { p.focus(); var r = document.createRange(); r.selectNodeContents(p); r.collapse(false); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } });
  });


  /* 1b. Порожні рамки під підписом (без тексту-підказки) */
  [].forEach.call(root.querySelectorAll('div'), function (d) {
    if (d.children.length || txt(d)) return;
    var r = d.getBoundingClientRect(), s = cs(d);
    if (r.width < 200 || r.height < 30 || r.height > 220) return;
    if (clear(s.backgroundColor) && !(parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderBottomWidth) > 0)) return;
    var prev = d.previousElementSibling; if (!prev || !/(ім.?я|прізвищ|гост|побажан|алергі|name|guest|wish)/i.test(txt(prev))) return;
    var multi = r.height > 60;
    var f = document.createElement(multi ? 'textarea' : 'input');
    f.className = 'bjx-in';
    var ls = cs(prev.querySelector('p') || prev);
    f.style.cssText = 'position:absolute;inset:0;padding:10px 14px;font-family:' + ls.fontFamily + ';font-size:15px;color:' + ls.color;
    if (/гост|guest/i.test(txt(prev))) f.inputMode = 'numeric';
    if (s.position === 'static') d.style.position = 'relative';
    d.appendChild(f);
  });

  /* ---------- 2. Варіанти з кружечком/галочкою (прийду / не зможу, напої-галочки) ---------- */
  var rowOf = function (p) {
    var r = p.parentElement;
    if (!r || r.children.length !== 2) return null;
    var ind = r.children[0] === p ? r.children[1] : r.children[0];
    if (ind.tagName === 'P') return null;
    var b = ind.getBoundingClientRect();
    return b.width <= 30 && b.height <= 30 && b.width >= 10 ? { row: r, ind: ind, p: p } : null;
  };
  var groups = new Map();
  ps.forEach(function (p) {
    var o = document.contains(p) && rowOf(p); if (!o) return;
    var g = o.row.parentElement; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(o);
  });
  groups.forEach(function (items, g) {
    if (items.length < 2) return;
    var weight = function (e) { var n = e.querySelectorAll('*').length; var bg = cs(e).backgroundColor; return n + (clear(bg) ? 0 : 1); };
    var ws = items.map(function (o) { return weight(o.ind); });
    var max = Math.max.apply(null, ws), min = Math.min.apply(null, ws);
    var onT, offT;
    if (max === min) { onT = null; offT = null; }
    else { onT = items[ws.indexOf(max)].ind.cloneNode(true); offT = items[ws.indexOf(min)].ind.cloneNode(true); }
    var single = items.some(function (o) { return /прийд|зможу|^так$|^ні|будемо|буду|attend|can't|yes|no\b/i.test(txt(o.p)); });
    var state = items.map(function (o, i) { return ws[i] === max && max !== min; });
    function paint() {
      items.forEach(function (o, i) {
        if (onT) { var n = (state[i] ? onT : offT).cloneNode(true); o.ind.replaceWith(n); o.ind = n; }
        else { o.ind.style.background = state[i] ? cs(o.p).color : ''; }
      });
    }
    items.forEach(function (o, i) {
      tap(o.row);
      o.row.addEventListener('click', function () {
        if (single) state = state.map(function (_, j) { return j === i; }); else state[i] = !state[i];
        paint(); o.ind.classList.add('bjx-pop');
      });
    });
  });

  /* ---------- 3. «Пігулки» з варіантами (напої): можна обрати кілька ---------- */
  var wraps = new Set();
  ps.forEach(function (p) {
    var pill = p.parentElement; if (!pill || pill.children.length !== 1) return;
    var w = pill.parentElement; if (!w || w === root) return;
    if (parseFloat(cs(pill).borderTopWidth) > 0 && /wrap/.test(cs(w).flexWrap)) wraps.add(w);
  });
  wraps.forEach(function (w) {
    var pills = [].filter.call(w.children, function (c) { return c.children.length === 1 && c.children[0].tagName === 'P' && parseFloat(cs(c).borderTopWidth) > 0; });
    if (pills.length < 3) return;
    var bgs = pills.map(function (c) { return cs(c).backgroundColor; });
    var count = {}; bgs.forEach(function (b) { count[b] = (count[b] || 0) + 1; });
    var offBg = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; })[0];
    var onI = bgs.findIndex(function (b) { return b !== offBg; }), offI = bgs.indexOf(offBg);
    var sty = function (c) { var s = cs(c); return { bg: s.backgroundColor, bd: s.borderTopColor, fg: cs(c.children[0]).color }; };
    var on = onI >= 0 ? sty(pills[onI]) : null, off = sty(pills[offI]);
    if (!on) { on = { bg: off.fg, bd: off.fg, fg: clear(off.bg) ? '#fff' : off.bg }; }
    pills.forEach(function (c, i) {
      var sel = bgs[i] !== offBg;
      tap(c);
      c.addEventListener('click', function () {
        sel = !sel; var s = sel ? on : off;
        c.style.backgroundColor = s.bg; c.style.borderColor = s.bd; c.children[0].style.color = s.fg;
        c.classList.remove('bjx-pop'); void c.offsetWidth; c.classList.add('bjx-pop');
      });
    });
  });

  /* ---------- 4. Вибір картинкою (гендер-паті: дівчинка / хлопчик) ---------- */
  var choice = ps.filter(function (p) { return /^(дівчинка|хлопчик|girl|boy)$/i.test(txt(p)); });
  if (choice.length >= 2) {
    var cards = choice.map(function (p) { var a = p; while (a.parentElement && a.parentElement !== root && !a.querySelector('img')) a = a.parentElement; return a; });
    cards.forEach(function (c, i) {
      tap(c);
      c.addEventListener('click', function () {
        cards.forEach(function (o, j) { o.style.opacity = j === i ? '1' : '.4'; o.style.transform = j === i ? 'scale(1.06)' : 'scale(.96)'; });
      });
    });
  }

  /* ---------- 5. Кнопка відповіді ---------- */
  ps.forEach(function (p) {
    if (!/^(надіслати|підтвердити|відправити|send|submit|confirm)/i.test(txt(p)) || txt(p).length > 32) return;
    var b = p.parentElement; if (!b || b === root) return;
    if (clear(cs(b).backgroundColor) && !(parseFloat(cs(b).borderTopWidth) > 0)) { var b2 = b.parentElement; if (b2 && !clear(cs(b2).backgroundColor) && b2.getBoundingClientRect().height < 90) b = b2; else return; }
    tap(b);
    b.addEventListener('click', function () {
      var name = root.querySelector('.bjx-in');
      p.textContent = EN ? 'Thank you ♡' : 'Дякуємо ♡';
      b.classList.add('bjx-pop');
      toast(EN ? 'Your reply has been sent. See you there!' : 'Відповідь надіслано' + (name && name.value ? ', ' + name.value : '') + '. Чекаємо на вас! ♡');
    });
  });

  /* ---------- 6. Карти ---------- */
  ps.forEach(function (p) {
    if (!/(карт|мап|маршрут|дістатися|google maps|map)/i.test(txt(p)) || txt(p).length > 30) return;
    var b = p.parentElement; if (!b || b === root) return;
    var bs = cs(b);
    if (clear(bs.backgroundColor) && !(parseFloat(bs.borderTopWidth) > 0) && b.children.length > 1) b = p;
    var sec = b; while (sec.parentElement && sec.parentElement !== root && sec.getBoundingClientRect().height < 900) sec = sec.parentElement;
    var addr = [].filter.call(sec.querySelectorAll('p'), function (q) { return /(вул\.|просп|пл\.|обл|район|\bм\.|с\.\s|київ|львів|street|st\.)/i.test(txt(q)); })[0];
    var venue = [].filter.call(sec.querySelectorAll('p'), function (q) { return /[«"“]/.test(txt(q)); })[0];
    var q = addr ? txt(addr) : venue ? txt(venue) : '';
    tap(b);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((venue && addr ? txt(venue) + ', ' : '') + q), '_blank', 'noopener');
    });
  });

  /* ---------- 7. Музика ---------- */
  var audio = null;
  var trig = ps.filter(function (p) { return /(натисніть play|увімкніть музику|press play|play music)/i.test(txt(p)); });
  trig.forEach(function (p) {
    var box = p.parentElement;
    while (box.parentElement && box.parentElement !== root && (box.getBoundingClientRect().height < 50 || clear(cs(box).backgroundColor) && !box.querySelector('img,svg'))) box = box.parentElement;
    var times = [].filter.call(box.querySelectorAll('p'), function (q) { return /^\d+:\d\d$/.test(txt(q)); });
    var bar = [].filter.call(box.querySelectorAll('div'), function (d) { var r = d.getBoundingClientRect(); return r.height <= 6 && r.width > 100 && d.children.length; })[0];
    var fill = bar && bar.children[0], knob = bar && bar.children[1];
    var art = [].filter.call(box.querySelectorAll('img'), function (i) { var r = i.getBoundingClientRect(); return r.width >= 40 && r.width <= 90; })[0];
    if (art) art.parentElement.classList.add('bjx-art');
    var dur = times[1] ? (+txt(times[1]).split(':')[0]) * 60 + (+txt(times[1]).split(':')[1]) : 0;
    var start = times[0] ? (+txt(times[0]).split(':')[0]) * 60 + (+txt(times[0]).split(':')[1]) : 0;
    var eq = document.createElement('span'); eq.className = 'bjx-eq'; eq.innerHTML = '<i></i><i></i><i></i>';
    var label = p, orig = txt(p), pos = start, timer = 0;
    var playBtn = [].filter.call(box.querySelectorAll('div'), function (d) { var r = d.getBoundingClientRect(); return r.width >= 40 && r.width <= 70 && Math.abs(r.width - r.height) < 4 && !clear(cs(d).backgroundColor); })[0];
    var pauseIco = document.createElement('span');
    pauseIco.style.cssText = 'display:none;position:absolute;inset:0;margin:auto;width:16px;height:18px;border-left:5px solid currentColor;border-right:5px solid currentColor;box-sizing:border-box';
    if (playBtn) { playBtn.style.position = playBtn.style.position || 'relative'; pauseIco.style.color = cs(box).backgroundColor; playBtn.appendChild(pauseIco); }
    var setIco = function (on) { if (!playBtn) return; [].forEach.call(playBtn.children, function (c) { if (c !== pauseIco) c.style.visibility = on ? 'hidden' : ''; }); pauseIco.style.display = on ? 'block' : 'none'; };
    tap(box);
    box.addEventListener('click', function () {
      if (!audio) { audio = new Audio(new URL('assets/ambient.mp3', document.baseURI).href); audio.loop = true; audio.volume = .7; }
      var on = !box.classList.contains('bjx-playing');
      box.classList.toggle('bjx-playing', on); setIco(on);
      if (on) {
        audio.play().catch(function () {});
        label.textContent = EN ? 'now playing' : 'грає зараз'; label.appendChild(eq);
        timer = setInterval(function () {
          pos = dur ? (pos + 1) % dur : pos + 1;
          if (times[0]) times[0].textContent = Math.floor(pos / 60) + ':' + String(pos % 60).padStart(2, '0');
          if (fill && dur) { var k = pos / dur; fill.style.width = (k * 100) + '%'; if (knob) knob.style.left = 'calc(' + (k * 100) + '% - 7px)'; }
        }, 1000);
      } else {
        audio.pause(); clearInterval(timer); label.textContent = orig;
      }
    });
  });
})();
