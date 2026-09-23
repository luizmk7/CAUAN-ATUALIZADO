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

$$('.intro-kicker,.intro h2,.intro-desc,.stat-box,.portfolio-hub,.category-block,.services>div,.formats-header,.formats-footer,.process h2,.feedback h2,.faq>div,.contact>div').forEach(el=>{
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

// ============================================================
// GALERIA EXPANDIDA POR CATEGORIA (MODAL DE MAIS FOTOS)
// ============================================================
// Catálogo de fotos integrado (Garante funcionamento 100% autônomo e à prova de falhas na publicação)
const BUILTIN_PORTFOLIO = {"formaturas":[{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119535/99051_heif_syorwn.webp","alt":"Formanda com beca preta segurando capelo","title":"A Conquista do Diploma","caption":"O sorriso radiante que celebra anos de dedicação e o início de um novo ciclo profissional."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119532/99043_heif_hnjw4l.webp","alt":"Formanda sorrindo com beca e capelo","title":"Sorrisos na Graduação","caption":"O sorriso radiante que marca a celebração e a vitória de um grande ciclo concluído."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119526/99097_heif_zbanw9.webp","alt":"Formandos de Medicina em palco festivo","title":"A Medicina e o Sonho","caption":"A celebração de um sonho realizado sob as luzes da vitória acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119524/99096_heif_o0pykd.webp","alt":"Formanda em beca solene","title":"Brilho no Olhar","caption":"O sorriso de quem transformou anos de dedicação em uma conquista inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119522/99091_heif_ex2xaw.webp","alt":"Formandas comemorando no baile","title":"Euforia e Vitória","caption":"A alegria vibrante de uma jornada acadêmica que termina em grande estilo."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119521/99089_heif_l32cib.webp","alt":"Formanda posando com toga e canudo","title":"Retratos da Jornada","caption":"O brilho no olhar de quem celebra o fim de uma jornada e o início de um sonho."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119520/99087_heif_t32mvy.webp","alt":"Grupo de formandas com capelo","title":"O Capelo e a Conquista","caption":"A celebração de anos de dedicação concretizada no brilho de um diploma."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119517/99086_heif_mwrlup.webp","alt":"Casal celebrando formatura no salão","title":"Novos Horizontes","caption":"A celebração do esforço e o brilho de uma nova jornada profissional."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119513/99080_heif_w7wdld.webp","alt":"Formanda sorridente na colação","title":"Abraços e Conquista","caption":"O sorriso radiante de quem celebra a concretização de uma grande jornada acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119512/99079_heif_x9nju4.webp","alt":"Ensaio de formando em estúdio e externo","title":"O Brilho da Trajetória","caption":"A elegância de um momento especial, marcando o início de uma nova jornada."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119512/99076_heif_ooufoz.webp","alt":"Formanda erguendo o diploma","title":"O Diploma em Mãos","caption":"Celebrando a realização de um sonho e o início de um futuro brilhante."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119511/99077_heif_lr0sad.webp","alt":"Formanda no baile de formatura","title":"Vitória Compartilhada","caption":"Cada brilho neste olhar reflete o esforço e a dedicação de uma longa jornada acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119510/99075_heif_rntpwv.webp","alt":"Formanda em momento solene","title":"O Sonho Concretizado","caption":"O sorriso radiante que ilumina o fechamento de um ciclo inesquecível e o começo de um grande futuro."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119509/99073_heif_ody0tj.webp","alt":"Formanda sorrindo na cerimônia","title":"A Luz da Superação","caption":"O brilho inesquecível de quem celebra o ápice de uma importante jornada acadêmica."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119507/99071_heif_fx5fml.webp","alt":"Formanda com canudo de formatura","title":"Conclusão Inesquecível","caption":"A alegria estampada no rosto de quem concretiza o sonho de uma vida."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119505/99069_heif_gxuhtl.webp","alt":"Formanda celebrando conquista","title":"Aplausos e Realização","caption":"A alegria vibrante de quem alcançou o tão sonhado diploma acadêmico."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119505/99067_heif_yz8i1a.webp","alt":"Formandas comemorando em festa","title":"A Força da Dedicação","caption":"A alegria vibrante de celebrar uma vitória tão esperada ao lado de quem amamos."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119503/99065_heif_fqewtb.webp","alt":"Formanda de Medicina com óculos comemorativos","title":"Dra. Raissa e Conquista","caption":"A energia contagiante de um momento de pura celebração e brilho da formatura."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119502/99062_heif_bazvwk.webp","alt":"Formanda em traje solene com jabô branco","title":"O Instante Solene","caption":"O brilho no olhar de quem celebra a vitória de uma jornada inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119502/99063_heif_aswdy4.webp","alt":"Formanda de gala no baile","title":"Alegria que Transborda","caption":"A alegria estampada de quem alcançou o objetivo final com maestria."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119501/99059_heif_t9uuyz.webp","alt":"Formanda emocionada com canudo","title":"Vitória Inesquecível","caption":"O momento em que todo o esforço se transforma em uma vitória inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119500/99060_heif_ky9p9b.webp","alt":"Formanda no palco oficial","title":"Emoção no Palco","caption":"Cada lágrima e sorriso refletem a dedicação de uma jornada que hoje se torna realidade."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119494/99053_heif_pehebq.webp","alt":"Formanda comemorando no baile de formatura","title":"Brilho e Tradição","caption":"A celebração de uma nova etapa médica marcada pelo brilho da conquista."}],"eventos":[{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119532/99044_heif_xotvpk.webp","alt":"Retrato de mulher elegante em vestido verde de gala","title":"Brilho e Elegância Solene","caption":"Um sorriso radiante que ilumina a noite em uma celebração repleta de sofisticação."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119524/99095_heif_y7rrkz.webp","alt":"Jovem mulher sorridente em festa social","title":"Retratos em Festa","caption":"A leveza e a alegria eternizadas em um momento especial de celebração."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119520/99088_heif_qbzo0a.webp","alt":"Convidadas brindando com taças iluminadas","title":"Celebração em Movimento","caption":"A sintonia perfeita e a alegria capturadas em um brinde inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119516/99085_heif_nc0k1a.webp","alt":"Retrato em close-up de mulher em festa de gala","title":"Noite de Gala","caption":"A beleza e sofisticação que irradiam sob o brilho e luzes da noite."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119516/99084_heif_uwtt3r.webp","alt":"Convidados dançando na pista de dança","title":"Energia na Pista","caption":"A vibração contagiante e a alegria da festa eternizadas em movimento cheio de cor."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119515/99083_heif_v5vzpv.webp","alt":"Pista de dança com luzes reluzentes","title":"A Vibração da Festa","caption":"A vibração contagiante e o ritmo que eternizam a euforia do evento."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119508/99072_heif_nqugyd.webp","alt":"Jovem celebrando em festa com iluminação cênica","title":"Noite Inesquecível","caption":"A energia contagiante de uma noite inesquecível e cheia de estilo musical."}],"casamentos":[{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119535/99050_heif_xnd6g1.webp","alt":"Casal de noivos caminhando de mãos dadas","title":"Caminho Lado a Lado","caption":"A cumplicidade refletida em cada olhar no primeiro passeio como recém-casados."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119534/99045_heif_zhikee.webp","alt":"Noivos de costas caminhando para a cerimônia","title":"Passos Rumo ao Altar","caption":"A poesia de um novo começo capturada na luz serena do altar."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119534/99046_heif_e3zhvp.webp","alt":"Noiva com vestido de noiva em preparação","title":"O Preparo da Noiva","caption":"Cada pequeno detalhe do preparo carrega a expectativa e a magia do grande dia."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119532/99041_heif_vsro33.webp","alt":"Casal no altar sob gazebo decorado","title":"O Sim sob o Altar","caption":"O momento em que duas vidas se entrelaçam em uma promessa de amor eterno."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119531/99042_heif_zcqlow.webp","alt":"Mãos da noiva segurando terço e vestido","title":"A Fé e o Terço","caption":"Detalhes que guardam a essência e a espiritualidade de um momento único."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119530/99103_heif_nuicgn.webp","alt":"Noiva sorridente com vestido tomara-que-caia","title":"O Sorriso da Noiva","caption":"A beleza clássica de um momento que marca o início de uma nova jornada."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119529/99101_heif_lkk5nw.webp","alt":"Noivos aplaudidos pelos convidados","title":"Saída dos Noivos","caption":"Um momento inesquecível de alegria e luz no caminho rumo a uma nova vida a dois."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119529/99102_heif_fapyg5.webp","alt":"Noivos com buquê de lírios e medalhão","title":"Memória & Homenagens","caption":"Um momento de memória e afeto, eternizando quem amamos no dia mais especial."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119527/99100_heif_koq1ih.webp","alt":"Noiva em robe de cetim na preparação","title":"A Espera do Sim","caption":"Cada detalhe prepara o cenário para o momento mais esperado da vida a dois."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119527/99099_heif_joacsn.webp","alt":"Noiva com vestido longo e véu de costas","title":"O Véu e a Luz","caption":"A beleza singular de um momento inesquecível de preparação e contemplação."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119526/99098_heif_mzvlv5.webp","alt":"Noiva com olhos fechados e terço em oração","title":"O Brilho da Fé","caption":"Um momento de gratidão e emoção sincera que antecede o sagrado 'sim'."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119523/99094_heif_dgcfv8.webp","alt":"Porta-alianças bordado com nomes dos noivos","title":"As Alianças Mariana & N.","caption":"Dois corações que se tornam um sob a bênção de um compromisso eterno."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119522/99093_heif_peyatc.webp","alt":"Noiva sorridente no corredor da igreja","title":"A Noiva no Corredor","caption":"A pureza de um momento único capturado em plena harmonia com a celebração."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119521/99092_heif_lopswc.webp","alt":"Retrato intimista da noiva no making of","title":"Beleza e Serenidade","caption":"A elegância e a emoção em cada detalhe de um momento inesquecível."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119520/99090_heif_ajzpbq.webp","alt":"Mão da noiva dada ao pai a caminho do altar","title":"A Mão e o Altar","caption":"Cada passo compartilhado reflete o início de um novo e lindo capítulo de vida."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119516/99082_heif_m5owou.webp","alt":"Noivos no jardim ao entardecer","title":"O Encontro no Jardim","caption":"O instante em que o sol se curva para testemunhar a união de duas vidas."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119515/99081_heif_pvxkzz.webp","alt":"Noivos no altar ao ar livre","title":"Votos Sob o Céu","caption":"O momento em que duas vidas se entrelaçam sob o olhar atento da natureza."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119509/99074_heif_h9d3c7.webp","alt":"Noiva segurando buquê de lírios brancos","title":"O Buquê de Lírios","caption":"A elegância e a emoção de um momento que se tornará eterno na memória."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119506/99070_heif_zkuuvv.webp","alt":"Noivos de mãos dadas durante os votos","title":"Conexão e Promessa","caption":"A união de duas almas em um momento de pura conexão, cumplicidade e fé."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119505/99068_heif_pzznvg.webp","alt":"Noivo beijando a testa da noiva em preto e branco","title":"O Beijo e a Ternura","caption":"Um momento de pura ternura que eterniza a união de duas almas apaixonadas."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119502/99064_heif_zc4epk.webp","alt":"Noiva observando vestido pendurado","title":"O Vestido e a Expectativa","caption":"Cada detalhe é um passo em direção ao sonho que está prestes a se realizar."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119501/99061_heif_h7sfxd.webp","alt":"Detalhes cenográficos do casamento","title":"Detalhes da Recepção","caption":"Cada detalhe foi planejado com carinho para celebrar o início de uma vida a dois."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119499/99058_heif_is6d89.webp","alt":"Casal caminhando sorridente na festa","title":"Celebração Radiante","caption":"Um momento de pura euforia e brilho celebrando o início de uma nova jornada a dois."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119497/99057_heif_mssbdo.webp","alt":"Noiva sorridente abraçada ao noivo","title":"Um Sonho a Dois","caption":"O brilho no olhar de quem celebra o início de uma nova jornada a dois."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119496/99054_heif_qckgd3.webp","alt":"Noivos em ensaio noturno iluminado","title":"Noivos Sob as Estrelas","caption":"A celebração eterna de um compromisso que floresce sob o brilho da noite."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119496/99056_heif_utlydd.webp","alt":"Noiva em momento de reflexão e oração","title":"Momento Sagrado","caption":"A serenidade e a fé marcam o início de uma nova jornada de união e amor."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119497/99055_heif_snjxo2.webp","alt":"Noivos se beijando entre sparkles iluminados","title":"O Beijo com Sparkles","caption":"Um momento mágico iluminado pelo brilho dos convidados e pela promessa de uma vida juntos."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790119494/99052_heif_dyy5go.webp","alt":"Noiva sentada em ajustes finais do vestido","title":"Os Toques Finais do Vestido","caption":"Cada detalhe é cuidadosamente ajustado para o momento em que o sonho se torna realidade."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790117655/99041_heif_1_ylunw3.webp","alt":"Noivos no altar durante troca de alianças","title":"A Troca de Alianças","caption":"Um momento inesquecível selado com a beleza da natureza e a luz de uma nova jornada."},{"src":"https://res.cloudinary.com/lvl0nq3r/image/upload/v1790117570/99103_heif_1_cwnu80.webp","alt":"Noiva sorridente descendo escada com buquê","title":"A Descida Radiante da Noiva","caption":"A descida emocionante da noiva com buquê e véu a caminho do altar."}],"aniversarios":[{"src":"https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=85","alt":"Aniversário - Celebração e luzes","title":"Celebração Vibrante","caption":"Momentos espontâneos entre amigos."},{"src":"https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=85","alt":"Aniversário - Brinde entre amigos","title":"O Brinde Perfeito","caption":"A emoção de comemorar mais um ano de vida."},{"src":"https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=85","alt":"Aniversário - Detalhes do bolo e velas","title":"Detalhes Especiais","caption":"Cada detalhe pensado com carinho para a celebração."},{"src":"https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=85","alt":"Aniversário - Sorrisos e encontros","title":"Sorrisos e Encontros","caption":"Gargalhadas sinceras e abraços apertados."}]};

function getCategoryItems(cat) {
  // 1. Prioridade: PORTFOLIO_MANIFEST dinamicamente avaliado no momento do clique
  if (typeof PORTFOLIO_MANIFEST !== 'undefined' && Array.isArray(PORTFOLIO_MANIFEST)) {
    const matched = PORTFOLIO_MANIFEST.filter(i => i.category === cat).map(i => ({
      src: i.url,
      alt: i.alt || i.title || '',
      title: i.title || '',
      caption: i.caption || ''
    }));
    if (matched.length > 0) return matched;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.PORTFOLIO_MANIFEST)) {
    const matched = window.PORTFOLIO_MANIFEST.filter(i => i.category === cat).map(i => ({
      src: i.url,
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
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Formaturas no site e gostaria de solicitar um orçamento para o meu evento.'
  },
  eventos: {
    title: 'Galeria · Eventos & Shows',
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Eventos no site e gostaria de solicitar um orçamento para cobertura.'
  },
  aniversarios: {
    title: 'Galeria · Aniversários',
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Aniversários no site e gostaria de solicitar um orçamento.'
  },
  casamentos: {
    title: 'Galeria · Casamentos',
    whatsappMessage: 'Olá, Cauan! Vi a galeria de Casamentos no site e gostaria de conversar sobre a cobertura da minha data.'
  }
};

const catModal = $('#category-gallery-modal');
let catLastFocused = null;

function openCategoryModal(catKey, triggerEl) {
  if (!catModal) return;
  const gallery = categoryGalleries[catKey];
  if (!gallery) return;

  catLastFocused = triggerEl || document.activeElement;

  const titleEl = $('#cat-modal-title');
  const instaBtn = $('#cat-modal-insta-btn') || $('#cat-modal-wa-btn');
  const photosList = $('#cat-modal-photos-list');

  if (titleEl) titleEl.textContent = gallery.title;
  if (instaBtn) instaBtn.href = 'https://www.instagram.com/cauanvideomaker_/';

  // Renderiza fotos no layout de galeria preservando orientação vertical e horizontal
  if (photosList) {
    photosList.innerHTML = '';
    const items = getCategoryItems(catKey);
    if (!items || items.length === 0) {
      photosList.innerHTML = '<div style="column-span: all; text-align: center; padding: 48px 20px; color: #8A92A2;"><p>Carregando fotos da galeria...</p></div>';
    } else {
      items.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'cat-large-photo-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Ampliar imagem: ${item.alt || gallery.title}`);

      const frame = document.createElement('div');
      frame.className = 'cat-large-photo-frame';

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || gallery.title;
      img.loading = index < 6 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';

      img.addEventListener('error', () => {
        card.style.display = 'none';
      });

      // Clique abre no visualizador individual de detalhes
      card.addEventListener('click', () => {
        const detailData = {
          title: item.title || gallery.title,
          category: gallery.title.replace('Galeria · ', ''),
          mediaType: 'photo',
          image: item.src,
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
      photosList.appendChild(card);
      });
    }
  }

  catModal.showModal();
  document.body.style.overflow = 'hidden';

  // Reseta scroll do modal para o topo
  const wrapper = catModal.querySelector('.cat-modal-wrapper');
  if (wrapper) wrapper.scrollTop = 0;
}

function closeCategoryModal() {
  if (!catModal || !catModal.open) return;
  catModal.close();
  document.body.style.overflow = '';
  if (catLastFocused && typeof catLastFocused.focus === 'function') {
    catLastFocused.focus();
  }
}

if (catModal) {
  const closeBtn = $('#cat-modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeCategoryModal);

  catModal.addEventListener('close', () => {
    document.body.style.overflow = '';
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
          cards[index].scrollIntoView({
            behavior: paused ? 'instant' : 'smooth',
            block: 'nearest',
            inline: 'center'
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
