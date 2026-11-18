/* Shared: page transitions, optional sound, arrow-key navigation between categories */
(function () {
  var PAGES = [
    { name: 'Projects', href: 'projects.html', blurb: 'Things I have built' },
    { name: 'About',    href: 'about.html',    blurb: 'Who I am' },
    { name: 'Skills',   href: 'skills.html',   blurb: 'What I work with' },
    { name: 'Contact',  href: 'contact.html',  blurb: 'Get in touch' }
  ];
  window.PAGES = PAGES;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- sounds (mp3 files; browsers block audio until the first tap/key, so
         anything that is refused is queued and played on the first gesture) --- */
  var FILES = {
    scroll: 'assets/scroll.mp3',        // choosing a category
    transform: 'assets/transform.mp3',  // category selected
    timeout: 'assets/timeout.mp3',      // back on the watch page
    core: 'assets/core-ready.mp3'       // first arrival on the site
  };
  var clips = {}, pending = null;
  Object.keys(FILES).forEach(function (k) {
    try { var a = new Audio(FILES[k]); a.preload = 'auto'; clips[k] = a; } catch (e) {}
  });
  function play(k) {
    var a = clips[k]; if (!a) return;
    try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () { pending = k; }); }
    catch (e) { pending = k; }
  }
  function unlock() {
    if (!pending) return;
    var k = pending; pending = null; play(k);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, unlock, true);
  });
  /* tell the page when the timeout clip actually starts/ends (so visuals stay in sync
     even if the browser delayed the sound until the first tap) */
  var timeoutCb = null;
  if (clips.timeout) {
    clips.timeout.addEventListener('playing', function () { if (timeoutCb) timeoutCb(true); });
    ['ended', 'pause', 'error'].forEach(function (ev) {
      clips.timeout.addEventListener(ev, function () { if (timeoutCb) timeoutCb(false); });
    });
  }
  window.sfx = {
    onTimeout: function (cb) { timeoutCb = cb; },
    scroll: function () { pending = null; play('scroll'); },
    transform: function () { play('transform'); },
    /* called once when the watch page opens: "timeout" if we came back from a
       category page, otherwise "core ready" */
    arrive: function () {
      var back = false;
      try { back = sessionStorage.getItem('omni-back') === '1'; sessionStorage.removeItem('omni-back'); } catch (e) {}
      play(back ? 'timeout' : 'core');
    }
  };

  /* --- green wipe: leave a page --- */
  window.goTo = function (href, x, y) {
    try { if (/^index\.html/.test(href)) sessionStorage.setItem('omni-back', '1'); } catch (e) {}
    var w = document.querySelector('.wipe');
    if (!w || reduce) { location.href = href; return; }
    if (x != null) { w.style.setProperty('--x', x + 'px'); w.style.setProperty('--y', y + 'px'); }
    w.classList.add('out');
    setTimeout(function () { location.href = href; }, 650);
  };

  /* --- green wipe: arrive on a page --- */
  document.addEventListener('DOMContentLoaded', function () {
    var w = document.querySelector('.wipe');
    if (w && document.referrer && !reduce) { w.classList.add('in'); }
    /* inner pages: link clicks get the wipe too */
    document.querySelectorAll('a[data-wipe]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); goTo(a.getAttribute('href'), e.clientX, e.clientY);
      });
    });
  });

  /* --- inner pages: arrows move between categories, Esc / Backspace goes to the watch --- */
  var cur = document.body.getAttribute('data-page');
  if (cur) {
    var i = PAGES.findIndex(function (p) { return p.name.toLowerCase() === cur; });
    document.addEventListener('keydown', function (e) {
      if (/input|textarea|select/i.test((e.target.tagName || ''))) return;
      if (e.key === 'ArrowRight') { goTo(PAGES[(i + 1) % PAGES.length].href); }
      else if (e.key === 'ArrowLeft') { goTo(PAGES[(i + PAGES.length - 1) % PAGES.length].href); }
      else if (e.key === 'Escape' || e.key === 'Backspace') { goTo('index.html'); }
    });
    /* animate skill bars */
    requestAnimationFrame(function () {
      document.querySelectorAll('.bar i').forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; });
    });
  }
})();
