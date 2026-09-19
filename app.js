const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal animation observer
const observer=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    e.target.classList.add('visible');
    observer.unobserve(e.target);
  }
}),{threshold:.08});

$$('.intro h2,.intro-desc,.intro-grid,.stat-box,.portfolio-hub,.category-block,.wedding-editorial-card,.work-card,.event-details-strip,.services>div,.formats-header,.format-card,.formats-footer,.process h2,.steps article,.feedback h2,.faq>div,.contact>div').forEach(el=>{
  el.classList.add('reveal');
  observer.observe(el);
});

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
      const gearImg=$('.gear-visual img');
      if(gearImg)gearImg.style.transform=`translateY(${(gp-.5)*-40}px) rotate(${gp*28-14}deg) scale(${1-gp*.1})`;
      const gearTitle=$('.gear-title');
      if(gearTitle){
        gearTitle.style.transform=`translateY(${-gp*65}px)`;
        gearTitle.style.opacity=1-clamp((gp-.2)*2.2);
      }
      const gearCopy=$('.gear-copy');
      if(gearCopy){
        gearCopy.inert=gp<.25;
        gearCopy.style.opacity=clamp((gp-.22)*3);
        gearCopy.style.transform=`translateY(${(1-clamp((gp-.22)*3))*35}px)`;
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
    $$('.gear-visual img,.hero-portrait-cutout,.gear-title,.gear-copy').forEach(x=>{
      if(x){x.style.transform='';x.style.filter='';x.style.opacity='';}
    });
  }
  render();
  window.dispatchEvent(new CustomEvent('cauan:motion', {detail:{paused}}));
}

const motionBtn=$('#motion');
if(motionBtn)motionBtn.addEventListener('click',()=>{paused=!paused;motionState()});
motionState();

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
    if(typeEl)typeEl.textContent='🎥 Vídeo';
  }else{
    if(vidBox)vidBox.hidden=true;
    if(vid){
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    }
    if(img){
      img.hidden=false;
      img.src=data.image||'';
      img.alt=data.title||'Trabalho do portfólio de Cauan';
    }
    if(typeEl)typeEl.textContent='📷 Fotografia';
  }

  if(extLink){
    if(data.link){
      extLink.href=data.link;
      extLink.textContent='Ver este trabalho ↗';
    }else{
      extLink.href='https://www.instagram.com/cauanvideomaker_/';
      extLink.textContent='Ver mais no Instagram ↗';
    }
  }

  dialog.showModal();
  document.body.style.overflow='hidden';
  if(data.mediaType==='video'&&data.videoSrc&&vid){
    vid.play().catch(e=>console.log('Autoplay handled:', e));
  }
}

function closeModal(){
  if(!dialog||!dialog.open)return;
  const vid=$('#modal-video');
  if(vid){
    vid.pause();
    vid.removeAttribute('src');
    vid.load();
  }
  dialog.close();
  document.body.style.overflow='';
  if(lastFocusedElement&&typeof lastFocusedElement.focus==='function'){
    lastFocusedElement.focus();
  }
}

if(dialog){
  const closeBtn=dialog.querySelector('.close');
  if(closeBtn)closeBtn.addEventListener('click',closeModal);
  dialog.addEventListener('close',()=>{
    document.body.style.overflow='';
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

// Attach modal events to work cards
$$('.work-card').forEach(card=>{
  card.style.cursor='pointer';
  card.setAttribute('tabindex','0');
  card.setAttribute('role','button');
  card.setAttribute('aria-label',`Ver detalhes de ${card.dataset.title||'trabalho'}`);

  card.addEventListener('click',e=>{
    if(e.target.closest('a'))return;
    const d={
      title:card.dataset.title,
      category:card.dataset.category,
      mediaType:card.dataset.mediaType,
      image:card.dataset.image,
      caption:card.dataset.caption,
      videoSrc:card.dataset.videoSrc,
      link:card.dataset.link
    };
    openModal(d,card);
  });

  card.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){
      if(e.target.closest('a'))return;
      e.preventDefault();
      const d={
        title:card.dataset.title,
        category:card.dataset.category,
        mediaType:card.dataset.mediaType,
        image:card.dataset.image,
        caption:card.dataset.caption,
        videoSrc:card.dataset.videoSrc,
        link:card.dataset.link
      };
      openModal(d,card);
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
