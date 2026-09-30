const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Função central para geração de URLs otimizadas do Cloudinary
function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  const { width = null, quality = 'auto', format = 'auto', crop = 'limit' } = options;
  const transforms = [];
  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (crop) transforms.push(`c_${crop}`);
  if (width) transforms.push(`w_${width}`);
  const transformStr = transforms.join(',');
  const uploadToken = '/image/upload/';
  const uploadIndex = url.indexOf(uploadToken);
  if (uploadIndex === -1) return url;
  const prefix = url.slice(0, uploadIndex + uploadToken.length);
  let rest = url.slice(uploadIndex + uploadToken.length);
  const match = rest.match(/^(?:(?:[a-zA-Z0-9_,.-]+)\/)(v\d+\/.*)$/);
  if (match) {
    rest = match[1];
  }
  return `${prefix}${transformStr}/${rest}`;
}

function getCloudinarySrcset(url, widths = [400, 650]) {
  if (!url || !url.includes('res.cloudinary.com')) return '';
  return widths
    .map(w => `${getOptimizedCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

// Microanimações Refinadas (Apple-Grade Motion com IntersectionObserver)
function initAppleMicroMotion() {
  const isReduced = paused || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || isReduced) {
    return; // Mantém todo o conteúdo 100% visível caso sem suporte ou movimento reduzido
  }

  document.documentElement.classList.add('has-micro-motion');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('is-revealed');
        revealObserver.unobserve(el);
      }
    });
  }, {
    rootMargin: '0px 0px -30px 0px',
    threshold: 0.05
  });

  const registerReveal = (el, delay = 0) => {
    if (!el) return;
    el.classList.add('apple-reveal');
    if (delay > 0) {
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    }
    const rect = el.getBoundingClientRect();
    // Elementos já visíveis na tela inicial surgem prontamente sem esperar scroll
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-revealed');
    } else {
      revealObserver.observe(el);
    }
  };

  // 1. Seção Sobre / Apresentação
  $$('.intro-kicker, .intro h2, .intro-desc').forEach((el, idx) => {
    registerReveal(el, Math.min(idx * 60, 240));
  });
  $$('.intro .stat-box').forEach((el, idx) => {
    registerReveal(el, Math.min(idx * 60, 240));
  });

  // 2. Hub de Portfólio
  $$('.portfolio-hub-header, .portfolio-hub-desc').forEach((el, idx) => {
    registerReveal(el, Math.min(idx * 60, 240));
  });

  // 3. Categorias: Animação isolada do cabeçalho e sequência de cards (sem acumular no container)
  $$('.category-block').forEach(cat => {
    const header = cat.querySelector('.category-block-header');
    if (header) registerReveal(header, 0);

    const grid = cat.querySelector('.category-cards-grid');
    if (grid && window.innerWidth <= 850) {
      registerReveal(grid, 60);
      const cards = cat.querySelectorAll('.category-cards-grid .work-card');
      cards.forEach(card => card.classList.add('is-revealed'));
    } else {
      const cards = cat.querySelectorAll('.category-cards-grid .work-card');
      cards.forEach((card, idx) => {
        registerReveal(card, Math.min(idx * 60, 240));
      });
    }

    const footer = cat.querySelector('.category-footer-cta');
    if (footer) registerReveal(footer, 100);
  });

  // 4. Formatos de Produção
  const formatsHeader = $('.formats-header');
  if (formatsHeader) registerReveal(formatsHeader, 0);

  $$('.formats-grid .format-card').forEach((card, idx) => {
    registerReveal(card, Math.min(idx * 70, 240));
  });

  const formatsFooter = $('.formats-footer');
  if (formatsFooter) registerReveal(formatsFooter, 100);

  // 5. Processo de Trabalho
  $$('.process > .label, .process > h2').forEach((el, idx) => {
    registerReveal(el, Math.min(idx * 60, 240));
  });

  $$('.steps .step-card').forEach((step, idx) => {
    registerReveal(step, Math.min(idx * 50, 240));
  });

  // 6. FAQ
  $$('.faq > div:first-child').forEach(el => registerReveal(el, 0));
  $$('.faq details').forEach((d, idx) => {
    registerReveal(d, Math.min(idx * 50, 240));
  });

  // 7. Contato
  $$('.contact > div:first-child').forEach(el => registerReveal(el, 0));
  const briefForm = $('#brief');
  if (briefForm) registerReveal(briefForm, 60);
}
initAppleMicroMotion();

// Transição suave de opacidade no carregamento das imagens (exceto hero cutout)
function initImageSmoothFade() {
  const isReduced = paused || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) return;

  const images = $$('img:not(.hero-portrait-cutout)');
  images.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-img-ready');
      return;
    }
    img.classList.add('apple-img-fade');
    const onDone = () => {
      img.classList.add('is-img-ready');
      img.removeEventListener('load', onDone);
      img.removeEventListener('error', onDone);
    };
    img.addEventListener('load', onDone, { once: true });
    img.addEventListener('error', onDone, { once: true });
  });
}
initImageSmoothFade();

// Automatic Count-Up Counter Animation for Hero and Stats
function initCounters(){
  const counters=$$('.counter');
  if(!counters.length)return;
  const countObs=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const el=entry.target;
        countObs.unobserve(el);
        const target=parseFloat(el.dataset.target||el.textContent.replace(/[^0-9.]/g,''))||0;
        const prefix=el.dataset.prefix||'';
        const suffix=el.dataset.suffix||(el.textContent.includes('+')?'+':(el.textContent.includes('%')?'%':''));
        if(paused){
          const fVal=prefix&&target<10?prefix+target:target;
          el.textContent=`${fVal}${suffix}`;
          return;
        }
        const duration=1600;
        const start=performance.now();
        function step(now){
          const elapsed=now-start;
          const p=Math.min(1,elapsed/duration);
          const ease=1-Math.pow(1-p,3);
          const current=Math.round(ease*target);
          const display=prefix&&current<10?prefix+current:current;
          el.textContent=`${display}${suffix}`;
          if(p<1){
            requestAnimationFrame(step);
          }else{
            const fVal=prefix&&target<10?prefix+target:target;
            el.textContent=`${fVal}${suffix}`;
          }
        }
        requestAnimationFrame(step);
      }
    });
  },{threshold:.2});
  counters.forEach(c=>countObs.observe(c));
}
initCounters();

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
let ticking=false;
const journey=$('.gear-journey');
const stage=$('.gear-stage');

function render(){
  const max=document.documentElement.scrollHeight-innerHeight;
  const progressEl=$('.progress');
  if(progressEl)progressEl.style.transform=`scaleX(${max>0?scrollY/max:0})`;
  if(!paused){
    const heroSec=$('.hero-section')||$('.hero');
    if(heroSec){
      const hp=clamp(scrollY/Math.max(1,heroSec.offsetHeight));
      const portrait=$('.hero-portrait-cutout');
      if(portrait)portrait.style.transform=`translateY(${hp*35}px)`;
    }
    const intro=$('.intro');
    if(intro){
      const ir=intro.getBoundingClientRect();
      const ip=clamp((innerHeight*.65-ir.top)/(innerHeight*.52));
      const words=$$('.word');
      const total=words.length||1;
      words.forEach((w,i)=>{
        const n=clamp((ip*(total+0.3)-i)/1.1);
        w.style.setProperty('--fill',`${n*100}%`);
      });
    }
    if(journey&&stage){
      const r=journey.getBoundingClientRect();
      const gp=clamp(-r.top/Math.max(1,journey.offsetHeight-stage.offsetHeight));
      stage.style.setProperty('--journey',gp);
      stage.style.setProperty('--wipe',`${100-clamp(gp*1.8)*100}%`);
      const isDarkPhase = gp >= 0.24;
      stage.classList.toggle('is-dark-phase', isDarkPhase);
      const gearImg=$('.gear-camera-visual img')||$('.gear-visual img');
      if(gearImg)gearImg.style.transform=`translateY(${(gp-.5)*-30}px) rotate(${gp*16-8}deg) scale(${0.96-gp*.04})`;
      const phoneImg=$('.gear-phone-visual img');
      if(phoneImg && isDarkPhase){
        const darkProg = clamp((gp - 0.24) / 0.76);
        phoneImg.style.transform = `translateY(${(darkProg - .5) * -20}px) rotate(${darkProg * 8 - 4}deg)`;
      }
      const gearIntro=$('.gear-intro-block')||$('.gear-title');
      if(gearIntro){
        gearIntro.style.transform=`translateY(${-gp*50}px)`;
        gearIntro.style.opacity=1-clamp((gp-.2)*2.2);
      }
      const gearCopy=$('.gear-copy');
      if(gearCopy){
        gearCopy.inert=gp<.25;
        gearCopy.style.opacity=clamp((gp-.22)*3);
        gearCopy.style.transform=`translateY(${(1-clamp((gp-.22)*3))*30}px)`;
      }
    }
  }
  ticking=false;
}

function queueRender(){if(!ticking){requestAnimationFrame(render);ticking=true}}
addEventListener('scroll',queueRender,{passive:true});
addEventListener('resize',queueRender);

function motionState(){
  document.body.classList.toggle('paused',paused);
  const motionBtn=$('#motion');
  if(motionBtn){
    motionBtn.textContent=paused?'Ativar movimentos ▷':'Pausar movimentos Ⅱ';
    motionBtn.setAttribute('aria-pressed',String(paused));
  }
  if(paused){
    const gearCopy=$('.gear-copy');
    if(gearCopy)gearCopy.inert=false;
    $$('.gear-camera-visual img,.gear-phone-visual img,.gear-visual img,.hero-portrait-cutout,.gear-title,.gear-copy').forEach(x=>{
      if(x){x.style.transform='';x.style.filter='';x.style.opacity='';}
    });
    $$('.apple-reveal').forEach(el => el.classList.add('is-revealed'));
    $$('img.apple-img-fade').forEach(img => img.classList.add('is-img-ready'));
    $$('.cat-large-photo-card.apple-batch-card').forEach(c => c.classList.add('is-batch-shown'));
  }
  render();
  window.dispatchEvent(new CustomEvent('cauan:motion', {detail:{paused}}));
}

const motionBtn=$('#motion');
if(motionBtn)motionBtn.addEventListener('click',()=>{paused=!paused;motionState()});
motionState();

if (window.matchMedia) {
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
    paused = e.matches;
    motionState();
  });
}

// Dialog modal for photos and videos preview
const dialog=$('#gallery');
let lastFocusedElement=null;

function openModal(data, triggerEl){
  if(!dialog)return;
  lastFocusedElement=triggerEl||document.activeElement;
  const img=$('#modal-img');
  const vidBox=$('#modal-video-box');
  const vid=$('#modal-video');
  const titleEl=$('#modal-title');
  const catEl=$('#modal-cat');
  const typeEl=$('#modal-type');
  const descEl=$('#modal-desc');
  const extLink=$('#modal-ext-link');

  if(catEl)catEl.textContent=data.category||'PORTFÓLIO';
  if(titleEl)titleEl.textContent=data.title||'';
  if(descEl)descEl.textContent=data.caption||'Registro de trabalho por Cauan.';

  if(data.mediaType==='video'&&data.videoSrc){
    if(img)img.hidden=true;
    if(vidBox)vidBox.hidden=false;
    if(vid){
      vid.src=data.videoSrc;
      vid.load();
    }
    if(typeEl)typeEl.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg><span>Vídeo</span>';
  }else{
    if(vidBox)vidBox.hidden=true;
    if(vid){
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    }
    if(img){
      img.hidden=false;
      const largeUrl = getOptimizedCloudinaryUrl(data.image, { width: 1400 });
      img.src = largeUrl;
      img.srcset = `${getOptimizedCloudinaryUrl(data.image, { width: 800 })} 800w, ${largeUrl} 1400w`;
      img.sizes = '(max-width: 768px) 96vw, 1200px';
      img.alt=data.title||'Trabalho do portfólio de Cauan';
      img.decoding='async';
    }
    if(typeEl)typeEl.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg><span>Fotografia</span>';
  }

  if(extLink){
    const arrowSvg = '<svg class="ui-arrow" viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8L8 2M8 2H3.5M8 2V6.5"/></svg>';
    if(data.link){
      extLink.href=data.link;
      extLink.innerHTML=`Ver este trabalho ${arrowSvg}`;
    }else if(data.category && (data.category.toLowerCase().includes('aniversár') || data.category.toLowerCase().includes('aniversar'))){
      extLink.href='https://www.instagram.com/stories/highlights/17908736619199934/';
      extLink.innerHTML=`Ver mais no Instagram ${arrowSvg}`;
    }else{
      extLink.href='https://www.instagram.com/cauanvideomaker_/';
      extLink.innerHTML=`Ver mais no Instagram ${arrowSvg}`;
    }
  }

  dialog.classList.remove('is-closing');
  dialog.showModal();
  document.body.style.overflow='hidden';
  if(data.mediaType==='video'&&data.videoSrc&&vid){
    vid.play().catch(e=>console.log('Autoplay handled:', e));
  }
}

let isClosingDialog = false;
function closeModal(){
  if(!dialog||!dialog.open||isClosingDialog)return;
  const isReduced = paused || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finishClose = () => {
    isClosingDialog = false;
    const vid=$('#modal-video');
    if(vid){
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    }
    const img=$('#modal-img');
    if(img){
      img.removeAttribute('src');
      img.removeAttribute('srcset');
    }
    dialog.classList.remove('is-closing');
    try { dialog.close(); } catch(e){}
    document.body.style.overflow='';
    if(lastFocusedElement&&typeof lastFocusedElement.focus==='function'){
      lastFocusedElement.focus();
    }
  };

  if(isReduced){
    finishClose();
  } else {
    isClosingDialog = true;
    dialog.classList.add('is-closing');
    setTimeout(finishClose, 160);
  }
}

if(dialog){
  const closeBtn=dialog.querySelector('.close');
  if(closeBtn)closeBtn.addEventListener('click',closeModal);
  dialog.addEventListener('close',()=>{
    document.body.style.overflow='';
    isClosingDialog = false;
    dialog.classList.remove('is-closing');
    const vid=$('#modal-video');
    if(vid){
      vid.pause();
      vid.removeAttribute('src');
    }
    if(lastFocusedElement&&typeof lastFocusedElement.focus==='function'){
      lastFocusedElement.focus();
    }
  });
  dialog.addEventListener('click',e=>{
    if(e.target===dialog){
      const r=dialog.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){
        closeModal();
      }
    }
  });
  dialog.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      e.preventDefault();
      closeModal();
    }
  });
}

// ============================================================
// GALERIA EXPANDIDA POR CATEGORIA (MODAL DE MAIS FOTOS)
// ============================================================
// Catálogo de fotos integrado (Garante funcionamento 100% autônomo e à prova de falhas na publicação)
const BUILTIN_PORTFOLIO = {"formaturas":[{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119535/99051_heif_syorwn.webp","alt":"Formanda com beca preta segurando capelo","title":"A Conquista do Diploma","caption":"O sorriso radiante que celebra anos de dedicação e o início de um novo ciclo profissional."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119532/99043_heif_hnjw4l.webp","alt":"Formanda sorrindo com beca e capelo","title":"Sorrisos na Graduação","caption":"O sorriso radiante que marca a celebração e a vitória de um grande ciclo concluído."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119526/99097_heif_zbanw9.webp","alt":"Formandos de Medicina em palco festivo","title":"A Medicina e o Sonho","caption":"A celebração de um sonho realizado sob as luzes da vitória acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119524/99096_heif_o0pykd.webp","alt":"Formanda em beca solene","title":"Brilho no Olhar","caption":"O sorriso de quem transformou anos de dedicação em uma conquista inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119522/99091_heif_ex2xaw.webp","alt":"Formandas comemorando no baile","title":"Euforia e Vitória","caption":"A alegria vibrante de uma jornada acadêmica que termina em grande estilo."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119521/99089_heif_l32cib.webp","alt":"Formanda posando com toga e canudo","title":"Retratos da Jornada","caption":"O brilho no olhar de quem celebra o fim de uma jornada e o início de um sonho."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119520/99087_heif_t32mvy.webp","alt":"Grupo de formandas com capelo","title":"O Capelo e a Conquista","caption":"A celebração de anos de dedicação concretizada no brilho de um diploma."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119517/99086_heif_mwrlup.webp","alt":"Casal celebrando formatura no salão","title":"Novos Horizontes","caption":"A celebração do esforço e o brilho de uma nova jornada profissional."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119513/99080_heif_w7wdld.webp","alt":"Formanda sorridente na colação","title":"Abraços e Conquista","caption":"O sorriso radiante de quem celebra a concretização de uma grande jornada acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119512/99079_heif_x9nju4.webp","alt":"Ensaio de formando em estúdio e externo","title":"O Brilho da Trajetória","caption":"A elegância de um momento especial, marcando o início de uma nova jornada."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119512/99076_heif_ooufoz.webp","alt":"Formanda erguendo o diploma","title":"O Diploma em Mãos","caption":"Celebrando a realização de um sonho e o início de um futuro brilhante."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119511/99077_heif_lr0sad.webp","alt":"Formanda no baile de formatura","title":"Vitória Compartilhada","caption":"Cada brilho neste olhar reflete o esforço e a dedicação de uma longa jornada acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119510/99075_heif_rntpwv.webp","alt":"Formanda em momento solene","title":"O Sonho Concretizado","caption":"O sorriso radiante que ilumina o fechamento de um ciclo inesquecível e o começo de um grande futuro."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119509/99073_heif_ody0tj.webp","alt":"Formanda sorrindo na cerimônia","title":"A Luz da Superação","caption":"O brilho inesquecível de quem celebra o ápice de uma importante jornada acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119507/99071_heif_fx5fml.webp","alt":"Formanda com canudo de formatura","title":"Conclusão Inesquecível","caption":"A alegria estampada no rosto de quem concretiza o sonho de uma vida."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119505/99069_heif_gxuhtl.webp","alt":"Formanda celebrando conquista","title":"Aplausos e Realização","caption":"A alegria vibrante de quem alcançou o tão sonhado diploma acadêmico."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119505/99067_heif_yz8i1a.webp","alt":"Formandas comemorando em festa","title":"A Força da Dedicação","caption":"A alegria vibrante de celebrar uma vitória tão esperada ao lado de quem amamos."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119503/99065_heif_fqewtb.webp","alt":"Formanda de Medicina com óculos comemorativos","title":"Dra. Raissa e Conquista","caption":"A energia contagiante de um momento de pura celebração e brilho da formatura."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119502/99062_heif_bazvwk.webp","alt":"Formanda em traje solene com jabô branco","title":"O Instante Solene","caption":"O brilho no olhar de quem celebra a vitória de uma jornada inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119502/99063_heif_aswdy4.webp","alt":"Formanda de gala no baile","title":"Alegria que Transborda","caption":"A alegria estampada de quem alcançou o objetivo final com maestria."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119501/99059_heif_t9uuyz.webp","alt":"Formanda emocionada com canudo","title":"Vitória Inesquecível","caption":"O momento em que todo o esforço se transforma em uma vitória inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119500/99060_heif_ky9p9b.webp","alt":"Formanda no palco oficial","title":"Emoção no Palco","caption":"Cada lágrima e sorriso refletem a dedicação de uma jornada que hoje se torna realidade."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119494/99053_heif_pehebq.webp","alt":"Formanda comemorando no baile de formatura","title":"Brilho e Tradição","caption":"A celebração de uma nova etapa médica marcada pelo brilho da conquista."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553214/IMG_2373_hl585t.webp","alt":"Formanda em momento de celebração da graduação","title":"A Emoção da Vitória","caption":"O sentimento inconfundível de dever cumprido e a alegria que transborda no dia da formatura."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553213/IMG_2393_nsywa4.webp","alt":"Formanda celebrando conquista e diploma","title":"Celebração do Sonho","caption":"A intensidade e a beleza de um momento que marca a transição para um futuro brilhante."}],"eventos":[{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119532/99044_heif_xotvpk.webp","alt":"Retrato de mulher elegante em vestido verde de gala","title":"Brilho e Elegância Solene","caption":"Um sorriso radiante que ilumina a noite em uma celebração repleta de sofisticação."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119524/99095_heif_y7rrkz.webp","alt":"Jovem mulher sorridente em festa social","title":"Retratos em Festa","caption":"A leveza e a alegria eternizadas em um momento especial de celebração."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119520/99088_heif_qbzo0a.webp","alt":"Convidadas brindando com taças iluminadas","title":"Celebração em Movimento","caption":"A sintonia perfeita e a alegria capturadas em um brinde inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119516/99085_heif_nc0k1a.webp","alt":"Retrato em close-up de mulher em festa de gala","title":"Noite de Gala","caption":"A beleza e sofisticação que irradiam sob o brilho e luzes da noite."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119516/99084_heif_uwtt3r.webp","alt":"Convidados dançando na pista de dança","title":"Energia na Pista","caption":"A vibração contagiante e a alegria da festa eternizadas em movimento cheio de cor."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119515/99083_heif_v5vzpv.webp","alt":"Pista de dança com luzes reluzentes","title":"A Vibração da Festa","caption":"A vibração contagiante e o ritmo que eternizam a euforia do evento."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119508/99072_heif_nqugyd.webp","alt":"Jovem celebrando em festa com iluminação cênica","title":"Noite Inesquecível","caption":"A energia contagiante de uma noite inesquecível e cheia de estilo musical."}],"casamentos":[{"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119535/99050_heif_xnd6g1.webp", "alt": "Casal de noivos caminhando de mãos dadas", "title": "Caminho Lado a Lado", "caption": "A cumplicidade refletida em cada olhar no primeiro passeio como recém-casados."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119534/99045_heif_zhikee.webp", "alt": "Noivos de costas caminhando para a cerimônia", "title": "Passos Rumo ao Altar", "caption": "A poesia de um novo começo capturada na luz serena do altar."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119534/99046_heif_e3zhvp.webp", "alt": "Noiva com vestido de noiva em preparação", "title": "O Preparo da Noiva", "caption": "Cada pequeno detalhe do preparo carrega a expectativa e a magia do grande dia."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119532/99041_heif_vsro33.webp", "alt": "Casal no altar sob gazebo decorado", "title": "O Sim sob o Altar", "caption": "O momento em que duas vidas se entrelaçam em uma promessa de amor eterno."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119530/99103_heif_nuicgn.webp", "alt": "Noiva sorridente com vestido tomara-que-caia", "title": "O Sorriso da Noiva", "caption": "A beleza clássica de um momento que marca o início de uma nova jornada."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119529/99101_heif_lkk5nw.webp", "alt": "Noivos aplaudidos pelos convidados", "title": "Saída dos Noivos", "caption": "Um momento inesquecível de alegria e luz no caminho rumo a uma nova vida a dois."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119529/99102_heif_fapyg5.webp", "alt": "Noivos com buquê de lírios e medalhão", "title": "Memória & Homenagens", "caption": "Um momento de memória e afeto, eternizando quem amamos no dia mais especial."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119527/99100_heif_koq1ih.webp", "alt": "Noiva em robe de cetim na preparação", "title": "A Espera do Sim", "caption": "Cada detalhe prepara o cenário para o momento mais esperado da vida a dois."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119527/99099_heif_joacsn.webp", "alt": "Noiva com vestido longo e véu de costas", "title": "O Véu e a Luz", "caption": "A beleza singular de um momento inesquecível de preparação e contemplação."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119523/99094_heif_dgcfv8.webp", "alt": "Porta-alianças bordado com nomes dos noivos", "title": "As Alianças Mariana & N.", "caption": "Dois corações que se tornam um sob a bênção de um compromisso eterno."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119520/99090_heif_ajzpbq.webp", "alt": "Mão da noiva dada ao pai a caminho do altar", "title": "A Mão e o Altar", "caption": "Cada passo compartilhado reflete o início de um novo e lindo capítulo de vida."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119516/99082_heif_m5owou.webp", "alt": "Noivos no jardim ao entardecer", "title": "O Encontro no Jardim", "caption": "O instante em que o sol se curva para testemunhar a união de duas vidas."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119515/99081_heif_pvxkzz.webp", "alt": "Noivos no altar ao ar livre", "title": "Votos Sob o Céu", "caption": "O momento em que duas vidas se entrelaçam sob o olhar atento da natureza."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119509/99074_heif_h9d3c7.webp", "alt": "Noiva segurando buquê de lírios brancos", "title": "O Buquê de Lírios", "caption": "A elegância e a emoção de um momento que se tornará eterno na memória."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119506/99070_heif_zkuuvv.webp", "alt": "Noivos de mãos dadas durante os votos", "title": "Conexão e Promessa", "caption": "A união de duas almas em um momento de pura conexão, cumplicidade e fé."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119505/99068_heif_pzznvg.webp", "alt": "Noivo beijando a testa da noiva em preto e branco", "title": "O Beijo e a Ternura", "caption": "Um momento de pura ternura que eterniza a união de duas almas apaixonadas."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119502/99064_heif_zc4epk.webp", "alt": "Noiva observando vestido pendurado", "title": "O Vestido e a Expectativa", "caption": "Cada detalhe é um passo em direção ao sonho que está prestes a se realizar."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119501/99061_heif_h7sfxd.webp", "alt": "Detalhes cenográficos do casamento", "title": "Detalhes da Recepção", "caption": "Cada detalhe foi planejado com carinho para celebrar o início de uma vida a dois."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119499/99058_heif_is6d89.webp", "alt": "Casal caminhando sorridente na festa", "title": "Celebração Radiante", "caption": "Um momento de pura euforia e brilho celebrando o início de uma nova jornada a dois."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119497/99057_heif_mssbdo.webp", "alt": "Noiva sorridente abraçada ao noivo", "title": "Um Sonho a Dois", "caption": "O brilho no olhar de quem celebra o início de uma nova jornada a dois."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119496/99054_heif_qckgd3.webp", "alt": "Noivos em ensaio noturno iluminado", "title": "Noivos Sob as Estrelas", "caption": "A celebração eterna de um compromisso que floresce sob o brilho da noite."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119497/99055_heif_snjxo2.webp", "alt": "Noivos se beijando entre sparkles iluminados", "title": "O Beijo com Sparkles", "caption": "Um momento mágico iluminado pelo brilho dos convidados e pela promessa de uma vida juntos."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119494/99052_heif_dyy5go.webp", "alt": "Noiva sentada em ajustes finais do vestido", "title": "Os Toques Finais do Vestido", "caption": "Cada detalhe é cuidadosamente ajustado para o momento em que o sonho se torna realidade."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790117655/99041_heif_1_ylunw3.webp", "alt": "Noivos no altar durante troca de alianças", "title": "A Troca de Alianças", "caption": "Um momento inesquecível selado com a beleza da natureza e a luz de uma nova jornada."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790117570/99103_heif_1_cwnu80.webp", "alt": "Noiva sorridente descendo escada com buquê", "title": "A Descida Radiante da Noiva", "caption": "A descida emocionante da noiva com buquê e véu a caminho do altar."}],"aniversarios":[{"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553245/4A0E2A00-3C2A-4EDD-BA7C-5AEF0D06C047_ccdprm.webp", "alt": "Celebração de aniversário em família", "title": "Instantes Reais da Vida", "caption": "Acompanhamento acolhedor no ritmo natural de cada celebração."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553243/7AEA2290-2845-451F-82F2-4CF3BDDA18D1_ocgqh7.webp", "alt": "Brinde com amigos em aniversário", "title": "O Brinde aos Novos Ciclos", "caption": "A alegria espontânea ao redor das pessoas que mais importam."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553243/4F5B7DF5-ABD0-4377-BCE7-0C351C5B0143_i0hm6o.webp", "alt": "Detalhes da decoração e festa de aniversário", "title": "Memórias nos Detalhes", "caption": "Cada elemento planejado para a festa registrado com sensibilidade."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553241/28E3F31F-11B7-4E30-AA08-9BAC65BB1A14_f8kt5m.webp", "alt": "Amigos celebrando em festa de aniversário", "title": "Celebração Radiante", "caption": "Sorrisos e abraços que marcam a passagem de um novo ano de vida."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553240/44E26E8C-FAD2-47B6-83F3-FB34CEA53167_ixde3f.webp", "alt": "Momentos espontâneos de aniversário", "title": "Espontaneidade e Luz", "caption": "O afeto compartilhado entre amigos e familiares em um clima acolhedor."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553239/92D42BD8-BF79-446A-A2C3-754B7AC480BD_taif57.webp", "alt": "Convidados reunidos em comemoração", "title": "Encontros que Marcam", "caption": "A energia contagiante de reunir quem faz parte da sua história."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553237/98C359C0-4090-44DE-A11D-4B2686428756_r6kalq.webp", "alt": "Brinde e risadas em celebração", "title": "Brilho e Afeto", "caption": "Cada brinde e gargalhada eternizados com naturalidade cinematográfica."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553237/278B6183-C142-45F9-BAB5-9E094A562622_nh5xbt.webp", "alt": "Aniversariante e amigos celebrando", "title": "A Arte de Celebrar", "caption": "Momentos únicos registrados com discrição e olhar atento."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553236/447E492B-EBE4-41DD-8295-C1CC922B35BE_x4r4i0.webp", "alt": "Abraços e carinho na comemoração", "title": "Conexão e Alegria", "caption": "A cumplicidade de momentos divididos com quem se ama."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553235/609CA1AA-7D61-4C74-8E0F-9445AB63391C_ujpfhn.webp", "alt": "Convidados em momento de emoção", "title": "Emoção Compartilhada", "caption": "Olhares sinceros e celebrações que ficam guardadas para sempre."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553233/32147871-03AB-46CF-A2BE-551A4A774A5F_esiqxj.webp", "alt": "Festa e celebração animada", "title": "O Calor dos Amigos", "caption": "A atmosfera viva e descontraída de uma festa inesquecível."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553233/4165B180-A13C-4582-9189-DD05F39844B4_uns4aj.webp", "alt": "Momento solene do bolo de aniversário", "title": "Soprando as Velas", "caption": "O instante mágico de fazer um pedido e celebrar mais um capítulo."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553232/6345D38F-7B21-4706-BB72-16B4B00D9521_sdnbrd.webp", "alt": "Sorrisos espontâneos na recepção", "title": "Sorrisos Espontâneos", "caption": "Expressões autênticas capturadas sem poses artificiais."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553230/88923629-ADF5-4CAE-9B71-1C72BD1013C7_lkqoen.webp", "alt": "Pista e movimento na celebração", "title": "Alegria em Movimento", "caption": "O ritmo da festa e a vibração única de cada comemoração."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553230/A7DACEFF-012F-4F23-9CAD-8FC9AA20DF28_erkuii.webp", "alt": "Detalhes pensados para a recepção", "title": "Detalhes Especiais", "caption": "A delicadeza na decoração e na recepção dos convidados."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553228/B28DC912-DC38-45F1-B373-2E590B4C4ABD_yb8ihn.webp", "alt": "Festa intimista e alegre", "title": "Comemoração Íntima", "caption": "O calor humano que transforma qualquer espaço em um grande evento."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553227/CFB389BC-C804-4C96-8410-C73C2D6D93EC_qhfgje.webp", "alt": "Brinde e taças em comemoração", "title": "Gargalhadas e Brindes", "caption": "O som do brinde e a espontaneidade que só uma grande amizade tem."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553226/D9F9F363-362F-4804-AF07-2C95063A78E8_rla4e3.webp", "alt": "Iluminação e festa de aniversário", "title": "A Vibração da Noite", "caption": "Luzes, música e alegria em plena sintonia na celebração."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553226/D8586E41-A30C-402B-ADE9-32E1016D3647_sxqrgq.webp", "alt": "Amigos reunidos na celebração", "title": "Histórias que se Cruzam", "caption": "A presença marcante de quem esteve junto em todas as conquistas."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553226/C2BDB43D-7395-4AF4-BF29-F5D2ECD3FBFD_c3aizg.webp", "alt": "Momentos doces e afetuosos na festa", "title": "Doces Momentos", "caption": "A harmonia dos pequenos gestos e da celebração coletiva."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553222/DBF69B8C-CE6E-46A6-BEEE-C13525C2E5DE_ovr6gc.webp", "alt": "Aniversariante sorrindo com amigos", "title": "Felicidade Genuína", "caption": "A beleza de viver o presente ao lado de quem ilumina a caminhada."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553221/E45A4EE9-B8A9-4BBA-923B-D93CA74B612F_almfn4.webp", "alt": "Retrato de aniversário com estilo", "title": "Elegância e Descontração", "caption": "Composição visual sofisticada com o frescor da juventude."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553219/IMG_1102_m65sfb.webp", "alt": "Olhares e sorrisos na festa", "title": "A Festa em Cada Olhar", "caption": "A intensidade de um dia feito exclusivamente para celebrar a vida."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553219/F771B6B5-073E-4784-8265-B0F5A5334AC0_wlchun.webp", "alt": "Abraço caloroso de parabéns", "title": "Abraços Apertados", "caption": "O carinho que não precisa de palavras para ser sentido."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553217/IMG_1105_ybcpr5.webp", "alt": "Lembrança inesquecível do aniversário", "title": "Lembranças Vivas", "caption": "Imagens que devolvem a emoção exata daquele instante."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553217/IMG_1122_eqibc5.webp", "alt": "Aniversariante celebrando novo ciclo", "title": "Brilho nos Olhos", "caption": "A expectativa e a gratidão por mais um ano repleto de realizações."}, {"src": "https://res.cloudinary.com/lvl0nq3r/image/upload/v1790553215/IMG_1216_wfom2a.webp", "alt": "Celebração inesquecível de aniversário", "title": "Eternizando Ciclos", "caption": "O registro sensível de uma data que merecia ficar para a história."}]};

function getCategoryItems(cat) {
  // 1. Prioridade: PORTFOLIO_MANIFEST dinamicamente avaliado no momento do clique
  if (typeof PORTFOLIO_MANIFEST !== 'undefined' && Array.isArray(PORTFOLIO_MANIFEST)) {
    const matched = PORTFOLIO_MANIFEST.filter(i => i.category === cat).map(i => ({
      src: i.url || i.src,
      alt: i.alt || i.title || '',
      title: i.title || '',
      caption: i.caption || ''
    }));
    if (matched.length > 0) return matched;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.PORTFOLIO_MANIFEST)) {
    const matched = window.PORTFOLIO_MANIFEST.filter(i => i.category === cat).map(i => ({
      src: i.url || i.src,
      alt: i.alt || i.title || '',
      title: i.title || '',
      caption: i.caption || ''
    }));
    if (matched.length > 0) return matched;
  }
  // 2. Fallback integrado garantido (independe de subpastas ou scripts externos)
  if (BUILTIN_PORTFOLIO && BUILTIN_PORTFOLIO[cat] && BUILTIN_PORTFOLIO[cat].length > 0) {
    return BUILTIN_PORTFOLIO[cat];
  }
  // 3. Fallback visual: extrai fotos presentes nos cards da própria seção na página
  const sec = document.getElementById(cat);
  if (sec) {
    const cards = sec.querySelectorAll('.work-card');
    const domItems = [];
    cards.forEach(c => {
      const img = c.querySelector('img');
      const src = c.dataset.image || (img ? img.getAttribute('src') : '');
      const alt = c.dataset.title || (img ? img.getAttribute('alt') : '') || 'Foto';
      if (src) domItems.push({ src, alt, title: c.dataset.title || '', caption: c.dataset.caption || '' });
    });
    if (domItems.length > 0) return domItems;
  }
  return [];
}

const categoryGalleries = {
  formaturas: {
    title: 'Galeria · Formaturas',
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Formaturas no site e gostaria de solicitar um orçamento para o meu evento.',
    instagramUrl: 'https://www.instagram.com/cauanvideomaker_/'
  },
  eventos: {
    title: 'Galeria · Eventos & Shows',
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Eventos no site e gostaria de solicitar um orçamento para cobertura.',
    instagramUrl: 'https://www.instagram.com/cauanvideomaker_/'
  },
  aniversarios: {
    title: 'Galeria · Aniversários',
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Aniversários no site e gostaria de solicitar um orçamento.',
    instagramUrl: 'https://www.instagram.com/stories/highlights/17908736619199934/'
  },
  casamentos: {
    title: 'Galeria · Casamentos',
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Casamentos no site e gostaria de conversar sobre a cobertura da minha data.',
    instagramUrl: 'https://www.instagram.com/cauanvideomaker_/'
  }
};

const catModal = $('#category-gallery-modal');
let catLastFocused = null;
let catObserver = null;
const CAT_BATCH_SIZE = 8;

function openCategoryModal(catKey, triggerEl) {
  if (!catModal) return;
  const gallery = categoryGalleries[catKey];
  if (!gallery) return;

  catLastFocused = triggerEl || document.activeElement;

  const titleEl = $('#cat-modal-title');
  const instaBtn = $('#cat-modal-insta-btn') || $('#cat-modal-wa-btn');
  const photosList = $('#cat-modal-photos-list');
  const wrapper = catModal.querySelector('.cat-modal-wrapper');

  if (titleEl) titleEl.textContent = gallery.title;
  if (instaBtn) instaBtn.href = gallery.instagramUrl || 'https://www.instagram.com/cauanvideomaker_/';

  // Desconecta observador prévio para evitar duplicação
  if (catObserver) {
    catObserver.disconnect();
    catObserver = null;
  }

  // Renderiza fotos sob demanda em lotes para economia máxima de dados e carregamento veloz
  if (photosList) {
    photosList.innerHTML = '';
    const items = getCategoryItems(catKey);
    if (!items || items.length === 0) {
      photosList.innerHTML = '<div style="column-span: all; text-align: center; padding: 48px 20px; color: #8A92A2;"><p>Carregando fotos da galeria...</p></div>';
    } else {
      let renderedCount = 0;
      let sentinel = null;

      function createPhotoCard(item, index, batchIndex = 0) {
        const card = document.createElement('article');
        card.className = 'cat-large-photo-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ampliar imagem: ${item.alt || gallery.title}`);

        const isReduced = paused || matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!isReduced) {
          card.classList.add('apple-batch-card');
          const delay = Math.min(batchIndex * 50, 240);
          card.style.setProperty('--batch-stagger', `${delay}ms`);
        }

        const frame = document.createElement('div');
        frame.className = 'cat-large-photo-frame';

        const img = document.createElement('img');
        const mediaSource = item.src || item.url;
        const thumbUrl = getOptimizedCloudinaryUrl(mediaSource, { width: 650 });
        img.src = thumbUrl;
        img.srcset = getCloudinarySrcset(mediaSource, [400, 650]);
        img.sizes = '(max-width: 540px) 92vw, (max-width: 900px) 46vw, 360px';
        img.alt = item.alt || gallery.title;
        img.loading = index < 4 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.width = item.width || 600;
        img.height = item.height || 800;

        if (!isReduced) {
          img.classList.add('apple-img-fade');
          const onImgDone = () => {
            img.classList.add('is-img-ready');
            img.removeEventListener('load', onImgDone);
            img.removeEventListener('error', onImgDone);
          };
          if (img.complete && img.naturalWidth > 0) {
            img.classList.add('is-img-ready');
          } else {
            img.addEventListener('load', onImgDone, { once: true });
            img.addEventListener('error', onImgDone, { once: true });
          }
        }

        img.addEventListener('error', () => {
          card.style.display = 'none';
        });

        // Clique abre no visualizador individual de detalhes com alta resolução (w_1400)
        card.addEventListener('click', () => {
          const detailData = {
            title: item.title || gallery.title,
            category: gallery.title.replace('Galeria · ', ''),
            mediaType: 'photo',
            image: mediaSource,
            caption: item.caption || item.alt || ''
          };
          openModal(detailData, card);
        });

        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        });

        frame.appendChild(img);
        card.appendChild(frame);
        return card;
      }

      function renderBatch() {
        const nextBatchEnd = Math.min(renderedCount + CAT_BATCH_SIZE, items.length);
        const fragment = document.createDocumentFragment();
        const batchCards = [];

        for (let i = renderedCount; i < nextBatchEnd; i++) {
          const card = createPhotoCard(items[i], i, i - renderedCount);
          batchCards.push(card);
          fragment.appendChild(card);
        }

        renderedCount = nextBatchEnd;

        if (sentinel && sentinel.parentNode === photosList) {
          photosList.insertBefore(fragment, sentinel);
        } else {
          photosList.appendChild(fragment);
        }

        const isReduced = paused || matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!isReduced) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              batchCards.forEach(c => c.classList.add('is-batch-shown'));
            });
          });
        }

        if (renderedCount >= items.length) {
          if (catObserver) {
            catObserver.disconnect();
            catObserver = null;
          }
          if (sentinel && sentinel.parentNode) {
            sentinel.remove();
            sentinel = null;
          }
        }
      }

      // Renderiza lote inicial (8 fotos)
      renderBatch();

      // Se houver mais fotos, configura IntersectionObserver com o contêiner de rolagem correto (.cat-modal-wrapper)
      if (renderedCount < items.length) {
        sentinel = document.createElement('div');
        sentinel.className = 'cat-modal-sentinel';
        sentinel.style.cssText = 'height: 40px; width: 100%; column-span: all; pointer-events: none;';
        photosList.appendChild(sentinel);

        if ('IntersectionObserver' in window && wrapper) {
          catObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              renderBatch();
            }
          }, {
            root: wrapper,
            rootMargin: '250px'
          });
          catObserver.observe(sentinel);
        } else {
          while (renderedCount < items.length) {
            renderBatch();
          }
        }
      }
    }
  }

  catModal.classList.remove('is-closing');
  catModal.showModal();
  document.body.style.overflow = 'hidden';

  if (wrapper) wrapper.scrollTop = 0;
}

