/* ==========================================================
   Faire-part · thème Japon — jeu des pétales + page
   ========================================================== */
(() => {
  'use strict';

  /* ----------  À MODIFIER  ---------- */
  const CONFIG = {
    babyName: 'Ellie',                      // prénom à dévoiler (une lettre apparaît tous les goal/lettres pétales)
    goal: 10,                               // pétales à attraper pour tout dévoiler
    birth: '2026-11-02T04:12:00+02:00',     // date/heure de naissance (compteur d'âge)
    // Adresses Gmail qui reçoivent les messages du formulaire (envoi via formsubmit.co)
    emails: [
      'alexis43h.hertault@gmail.com',
      'alisea43h.lemaner@gmail.com',
    ],
    parents: "parents d'Ellie",            // utilisé dans le mail
  };
  /* ---------------------------------- */

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const $ = (s, r = document) => r.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);

  const stage = $('#stage');
  const petalsEl = $('#petals');
  const shoji = $('#shoji');
  const invite = $('#invite');
  const hudLetters = $('#hudLetters');
  const hudCount = $('#hudCount');

  /* ---------- Étoiles ---------- */
  const starsEl = $('#stars');
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('i');
    const size = rand(1, 2.6);
    s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;width:${size}px;height:${size}px;animation-delay:${rand(0, 3.5)}s;animation-duration:${rand(2.5, 5)}s`;
    starsEl.appendChild(s);
  }

  /* ---------- HUD ---------- */
  $('#hudGoal').textContent = CONFIG.goal;
  $('#goalText').textContent = CONFIG.goal;
  const LETTERS = [...CONFIG.babyName.toUpperCase()];
  LETTERS.forEach(() => hudLetters.insertAdjacentHTML('beforeend', '<span class="slot"><b></b></span>'));
  const slots = hudLetters.querySelectorAll('.slot');
  $('#nrName').innerHTML = [...CONFIG.babyName].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');

  /* ==========================================================
     JEU
     ========================================================== */
  const PETAL_SVG =
    '<svg viewBox="0 0 40 48" aria-hidden="true">' +
    '<path d="M20 46C6 36 0 20 8 6c3-5 8-4 12 2 4-6 9-7 12-2 8 14 2 30-12 40z" fill="currentColor"/>' +
    '<path d="M20 44C14 30 14 18 20 9" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>';

  let W = 0, H = 0;
  let petals = [];
  let caught = 0;
  let running = false;
  let lastT = 0;
  let spawnIn = 0;
  let rafId = 0;

  const measure = () => { W = stage.clientWidth; H = stage.clientHeight; };
  window.addEventListener('resize', measure);
  measure();

  function spawn() {
    const gold = Math.random() < 0.12;
    const size = rand(46, 66) * (gold ? 0.9 : 1);
    const el = document.createElement('div');
    el.className = 'petal' + (gold ? ' gold' : '');
    el.style.width = el.style.height = size + 'px';
    el.innerHTML = '<div class="petal-in">' + PETAL_SVG + '</div>';

    const p = {
      el, size, gold,
      x0: rand(size, Math.max(size + 1, W - size * 2)),
      y: -size,
      vy: rand(85, 135) * (gold ? 1.3 : 1),
      amp: rand(14, 42),
      freq: rand(0.9, 1.9),
      phase: rand(0, Math.PI * 2),
      rot: rand(0, 360),
      vr: rand(-70, 70),
      t: 0,
      alive: true,
    };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); catchPetal(p); });
    petalsEl.appendChild(el);
    petals.push(p);
  }

  function catchPetal(p) {
    if (!p.alive || !running) return;
    p.alive = false;
    p.el.classList.add('caught');

    const gain = p.gold ? 2 : 1;
    const cx = p.x + p.size / 2, cy = p.y + p.size / 2;

    const pop = document.createElement('span');
    pop.className = 'pop' + (p.gold ? ' gold' : '');
    pop.textContent = '+' + gain;
    pop.style.left = cx - 10 + 'px';
    pop.style.top = cy - 16 + 'px';
    petalsEl.appendChild(pop);
    setTimeout(() => pop.remove(), 850);

    for (let i = 0; i < 8; i++) {
      const sp = document.createElement('i');
      sp.className = 'spark';
      const a = (Math.PI * 2 * i) / 8 + rand(-0.3, 0.3), d = rand(26, 52);
      sp.style.cssText = `left:${cx - 3}px;top:${cy - 3}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px` + (p.gold ? ';background:#f1c75a' : '');
      petalsEl.appendChild(sp);
      setTimeout(() => sp.remove(), 600);
    }

    if (navigator.vibrate) navigator.vibrate(p.gold ? [12, 30, 12] : 10);
    setTimeout(() => p.el.remove(), 480);

    caught += gain;
    updateHud();
    if (caught >= CONFIG.goal) win();
  }

  function updateHud() {
    const n = Math.min(caught, CONFIG.goal);
    hudCount.textContent = n;
    const shown = Math.floor(n * LETTERS.length / CONFIG.goal);
    slots.forEach((s, i) => {
      const on = i < shown;
      if (on && !s.classList.contains('on')) s.firstChild.textContent = LETTERS[i];
      s.classList.toggle('on', on);
      if (!on) s.firstChild.textContent = '';
    });
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    spawnIn -= dt;
    if (spawnIn <= 0 && petals.filter(p => p.alive).length < 9) {
      spawn();
      spawnIn = rand(0.35, 0.75);
    }

    for (const p of petals) {
      if (!p.alive) continue;
      p.t += dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.x = p.x0 + Math.sin(p.t * p.freq + p.phase) * p.amp;
      p.el.style.transform = `translate3d(${p.x}px,${p.y}px,0) rotate(${p.rot}deg)`;
      if (p.y > H + 20) { p.alive = false; p.el.remove(); }
    }
    petals = petals.filter(p => p.alive || p.el.isConnected);
    rafId = requestAnimationFrame(frame);
  }

  function clearPetals() {
    petals.forEach(p => { p.alive = false; p.el.remove(); });
    petals = [];
    petalsEl.innerHTML = '';
  }

  function start() {
    measure();
    clearPetals();
    caught = 0;
    updateHud();
    stage.dataset.state = 'playing';
    running = true;
    spawnIn = 0;
    lastT = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
  }

  function win() {
    running = false;
    cancelAnimationFrame(rafId);
    stage.dataset.state = 'done';
    petals.forEach(p => { if (p.alive) p.el.classList.add('gone'); });
    setTimeout(clearPetals, 900);
    setTimeout(openInvitation, 3600);   // le temps de savourer le prénom
  }

  /* ==========================================================
     TRANSITION SHOJI
     ========================================================== */
  function withDoors(midAction) {
    shoji.classList.add('busy', 'closed');
    setTimeout(() => {
      midAction();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        shoji.classList.remove('closed');
        setTimeout(() => shoji.classList.remove('busy'), 1000);
      }));
    }, 1050);
  }

  function openInvitation() {
    withDoors(() => {
      stage.hidden = true;
      document.body.classList.remove('locked');
      invite.inert = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in'));
    });
  }

  function replay() {
    withDoors(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      stage.hidden = false;
      stage.dataset.state = 'intro';
      document.body.classList.add('locked');
      invite.inert = true;
      clearPetals();
      caught = 0;
      updateHud();
    });
  }

  $('#startBtn').addEventListener('click', start);
  $('#skipBtn').addEventListener('click', () => {
    if (stage.dataset.state === 'done') return;
    running = false;
    cancelAnimationFrame(rafId);
    stage.dataset.state = 'done';
    clearPetals();
    openInvitation();
  });
  $('#replayBtn').addEventListener('click', replay);

  /* ---------- Pétales qui tombent autour du prénom ---------- */
  const heroPetals = $('#heroPetals');
  if (heroPetals) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('i');
      const size = rand(9, 17);
      p.style.cssText = `left:${rand(0, 100)}%;width:${size}px;height:${size * 0.8}px;--sway:${rand(-60, 60)}px;animation-duration:${rand(9, 16)}s;animation-delay:${rand(-16, 0)}s`;
      heroPetals.appendChild(p);
    }
  }

  /* ==========================================================
     PAGE : révélations au scroll
     ========================================================== */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
    : null;
  document.querySelectorAll('.reveal').forEach(el => {
    if (io && !el.closest('.hero')) io.observe(el);
    else if (!io) el.classList.add('in');
  });

  /* ---------- Compte à rebours ---------- */
  const birth = new Date(CONFIG.birth).getTime();
  const cd = { d: $('#cdD'), h: $('#cdH'), m: $('#cdM'), s: $('#cdS') };
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const diff = Math.max(0, Date.now() - birth);
    cd.d.textContent = Math.floor(diff / 864e5);
    cd.h.textContent = pad(Math.floor(diff / 36e5) % 24);
    cd.m.textContent = pad(Math.floor(diff / 6e4) % 60);
    cd.s.textContent = pad(Math.floor(diff / 1e3) % 60);
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Photo facultative (photo.jpg) ---------- */
  const photo = $('#babyPhoto');
  if (photo) {
    const probe = new Image();
    probe.onload = () => { $('#photoSection').hidden = false; document.querySelectorAll('#photoSection .reveal').forEach(el => io ? io.observe(el) : el.classList.add('in')); };
    probe.src = photo.getAttribute('src');
  }

  /* ---------- Réponse : envoi direct par mail (formsubmit.co) ---------- */
  const form = $('#rsvpForm');
  const note = $('#formNote');
  const sendBtn = form.querySelector('button[type="submit"]');
  const sendLabel = sendBtn.querySelector('span');
  let sending = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const nom = form.nom.value.trim();
    if (!nom) {
      form.nom.closest('.field').classList.add('invalid');
      form.nom.focus();
      note.textContent = 'Dites-nous qui vous êtes 🙂';
      return;
    }
    form.nom.closest('.field').classList.remove('invalid');

    const message = form.msg.value.trim() || `Bienvenue petite ${CONFIG.babyName}\u00a0!`;
    const visite = form.visite.checked;
    const [to, ...cc] = CONFIG.emails.filter(Boolean);

    const data = {
      _subject: `Un mot pour ${CONFIG.babyName} — ${nom}`,
      _template: 'box',
      _captcha: 'false',
      Nom: nom,
      Message: message,
      Visite: visite ? `Oui, aimerait passer rencontrer ${CONFIG.babyName} quand vous serez prêts` : 'Non',
    };
    if (cc.length) data._cc = cc.join(',');

    sending = true;
    sendBtn.disabled = true;
    sendLabel.textContent = 'Envoi en cours…';
    note.textContent = '';
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || String(out.success) === 'false') throw new Error(out.message || res.status);
      form.reset();
      note.textContent = `Merci ${nom}, votre message est bien parti 🌸`;
    } catch (err) {
      note.textContent = "Le message n'a pas pu partir. Vérifiez votre connexion et réessayez.";
    } finally {
      sending = false;
      sendBtn.disabled = false;
      sendLabel.textContent = 'Envoyer mon message';
    }
  });
})();
