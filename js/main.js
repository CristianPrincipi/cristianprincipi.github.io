(function () {
  'use strict';

  /* Chiave pubblica del form Web3Forms (https://web3forms.com). Vuota = form non collegato. */
  var WEB3FORMS_KEY = '24875e31-7638-4cc0-8817-de07804b386e';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Lingua ---------- */
  var nodes = $$('[data-i18n]');
  var IT = {}; nodes.forEach(function (n) { IT[n.dataset.i18n] = n.innerHTML; });
  var itTitle = document.title;
  var lang = 'it';
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'it';
    var dict = lang === 'en' ? window.I18N_EN : IT;
    nodes.forEach(function (n) { var t = dict[n.dataset.i18n]; if (t !== undefined) n.innerHTML = t; });
    document.title = lang === 'en' ? window.I18N_EN._title : itTitle;
    doc.lang = lang;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    var cv = $('#cvLink'); if (cv) cv.href = window.I18N_MSG[lang].cv;
    store('lang', lang);
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
  var saved = store('lang');
  if (saved) setLang(saved);
  else if (!/^it/i.test(navigator.language || 'it')) setLang('en');

  /* ---------- Sipario ---------- */
  var intro = $('#intro');
  function ready() { doc.classList.add('ready'); startDemo(); }
  var seen = false; try { seen = sessionStorage.getItem('intro') === '1'; } catch (e) {}
  if (!intro || reduce || seen) { if (intro) intro.classList.add('done'); ready(); }
  else {
    try { sessionStorage.setItem('intro', '1'); } catch (e) {}
    var open = function () {
      if (intro.classList.contains('open')) return;
      intro.classList.add('open'); ready();
      setTimeout(function () { intro.classList.add('done'); }, 1400);
    };
    setTimeout(open, 1900);
    window.addEventListener('wheel', open, { once: true, passive: true });
    window.addEventListener('touchstart', open, { once: true, passive: true });
    window.addEventListener('keydown', open, { once: true });
  }

  /* ---------- Rivelazioni allo scorrimento ---------- */
  var wm = $('#wordmark');
  if (wm) {
    wm.innerHTML = wm.textContent.split('').map(function (c, i) {
      return c === ' ' ? ' ' : '<span style="--i:' + i + '">' + c + '</span>';
    }).join('');
  }
  var targets = $$('.reveal, .clip, .wordmark');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sibs = $$('.reveal', e.target.parentNode).filter(function (x) { return x.parentNode === e.target.parentNode; });
        var i = sibs.indexOf(e.target);
        if (i > 0) e.target.style.setProperty('--d', Math.min(i * 0.08, 0.5) + 's');
        e.target.classList.add('in'); io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else targets.forEach(function (t) { t.classList.add('in'); });

  /* ---------- Barra: colore sopra le parti scure, nascosta scorrendo giù ---------- */
  var nav = $('#nav'), darks = $$('.hero, .services'), lastY = 0, tick = false;
  function onScroll() {
    tick = false;
    var y = window.scrollY, h = nav.offsetHeight / 2;
    var dark = darks.some(function (d) { var r = d.getBoundingClientRect(); return r.top <= h && r.bottom > h; });
    nav.classList.toggle('on-dark', dark);
    nav.classList.toggle('hide', y > lastY && y > window.innerHeight * 0.6);
    lastY = y;
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Telefoni: schermate sfogliabili ---------- */
  $$('[data-phone]').forEach(function (ph) {
    var box = $('.phone__screens', ph);
    function go(k) {
      var el = $('[data-s="' + k + '"]', box); if (!el) return;
      $$('[data-s]', box).forEach(function (i) { i.classList.toggle('on', i === el); });
      box.classList.toggle('nonav', el.hasAttribute('data-nonav'));
      $$('.phone__tabs button', ph).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.go === k)); });
      $$('video', box).forEach(function (v) {
        if (v === el && !reduce) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else { v.pause(); }
      });
    }
    ph.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  });

  /* ---------- Demo nell'apertura: messaggio -> riga in Notion ---------- */
  var SCENES = [
    { db: 'Expenses', seed: [['Groceries', 'Food', '34,10 €'], ['Train ticket', 'Other', '8,00 €']],
      say: 'Add e Coffee 2,50', reply: '✓ Coffee · 2,50 € · Food', row: ['Coffee', 'Food', '2,50 €'] },
    { db: 'Calendar', seed: [['Team call', 'Mon', '09:30'], ['Gym', 'Wed', '18:00']],
      say: 'Remind Dentist tr - 10', reply: '✓ Dentist · tomorrow · 10:00', row: ['Dentist', 'Tomorrow', '10:00'] },
    { db: 'Learn', seed: [['Deep Work', 'Book', 'Done'], ['Sleep and memory', 'Article', 'Done']],
      say: 'Learn video youtu.be/…', reply: '✓ Summary saved in Learn', row: ['Video summary', 'Video', 'New'] }
  ];
  var started = false;
  function rowEl(r, fresh) {
    var d = document.createElement('div'); d.className = 'row' + (fresh ? ' new' : '');
    r.forEach(function (c) { var s = document.createElement('span'); s.textContent = c; d.appendChild(s); });
    return d;
  }
  function msgEl(t, who) { var d = document.createElement('div'); d.className = 'msg msg--' + who; d.textContent = t; return d; }
  function startDemo() {
    if (started) return; started = true;
    var msgs = $('#demoMsgs'), rows = $('#demoRows'), type = $('#demoType'), db = $('#demoDb');
    if (!msgs) return;
    function paint(s, withRow) {
      db.textContent = s.db; rows.innerHTML = '';
      s.seed.forEach(function (r) { rows.appendChild(rowEl(r)); });
      if (withRow) rows.appendChild(rowEl(s.row, true));
    }
    if (reduce) { var s0 = SCENES[0]; paint(s0, true); msgs.appendChild(msgEl(s0.say, 'me')); msgs.appendChild(msgEl(s0.reply, 'bot')); return; }
    var i = 0;
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function typeText(t) {
      return new Promise(function (res) {
        var n = 0; (function step() { type.textContent = t.slice(0, ++n); if (n < t.length) setTimeout(step, 45 + Math.random() * 50); else res(); })();
      });
    }
    function run() {
      var s = SCENES[i % SCENES.length]; i++;
      $$('.msg', msgs).forEach(function (m) { m.classList.add('out'); });
      wait(500).then(function () { msgs.innerHTML = ''; paint(s, false); return wait(500); })
        .then(function () { return typeText(s.say); })
        .then(function () { return wait(350); })
        .then(function () { type.textContent = ''; msgs.appendChild(msgEl(s.say, 'me')); return wait(800); })
        .then(function () { rows.appendChild(rowEl(s.row, true)); return wait(450); })
        .then(function () { msgs.appendChild(msgEl(s.reply, 'bot')); return wait(3000); })
        .then(function () { if (document.hidden) { var again = function () { document.removeEventListener('visibilitychange', again); run(); }; document.addEventListener('visibilitychange', again); } else run(); });
    }
    setTimeout(run, 700);
  }

  /* ---------- Demo di The Office: chat con Michael + organigramma e budget ---------- */
  (function () {
    var root = $('#officeDemo'), box = $('#odMsgs'), fill = $('#odFill'), state = $('#odState');
    if (!root || !box) return;
    // [tipo, testo, {chi: stato}, budget %, stato ufficio, pausa ms]
    var STEPS = [
      ['me', '/open', null, 0, null, 900],
      ['sys', 'The office is open on asus. It is paused: /resume to let people work.', null, 0, 'paused', 1300],
      ['me', '/resume', null, 0, null, 800],
      ['sys', 'office OPEN', null, 4, 'open', 1200],
      ['me', 'Prepara 4 bozze di post LinkedIn sui miei progetti.', null, 4, null, 1100],
      ['sys', 'Michael starts now', { michael: 'work' }, 9, null, 1900],
      ['bot', 'Ho chiesto a Pam e Kelly 4 bozze su progetti reali, senza dati inventati. Ognuna passa dalla tua approvazione prima che la pubblichi.', { michael: 'done', pam: 'work', kelly: 'work' }, 21, null, 3200],
      ['file', 'linkedin_batch2.md', { kelly: 'done' }, 33, null, 1700],
      ['bot', 'Lavoro finito: 4 bozze pronte, controllate da Pam. Non controllato: il lotto 1 non è stato riletto con la nuova regola.', { pam: 'done' }, 38, null, 3400],
      ['me', '/close', null, 38, null, 900],
      ['sys', 'Office closed: everyone saved their work and the state is on GitHub. /open opens it again.', { michael: '', pam: '', kelly: '' }, 38, 'closed', 3600]
    ];
    function add(t, txt) {
      var d = document.createElement('div'); d.className = 'om om--' + t;
      if (t === 'bot') { var b = document.createElement('b'); b.textContent = 'Michael'; d.appendChild(b); }
      d.appendChild(document.createTextNode(txt)); box.appendChild(d);
      while (box.children.length > 7) box.removeChild(box.firstChild);
    }
    function apply(st) {
      if (st[2]) Object.keys(st[2]).forEach(function (w) {
        var li = $('[data-who="' + w + '"]', root); if (!li) return;
        li.classList.remove('work', 'done'); if (st[2][w]) li.classList.add(st[2][w]);
      });
      fill.style.width = (st[3] * 0.52 / 0.7) + '%';   /* 70% d'uso = fine della zona Open (52% della barra) */
      if (st[4]) state.textContent = st[4];
    }
    if (reduce) { STEPS.slice(4, 9).forEach(function (s) { add(s[0], s[1]); apply(s); }); return; }
    var i = 0, running = false, visible = false;
    function next() {
      if (!visible || document.hidden) { running = false; return; }
      running = true;
      if (i === 0) { box.innerHTML = ''; fill.style.width = '0%'; }
      var s = STEPS[i]; add(s[0], s[1]); apply(s);
      i = (i + 1) % STEPS.length;
      setTimeout(next, s[5]);
    }
    function wake() { if (!running) next(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }, { threshold: 0.25 }).observe(root);
    } else { visible = true; wake(); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) wake(); });
  })();

  /* ---------- Form di contatto ---------- */
  var form = $('#form'), status = $('#formStatus');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var M = window.I18N_MSG[lang], f = form.elements;
    if (f.botcheck.checked) return;
    if (!f.name.value.trim() || !f.message.value.trim() || !f.email.checkValidity()) { status.textContent = M.fill; return; }
    if (!WEB3FORMS_KEY) { status.textContent = M.off; return; }
    var btn = $('button', form); btn.disabled = true; status.textContent = M.sending;
    fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: 'Portfolio: ' + f.name.value.trim(), name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim() })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.success) throw new Error();
      status.textContent = M.ok; form.reset();
    }).catch(function () { status.textContent = M.err; }).then(function () { btn.disabled = false; });
  });
})();
