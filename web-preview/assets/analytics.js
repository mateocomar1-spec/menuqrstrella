// Cargado solo en producción. No envía datos a Google antes de la aceptación.
const resetButton=document.querySelector('[data-reset-analytics]');if(resetButton)resetButton.hidden=false;
const id=document.querySelector('meta[name="strella-measurement-id"]')?.content;
const key='strella-analytics-choice';let active=false;
function start(){if(active||!/^G-[A-Z0-9]+$/.test(id||''))return;active=true;window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(script);gtag('js',new Date());gtag('config',id);}
let choice=null;try{choice=localStorage.getItem(key)}catch{}
if(choice==='yes')start();
const banner=document.querySelector('[data-analytics-choice]');if(banner&&!choice)banner.hidden=false;
banner?.addEventListener('click',event=>{const answer=event.target.closest('[data-choice]')?.dataset.choice;if(!answer)return;try{localStorage.setItem(key,answer)}catch{}banner.hidden=true;if(answer==='yes')start();});
document.querySelector('[data-reset-analytics]')?.addEventListener('click',()=>{try{localStorage.removeItem(key)}catch{}location.reload();});
document.addEventListener('click',event=>{const a=event.target.closest('[data-contact="whatsapp"]');if(a&&active)gtag('event','contact_click',{contact_method:'whatsapp',page_path:location.pathname});});
document.addEventListener('strella:contact-prepared',()=>{if(active)gtag('event','contact_prepare',{contact_method:'whatsapp',page_path:location.pathname});});