let isClosingCatModal = false;
function closeCategoryModal() {
  if (!catModal || !catModal.open || isClosingCatModal) return;
  const isReduced = paused || matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (catObserver) {
    catObserver.disconnect();
    catObserver = null;
  }

  const finishClose = () => {
    isClosingCatModal = false;
    const photosList = $('#cat-modal-photos-list');
    if (photosList) photosList.innerHTML = '';
    catModal.classList.remove('is-closing');
    try { catModal.close(); } catch(e){}
    document.body.style.overflow = '';
    if (catLastFocused && typeof catLastFocused.focus === 'function') {
      catLastFocused.focus();
    }
  };

  if (isReduced) {
    finishClose();
  } else {
    isClosingCatModal = true;
    catModal.classList.add('is-closing');
    setTimeout(finishClose, 160);
  }
}

if (catModal) {
  const closeBtn = $('#cat-modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeCategoryModal);

  catModal.addEventListener('close', () => {
    document.body.style.overflow = '';
    isClosingCatModal = false;
    catModal.classList.remove('is-closing');
    if (catLastFocused && typeof catLastFocused.focus === 'function') {
      catLastFocused.focus();
    }
  });
  catModal.addEventListener('click', e => {
    if (e.target === catModal) {
      const r = catModal.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        closeCategoryModal();
      }
    }
  });
  catModal.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCategoryModal();
    }
  });
}

