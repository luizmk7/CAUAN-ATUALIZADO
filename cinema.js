/* A single native sticky stage. Scroll controls geometry, never document input. */
(() => {
  const section = document.querySelector('#servicos');
  if (!section) return;
  const stage = section.querySelector('.cinema-sticky-stage');
  const viewport = section.querySelector('.cinema-track-viewport');
  const cards = [...section.querySelectorAll('.cinema-card')];
  const videos = cards.map(card => card.querySelector('video'));
  if (!stage || !viewport || !cards.length) return;
  const byId = id => document.getElementById(id);
  const counter = byId('cinema-counter');
  const title = byId('cinema-info-title');
  const tag = byId('cinema-info-tag');
  const sound = byId('cinema-audio-btn');
  const play = byId('cinema-play-btn');
  const skip = byId('cinema-skip-link');
  const fullscreen = byId('cinema-expand-btn');
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = x => String(x).padStart(2, '0');
  const lead = .12, tail = .12, total = lead + cards.length - .2 + tail;
  let reduced = mq.matches || document.body.classList.contains('paused');
  let active = 0, expansion = 0, pinned = false, soundOn = false;
  let width = 1, height = 1, unit = 1, range = 1, topOffset = 0;
  let frame = 0, lastWidth = 0, lastHeight = 0;
  const manualPause = new Set(), pending = new Set(), blocked = new Set();
  const noticeEl = byId('reels-scroll-notice');
  let noticeTimer = null;
  let noticeShown = false;

  function triggerScrollNotice() {
    if (!noticeEl || noticeShown || reduced) return;
    noticeShown = true;
    noticeEl.classList.remove('is-dismissed');
    noticeEl.classList.add('is-visible');
    noticeTimer = setTimeout(() => {
      dismissScrollNotice();
    }, 2800);
  }

  function dismissScrollNotice() {
    if (!noticeEl) return;
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    noticeEl.classList.remove('is-visible');
    noticeEl.classList.add('is-dismissed');
  }

  if (noticeEl) {
    noticeEl.addEventListener('click', () => {
      dismissScrollNotice();
      goTo(Math.min(active + 1, cards.length - 1));
    });
  }
  const meter = document.createElement('div');
  meter.className = 'cinema-position';
  meter.setAttribute('aria-hidden', 'true');
  meter.innerHTML = '<span></span>';
  stage.append(meter);
  const progress = meter.firstElementChild;
  const nav = document.createElement('nav');
  nav.className = 'cinema-chapters';
  nav.setAttribute('aria-label', 'Escolher vídeo');
  cards.forEach((card, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = pad(i + 1);
    btn.setAttribute('aria-label', `Assistir: ${card.dataset.title}`);
    btn.addEventListener('click', () => goTo(i));
    nav.append(btn);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ampliar ou reproduzir: ${card.dataset.title}`);
    card.addEventListener('click', e => {
      if (e.target.closest('video[controls]')) return;
      manualPause.delete(i);
      if (active === i) {
        if (video.paused) {
          startVideo(i);
        } else {
          manualPause.add(i);
          video.pause();
        }
      } else {
        goTo(i);
        startVideo(i);
      }
      updateControls();
    });
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        manualPause.delete(i);
        if (active === i) {
          if (video.paused) startVideo(i);
          else { manualPause.add(i); video.pause(); }
        } else {
          goTo(i);
          startVideo(i);
        }
        updateControls();
      }
    });
    const soundBadge = card.querySelector('.cinema-card-sound-badge');
    if (soundBadge) {
      soundBadge.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        toggleSound();
      });
    }
    const video = videos[i];
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', schedule);
    video.addEventListener('play', () => {
      videos.forEach(other => { if (other !== video) other.pause(); });
      updateControls();
    });
    video.addEventListener('pause', updateControls);
    video.addEventListener('error', () => {
      updateControls();
      const playText = byId('cinema-play-text');
      if (active === i && playText) playText.textContent = 'Tentar novamente';
    });
  });
  stage.append(nav);

  function toggleSound(force) {
    soundOn = typeof force === 'boolean' ? force : !soundOn;
    videos.forEach((v, idx) => {
      v.muted = idx === active ? !soundOn : true;
      if (!v.muted) v.volume = 1.0;
    });
    manualPause.delete(active);
    startVideo(active);
    updateControls();
  }

  function updateControls() {
    const playing = videos[active] && !videos[active].paused;
    const playIcon = byId('cinema-play-icon');
    const playText = byId('cinema-play-text');
    if (playIcon) playIcon.innerHTML = playing ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>' : '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    if (playText) playText.textContent = playing ? 'Pausar' : 'Reproduzir';
    if (play) {
      play.setAttribute('aria-label', playing ? 'Pausar vídeo' : 'Reproduzir vídeo');
      play.setAttribute('aria-pressed', String(playing));
    }
    const audioIcon = byId('cinema-audio-icon');
    const audioText = byId('cinema-audio-text');
    if (audioIcon) audioIcon.innerHTML = soundOn ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
    if (audioText) audioText.textContent = soundOn ? 'Som ligado' : 'Ativar som';
    if (sound) {
      sound.setAttribute('aria-pressed', String(soundOn));
      sound.setAttribute('aria-label', soundOn ? 'Desativar som' : 'Ativar som');
    }
    const soundBadges = section.querySelectorAll('.cinema-card-sound-badge');
    soundBadges.forEach(badge => {
      badge.classList.toggle('is-sound-on', soundOn);
      const text = badge.querySelector('.sound-status-text');
      if (text) text.textContent = soundOn ? 'Som ligado' : 'Ativar som';
      const icon = badge.querySelector('.sound-off-icon');
      if (icon) {
        icon.innerHTML = soundOn
          ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
          : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
      }
    });
  }
  function isStageInView() {
    if (reduced) {
      const sRect = section.getBoundingClientRect();
      return sRect.bottom > 80 && sRect.top < window.innerHeight - 80;
    }
    const sRect = stage.getBoundingClientRect();
    return sRect.bottom > (topOffset + 30) && sRect.top < (window.innerHeight - 30);
  }
  function startVideo(index) {
    const video = videos[index];
    if (!video) return;
    if (!isStageInView() || manualPause.has(index) || document.hidden) {
      if (!video.paused) video.pause();
      video.muted = true;
      return;
    }
    if (!video.paused || pending.has(index)) return;
    pending.add(index);
    video.muted = !soundOn;
    video.defaultMuted = true;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        if (active !== index || document.hidden || manualPause.has(index) || !isStageInView()) {
          video.pause();
          video.muted = true;
        }
      }).catch(err => {
        console.warn('Play notice:', err && err.name);
      }).finally(() => {
        pending.delete(index);
        updateControls();
      });
    } else {
      pending.delete(index);
      updateControls();
    }
  }
  function measure() {
    const header = document.querySelector('.site-header');
    topOffset = header && getComputedStyle(header).position === 'fixed' ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const visibleH = window.innerHeight;
    section.style.setProperty('--cinema-top', `${topOffset}px`);
    section.style.setProperty('--cinema-height', `${Math.max(260, visibleH - topOffset)}px`);
    section.classList.toggle('cinema-reduced', reduced);
    const stageH = stage.clientHeight;
    unit = Math.max(520, Math.min(980, stageH * 1.1));
    range = total * unit;
    section.style.height = reduced ? 'auto' : `${stageH + range}px`;
    width = viewport.clientWidth;
    height = viewport.clientHeight;
    videos.forEach(video => { video.controls = reduced; });
    lastWidth = innerWidth;
    lastHeight = innerHeight;
    render();
  }
  function render() {
    frame = 0;
    if (reduced) {
      cards.forEach(card => { card.removeAttribute('style'); card.tabIndex = -1; card.removeAttribute('role'); });
      progress.style.transform = 'scaleX(0)';
      section.dataset.phase = 'gallery';
      pinned = false;
      return;
    }
    const rect = section.getBoundingClientRect();
    const scroll = topOffset - rect.top;
    pinned = scroll >= 0 && scroll <= range && rect.bottom > topOffset;
    const amount = Math.max(0, Math.min(total, scroll / unit));
    const time = Math.max(0, amount - lead);
    const index = Math.min(cards.length - 1, Math.floor(time));
    const local = Math.min(index === cards.length - 1 ? .8 : 1, time - index);
    const shift = index < cards.length - 1 ? smooth((local - .8) / .2) : 0;
    expansion = local < .25 ? smooth(local / .25) : local <= .55 ? 1 : 1 - smooth((local - .55) / .25);
    active = shift > .5 ? Math.min(index + 1, cards.length - 1) : index;
    section.dataset.phase = amount < lead ? 'entry' : local < .25 ? 'expand' : local <= .55 ? 'hold' : local < .8 ? 'collapse' : index === cards.length - 1 ? 'exit' : 'slide';
    section.dataset.active = String(active);
    const gap = innerWidth <= 700 ? 18 : 32;
    const baseW = width * (innerWidth <= 700 ? .72 : .61);
    const stride = baseW + gap;
    const trackIndex = index + shift;
    const margin = innerWidth <= 700 ? 12 : 32;
    const maxW = width - margin * 2;
    const maxH = height - (innerWidth <= 700 ? 20 : 28);
    cards.forEach((card, i) => {
      card.tabIndex = i === active ? 0 : -1;
      const video = videos[i];
      const ratio = 9 / 16;
      const cardW = Math.min(baseW, height * .72 * ratio);
      const cardH = cardW / ratio;
      const openW = Math.min(maxW, maxH * ratio);
      const openH = openW / ratio;
      const e = i === index ? expansion : 0;
      const w = lerp(cardW, openW, e), h = lerp(cardH, openH, e);
      // Neighbors move outward while the focused film expands, then return before travel.
      const push = i === index ? 0 : Math.sign(i - index) * expansion * width * .42;
      const x = width / 2 + (i - trackIndex) * stride + push;
      const distance = Math.abs(i - trackIndex);
      card.style.width = `${w.toFixed(2)}px`;
      card.style.height = `${h.toFixed(2)}px`;
      card.style.transform = `translate3d(${(x - w / 2).toFixed(2)}px, ${((height - h) / 2).toFixed(2)}px, 0)`;
      card.style.borderRadius = `${lerp(18, 3, e).toFixed(1)}px`;
      card.style.opacity = String(lerp(1, .35, clamp(distance)) * (i === index ? 1 : 1 - expansion));
      card.style.zIndex = i === index ? '3' : '1';
      card.style.visibility = distance > 2 ? 'hidden' : 'visible';
      card.style.pointerEvents = distance > 1.1 || (expansion > .5 && i !== index) ? 'none' : 'auto';
      const badge = card.querySelector('.cinema-card-collapsed-badge');
      if (badge) badge.style.opacity = String(1 - smooth(e * 2));
      const stageVisible = isStageInView();
      const inView = stageVisible && (reduced || (scroll >= -50 && scroll <= range + 50));
      if (i !== active || !inView || reduced || document.hidden || manualPause.has(i)) {
        if (!video.paused) video.pause();
        video.muted = true;
      } else {
        video.muted = !soundOn;
        startVideo(i);
      }
    });
    counter.textContent = `${pad(active + 1)} / ${pad(cards.length)}`;
    title.textContent = cards[active].dataset.title;
    if (tag) tag.textContent = cards[active].dataset.category;
    [...nav.children].forEach((button, i) => button.setAttribute('aria-current', String(i === active)));
    progress.style.transform = `scaleX(${clamp(amount / total)})`;
    if (stageVisible && scroll >= -30 && scroll <= range * 0.35) {
      triggerScrollNotice();
    }
    if (amount > lead + 0.35 || scroll > range * 0.6) {
      dismissScrollNotice();
    }
    if (scroll < -200) {
      noticeShown = false;
      if (noticeEl) noticeEl.classList.remove('is-visible', 'is-dismissed');
    }
    updateControls();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function goTo(index) {
    manualPause.delete(index);
    if (reduced) { videos[index].focus(); return; }
    const top = section.getBoundingClientRect().top + scrollY - topOffset;
    scrollTo({top: top + (lead + index + .4) * unit, behavior: 'smooth'});
    setTimeout(() => startVideo(index), 100);
  }
  if (play) {
    play.addEventListener('click', () => {
      const video = videos[active];
      if (!video) return;
      if (!video.paused) { manualPause.add(active); video.pause(); }
      else { manualPause.delete(active); blocked.delete(active); startVideo(active); }
      updateControls();
    });
  }
  if (sound) {
    sound.addEventListener('click', () => {
      toggleSound();
    });
  }
  if (fullscreen) {
    fullscreen.addEventListener('click', () => {
      const video = videos[active];
      if (!video) return;
      if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else goTo(active);
    });
  }
  if (skip) {
    skip.addEventListener('click', e => {
      e.preventDefault();
      videos.forEach(video => {
        video.pause();
        video.muted = true;
      });
      const next = document.getElementById('formatos');
      if (next) {
        next.tabIndex = -1;
        scrollTo({top: next.getBoundingClientRect().top + scrollY - topOffset, behavior: 'instant'});
        next.focus({preventScroll: true});
      }
    });
  }
  stage.addEventListener('keydown', e => {
    if (reduced || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault();
    goTo(Math.max(0, Math.min(cards.length - 1, active + (e.key === 'ArrowRight' ? 1 : -1))));
  });
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', () => {
    if (innerWidth !== lastWidth || Math.abs(innerHeight - lastHeight) > 80) measure();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videos.forEach(video => {
        if (!video.paused) video.pause();
        video.muted = true;
      });
    } else schedule();
  });
  window.addEventListener('cauan:motion', e => {
    reduced = e.detail.paused;
    videos.forEach(video => {
      video.pause();
      video.muted = true;
    });
    measure();
  });
  mq.addEventListener('change', e => {
    reduced = e.matches || document.body.classList.contains('paused');
    videos.forEach(video => {
      video.pause();
      video.muted = true;
    });
    measure();
  });
  if ('IntersectionObserver' in window) {
    const stageObserver = new IntersectionObserver(entries => {
      const isVisible = entries[0].isIntersecting;
      if (!isVisible) {
        videos.forEach(v => {
          if (!v.paused) v.pause();
          v.muted = true;
        });
        updateControls();
        dismissScrollNotice();
      } else {
        schedule();
      }
    }, { threshold: 0.05 });
    stageObserver.observe(stage);
  }
  window.addEventListener('load', measure, {once: true});
  const userGestureUnlock = (e) => {
    if (!isStageInView()) return;
    if (e && e.target && !section.contains(e.target)) return;
    if (!document.hidden && !manualPause.has(active)) {
      const vid = videos[active];
      if (vid && vid.paused) startVideo(active);
    }
  };
  window.addEventListener('pointerdown', userGestureUnlock, { passive: true });
  window.addEventListener('touchstart', userGestureUnlock, { passive: true });
  measure();
})();
