/* Bijou — хореографія появи для демо-запрошень.
   Замість того, щоб кожен шматок окремо виїжджав знизу, блоки з'являються спокійно й по черзі:
   заголовок проявляється з-під маски → фото розкривається з легким наближенням → текст → декор. */
(function () {
  var html = document.documentElement, root = document.querySelector('.bj');
  if (!root || !html.classList.contains('mx')) return;
  var css = document.createElement('style');
  var E = 'cubic-bezier(.22,.8,.22,1)';
  css.textContent =
    /* рух — окремими властивостями translate/scale: макет розставляє елементи через transform, і ми його не чіпаємо */
    'html.mx .rv{transition:opacity 1.3s ' + E + ' var(--t,0s),translate 1.6s ' + E + ' var(--t,0s),scale 2s ' + E + ' var(--t,0s),filter 1.4s ' + E + ' var(--t,0s)}' +
    'html.mx .rv:not(.in){opacity:0}html.mx .rv.in{opacity:1;translate:none;scale:none}' +
    /* заголовки: з легкого розфокусу, піднімаються на пів рядка */
    'html.mx .rv.m-h:not(.in){translate:0 .3em;filter:blur(8px)}' +
    /* фото: повільно осідають із легкого наближення */
    'html.mx .rv.m-i:not(.in){translate:none;scale:1.06}' +
    /* текст: м\'яко, ледь помітний рух */
    'html.mx .rv.m-t:not(.in){translate:0 10px;filter:blur(3px)}' +
    /* декор: лише проявляється */
    'html.mx .rv.m-d:not(.in){translate:none;scale:.97}';
  document.head.appendChild(css);

  var W = root.getBoundingClientRect().width || 390;
  var els = [].slice.call(root.querySelectorAll('.rv'));
  // секція = найближчий предок, ширина якого на весь екран (смуга сторінки)
  function section(e) { var a = e.parentElement; while (a && a !== root) { var r = a.getBoundingClientRect(); if (r.width >= W * .95 && r.height > 120) return a; a = a.parentElement; } return root; }
  var order = { h: 0, i: 1, t: 2, d: 3 }, base = { h: 0, i: .18, t: .38, d: .6 };
  var groups = new Map();
  els.forEach(function (e) {
    var r = e.getBoundingClientRect(), k;
    if (e.tagName === 'P') k = parseFloat(getComputedStyle(e).fontSize) >= 26 ? 'h' : 't';
    else if (e.querySelector('img') || e.tagName === 'IMG') k = (r.width * r.height > 14000) ? 'i' : 'd';
    else k = 'd';
    e.classList.add('m-' + k);
    var s = section(e); if (!groups.has(s)) groups.set(s, []); groups.get(s).push({ e: e, k: k, top: r.top });
  });
  groups.forEach(function (list) {
    // в межах блоку: за типом, а всередині типу — зверху вниз
    var count = { h: 0, i: 0, t: 0, d: 0 };
    list.sort(function (a, b) { return order[a.k] - order[b.k] || a.top - b.top; });
    list.forEach(function (o) { var n = count[o.k]++; o.e.style.setProperty('--t', Math.min(base[o.k] + n * .09, base[o.k] + .45).toFixed(2) + 's'); });
  });
  // загальний порядок за висотою: те, що нижче на екрані, не має чекати верхнього блоку довше, ніж треба
  root.classList.add('m-ready');
  var pend = els.slice(), tick = 0;
  function sweep() {
    tick = 0; var h = innerHeight, se = document.scrollingElement || html;
    // біля самого низу сторінки показуємо все, що вже на екрані (футер інакше ніколи не «доходить» до лінії появи)
    var atEnd = se.scrollTop + h >= se.scrollHeight - 8;
    pend = pend.filter(function (e) {
      if (e.classList.contains('in')) return false;
      var r = e.getBoundingClientRect();
      if (r.top < (atEnd ? h : h * .92) && (r.width || r.height)) { e.classList.add('in'); return false; }
      return true;
    });
  }
  addEventListener('scroll', function () { if (!tick) tick = setTimeout(sweep, 160); }, { passive: true });
  setTimeout(sweep, 700); setInterval(function () { if (pend.length) sweep(); }, 900);
})();