// Attach modal events to work cards
$$('.work-card').forEach(card=>{
  card.style.cursor='pointer';
  card.setAttribute('tabindex','0');
  card.setAttribute('role','button');
  
  if (card.classList.contains('work-card-explore')) {
    card.setAttribute('aria-label', `Abrir galeria completa com mais fotos`);
    
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      openCategoryModal(card.dataset.openGallery, card);
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('a')) return;
        e.preventDefault();
        openCategoryModal(card.dataset.openGallery, card);
      }
    });
    return;
  }

  card.setAttribute('aria-label', card.dataset.link ? `Abrir destaques de ${card.dataset.title||'trabalho'} no Instagram` : `Ver detalhes de ${card.dataset.title||'trabalho'}`);

  card.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    if (card.dataset.link) {
      window.open(card.dataset.link, '_blank', 'noopener,noreferrer');
      return;
    }
    const d = {
      title: card.dataset.title,
      category: card.dataset.category,
      mediaType: card.dataset.mediaType,
      image: card.dataset.image,
      caption: card.dataset.caption,
      videoSrc: card.dataset.videoSrc,
      link: card.dataset.link
    };
    openModal(d, card);
  });

  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('a')) return;
      e.preventDefault();
      if (card.dataset.link) {
        window.open(card.dataset.link, '_blank', 'noopener,noreferrer');
        return;
      }
      const d = {
        title: card.dataset.title,
        category: card.dataset.category,
        mediaType: card.dataset.mediaType,
        image: card.dataset.image,
        caption: card.dataset.caption,
        videoSrc: card.dataset.videoSrc,
        link: card.dataset.link
      };
      openModal(d, card);
    }
  });
});

