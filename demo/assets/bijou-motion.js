/* Bijou — хореографія появи для демо-запрошень.
   Замість того, щоб кожен шматок окремо виїжджав знизу, блоки з'являються спокійно й по черзі:
   заголовок проявляється з-під маски → фото розкривається з легким наближенням → текст → декор. */
(function () {
  var html = document.documentElement, root = document.querySelector('.bj');
  if (!root || !html.classList.contains('mx')) return;
  var css = document.createElement('style');
  var E = 'cubic-bezier(.22,.8,.22,1)';
  css.textContent =
    'html.mx .rv{opacity:0;translate:none;transition:opacity 1.2s ' + E + ' var(--t,0s),translate 1.4s ' + E + ' var(--t,0s),clip-path 1.5s ' + E + ' var(--t,0s),scale 1.8s ' + E + ' var(--t,0s),filter 1.2s ' + E + ' var(--t,0s)}' +
    'html.mx .rv.in{opacity:1}' +
    /* заголовки: піднімаються з-під лінії */
    'html.mx .rv.m-h{translate:0 .4em;-webkit-mask-image:linear-gradient(#000 45%,transparent 55%);mask-image:linear-gradient(#000 45%,transparent 55%);-webkit-mask-size:100% 300%;mask-size:100% 300%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:0 100%;mask-position:0 100%;transition:opacity .9s ' + E + ' var(--t,0s),translate 1.4s ' + E + ' var(--t,0s),-webkit-mask-position 1.6s ' + E + ' var(--t,0s),mask-position 1.6s ' + E + ' var(--t,0s)}' +
    'html.mx .rv.m-h.in{translate:0 0;-webkit-mask-position:0 0;mask-position:0 0}' +
    /* фото: шторка розкривається, кадр трохи наближений і повільно осідає */
    'html.mx .rv.m-i{clip-path:inset(6% 6% 6% 6%);scale:1.05}' +
    'html.mx .rv.m-i.in{clip-path:inset(0 0 0 0);scale:1}' +
    /* текст: м\'яко проявляється, ледь помітний рух */
    'html.mx .rv.m-t{translate:0 10px;filter:blur(3px)}' +
    'html.mx .rv.m-t.in{translate:0 0;filter:none}' +
    /* декор і дрібниці: лише проявляються */
    'html.mx .rv.m-d{scale:.97}' +
    'html.mx .rv.m-d.in{scale:1}';
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
})();
