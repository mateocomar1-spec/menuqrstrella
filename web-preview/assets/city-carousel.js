
'use strict';
(() => {
 const root=document.querySelector('[data-city-carousel]');if(!root)return;
 const slides=Array.from(root.querySelectorAll('.city-slide'));if(slides.length<2)return;
 const controls=root.querySelector('[data-city-controls]');const toggle=root.querySelector('[data-city-toggle]');
 const label=root.querySelector('[data-city-label]');const counter=root.querySelector('[data-city-counter]');const status=root.querySelector('[data-city-status]');
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer=null,userPaused=motion.matches,hovered=false,focused=false,busy=false;
 function updateButton(){toggle.setAttribute('aria-label',userPaused?'Reanudar cambio automático de fotos':'Pausar cambio automático de fotos');toggle.querySelector('span').textContent=userPaused?'▶':'Ⅱ';}
 function clear(){if(timer!==null){clearTimeout(timer);timer=null;}}
 function schedule(){clear();if(!userPaused&&!hovered&&!focused&&!document.hidden&&!busy)timer=setTimeout(()=>show(current+1,false),6000);}
 async function ready(slide){const img=slide.querySelector('img');if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src;}if(img.complete&&img.naturalWidth>0)return;await img.decode();if(!img.naturalWidth)throw new Error('Image unavailable');}
 async function show(target,manual){if(manual){userPaused=true;updateButton();}if(busy)return;clear();busy=true;
  try{const next=(target+slides.length)%slides.length;await ready(slides[next]);slides[current].classList.remove('is-active');slides[current].setAttribute('aria-hidden','true');current=next;slides[current].classList.add('is-active');slides[current].setAttribute('aria-hidden','false');label.textContent=slides[current].dataset.place;counter.textContent=`${current+1} / ${slides.length}`;if(manual)status.textContent=`Foto ${current+1} de ${slides.length}: ${slides[current].dataset.place}`;}
  catch{if(manual)status.textContent='Esta foto no se pudo cargar. Podés probar con otra.';}
  finally{busy=false;schedule();}
 }
 root.querySelector('[data-city-prev]').addEventListener('click',()=>show(current-1,true));root.querySelector('[data-city-next]').addEventListener('click',()=>show(current+1,true));
 toggle.addEventListener('click',()=>{userPaused=!userPaused;updateButton();schedule();});
 root.addEventListener('mouseenter',()=>{hovered=true;clear();});root.addEventListener('mouseleave',()=>{hovered=false;schedule();});
 root.addEventListener('focusin',()=>{focused=true;clear();});root.addEventListener('focusout',()=>{setTimeout(()=>{focused=root.contains(document.activeElement);schedule();},0);});
 document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',()=>{if(motion.matches){userPaused=true;updateButton();schedule();}});
 controls.hidden=false;updateButton();schedule();
})();