// Garante que o clique no botão do Instagram dentro do card abra o link sem abrir a modal
$$('.work-card-insta-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
  });
});

// Fallback gracioso para falha de carregamento de imagens remotas
$$('.work-card img').forEach(img => {
  img.addEventListener('error', () => {
    const card = img.closest('.work-card');
    if (card) {
      card.style.display = 'none';
      console.warn('Card ocultado com segurança devido a erro na imagem:', img.src);
    }
  });
});

// Category selector and conditional company field logic
const categorySelect=$('#field-category');
const companyWrapper=$('#company-wrapper');
const companyInput=$('#field-company');

function updateCompanyField(category){
  const isCorporate=(category==='Conteúdo para empresa');
  if(companyWrapper){
    companyWrapper.style.display=isCorporate?'block':'none';
  }
  if(companyInput){
    companyInput.required=isCorporate;
    if(!isCorporate){
      companyInput.value='';
    }
  }
}

if(categorySelect){
  categorySelect.addEventListener('change',()=>updateCompanyField(categorySelect.value));
  updateCompanyField(categorySelect.value);
}

// Category buttons: select category and scroll to contact
$$('[data-select-category]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const cat=btn.dataset.selectCategory;
    if(categorySelect){
      categorySelect.value=cat;
      updateCompanyField(cat);
      categorySelect.style.borderColor='#fff';
      setTimeout(()=>{categorySelect.style.borderColor='';},1200);
    }
    const contactSec=$('#contato');
    if(contactSec){
      contactSec.scrollIntoView({behavior:paused?'instant':'smooth'});
      setTimeout(()=>{
        const nameField=$('#field-name');
        if(nameField)nameField.focus();
      },450);
    }
  });
});

// Package selection buttons to auto-select format in the contact form
$$('[data-select-format]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const format=btn.dataset.selectFormat;
    const select=$('#field-production-type');
    if(select){
      select.value=format;
      select.style.borderColor='#fff';
      setTimeout(()=>{select.style.borderColor='';},1200);
    }
    const contactSec=$('#contato');
    if(contactSec){
      contactSec.scrollIntoView({behavior:paused?'instant':'smooth'});
      setTimeout(()=>{
        const nameField=$('#field-name');
        if(nameField)nameField.focus();
      },450);
    }
  });
});

// Contact brief form submission
const briefForm=$('#brief');
if(briefForm){
  briefForm.addEventListener('submit',e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const category=String(f.get('category')||'').trim();
    const prodType=String(f.get('production_type')||'').trim();
    const name=String(f.get('name')||'').trim();
    const company=String(f.get('company')||'').trim();
    const city=String(f.get('city')||'').trim();
    const dateRaw=String(f.get('date')||'').trim();
    const desc=String(f.get('project_desc')||'').trim();

    let dateText='';
    if(dateRaw){
      const parts=dateRaw.split('-');
      if(parts.length===3){
        dateText=`, com previsão para ${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const companyPart=(category==='Conteúdo para empresa'&&company)?` da empresa ${company}`:'';
    const cityPart=city?` em ${city}`:'';
    const formatPart=prodType?` (formato: ${prodType})`:'';

    let text=`Olá, Cauan! Meu nome é ${name}${companyPart}. Gostaria de solicitar um orçamento para ${category}${formatPart}${cityPart}${dateText}.`;
    if(desc){
      text+=` Sobre o projeto: "${desc}".`;
    }
    text+=` Podemos conversar sobre o escopo e a disponibilidade?`;

    $('#result textarea').value=text;
    $('#send').href='https://wa.me/5577988629229?text='+encodeURIComponent(text);
    $('#result').hidden=false;
    $('#result').scrollIntoView({behavior:paused?'instant':'smooth',block:'nearest'});
  });
}

const copyBtn=$('.copy');
if(copyBtn){
  copyBtn.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText($('#result textarea').value);
      $('#copy-status').textContent='Mensagem copiada.';
    }catch{
      $('#result textarea').select();
      $('#copy-status').textContent='Selecione e copie a mensagem acima.';
    }
  });
}

/* ============================================================
   ANIMAÇÃO DA LINHA DE LUZ NAS ETAPAS (MOBILE)
   ============================================================ */
function initStepsAnimation() {
  const stepsContainer = $('#steps-container');
  if (!stepsContainer) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          stepsContainer.classList.add('is-active');
        }
      });
    }, { threshold: 0.15 });

    observer.observe(stepsContainer);
  } else {
    stepsContainer.classList.add('is-active');
  }
}
initStepsAnimation();

/* ============================================================
   CARROSSEL COM PONTOS NAVEGÁVEIS (ESTILO INSTAGRAM NO MOBILE)
   ============================================================ */
function initCategoryCarousels() {
  const categoryBlocks = $$('.category-block');
  categoryBlocks.forEach((block) => {
    const grid = block.querySelector('.category-cards-grid');
    const dotsContainer = block.querySelector('.carousel-dots');
    if (!grid || !dotsContainer) return;

    const cards = Array.from(grid.querySelectorAll('.work-card'));
    const dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));
    if (cards.length === 0 || dots.length === 0) return;

    // Clique no ponto desliza suavemente até o card
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        if (cards[index]) {
          const targetLeft = cards[index].offsetLeft - (grid.clientWidth - cards[index].clientWidth) / 2;
          grid.scrollTo({
            left: Math.max(0, targetLeft),
            behavior: paused ? 'auto' : 'smooth'
          });
          updateActiveDot(dots, index);
        }
      });
    });

    // Atualiza ponto ativo conforme o usuário arrasta no touch
    let scrollTimeout;
    grid.addEventListener('scroll', () => {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(() => {
        const gridLeft = grid.getBoundingClientRect().left;
        const gridCenter = gridLeft + grid.offsetWidth / 2;

        let closestIndex = 0;
        let minDiff = Infinity;

        cards.forEach((card, i) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const diff = Math.abs(cardCenter - gridCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        });

        updateActiveDot(dots, closestIndex);
      });
    }, { passive: true });
  });

  function updateActiveDot(dotsList, activeIndex) {
    dotsList.forEach((d, idx) => {
      const isActive = idx === activeIndex;
      d.classList.toggle('is-active', isActive);
      d.setAttribute('aria-selected', String(isActive));
    });
  }
}
initCategoryCarousels();
