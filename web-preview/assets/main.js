'use strict';
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('navigation');
function closeNavigation(){nav?.classList.remove('open');navToggle?.setAttribute('aria-expanded','false');}
navToggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeNavigation));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('open')){closeNavigation();navToggle.focus();}});
const form=document.getElementById('contact-form');
form?.addEventListener('submit',event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const fields=new FormData(form);
 const name=String(fields.get('name')||'').trim();
 const business=String(fields.get('business')||'').trim();
 const message=String(fields.get('message')||'').trim();
 if(!name||!business||!message){document.getElementById('form-status').textContent='Completá tu nombre, negocio y consulta.';return;}
 const text=`Hola, soy ${name}.\nMi negocio: ${business}.\nQuiero consultar por: ${fields.get('service')}.\n\n${message}`;
 document.dispatchEvent(new CustomEvent('strella:contact-prepared'));
 const url='https://wa.me/5492944636642?text='+encodeURIComponent(text);
 const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click();
 const status=document.getElementById('form-status');status.replaceChildren(document.createTextNode('Tu consulta está preparada. Si WhatsApp no se abrió, '));
 const retry=document.createElement('a');retry.href=url;retry.target='_blank';retry.rel='noopener noreferrer';retry.textContent='abrila desde acá';retry.style.textDecoration='underline';status.append(retry,document.createTextNode('. Revisá y enviá el mensaje allí.'));
});
// Testimonios editoriales: cargar únicamente textos auténticos, sin modificar su sentido.
// Sin datos válidos, la sección permanece oculta. No genera estrellas ni datos estructurados.
const section=document.querySelector('[data-reviews-section]');
if(section){fetch('/assets/reviews.json').then(r=>{if(!r.ok)throw Error('No reviews');return r.json();}).then(data=>{
 let profile;try{profile=new URL(data.googleProfileUrl);}catch{return;}
 const validHost=h=>h==='google.com'||h.endsWith('.google.com')||h==='maps.app.goo.gl'||h==='g.page';
 if(profile.protocol!=='https:'||!validHost(profile.hostname))return;
 const valid=(Array.isArray(data.reviews)?data.reviews:[]).filter(r=>typeof r.author==='string'&&r.author.trim()&&typeof r.text==='string'&&r.text.trim());
 if(!valid.length)return;
 const container=document.querySelector('[data-reviews]');
 valid.slice(0,6).forEach(review=>{const article=document.createElement('figure');article.className='review';const quote=document.createElement('blockquote');const p=document.createElement('p');p.textContent=review.text;quote.append(p);const cite=document.createElement('figcaption');cite.textContent=review.author;const source=document.createElement('span');source.className='micro';source.textContent='Reseña publicada en Google'+(review.date?' · '+review.date:'');cite.append(source);article.append(quote,cite);container.append(article);});
 document.querySelector('[data-google-profile]').href=profile.href;section.hidden=false;
}).catch(()=>{});}

// Opciones de correo para visitantes sin una aplicación predeterminada.
(function(){
 const email='hola@strellaestudio.com.ar';
 let dialog,opener;
 function createEmailDialog(){
  const style=document.createElement('style');
  style.textContent='.email-dialog{box-sizing:border-box;width:min(440px,calc(100% - 32px));max-height:calc(100dvh - 32px);overflow:auto;padding:28px;border:1px solid #ffffff40;border-radius:20px;background:#0b1220;color:#fff;font-family:inherit}.email-dialog::backdrop{background:#000b}.email-dialog h2{font-size:28px;margin:0 0 12px}.email-dialog p{font-size:15px;line-height:1.6;overflow-wrap:anywhere}.email-dialog .email-options{display:grid;gap:10px}.email-dialog .email-options a,.email-dialog button{box-sizing:border-box;display:block;padding:12px 16px;border:1px solid #ffffff55;border-radius:10px;background:transparent;color:#fff;font:inherit;font-size:15px;text-align:center;cursor:pointer;text-decoration:none;min-height:44px}.email-dialog .email-options a:hover,.email-dialog button:hover{border-color:#ff7300}.email-dialog a:focus-visible,.email-dialog button:focus-visible{outline:2px solid #ff7300;outline-offset:3px}.email-dialog .email-close{margin:18px 0 0;width:100%}.email-dialog .email-address{font-weight:600;user-select:all}.email-dialog .email-copy{background:#ff7300;border-color:#ff7300;color:#0b1220}.email-dialog .email-status{min-height:24px;margin:12px 0 0}';
  document.head.append(style);
  dialog=document.createElement('dialog');dialog.className='email-dialog';dialog.setAttribute('aria-labelledby','email-dialog-title');
  dialog.innerHTML='<h2 id="email-dialog-title">Escribinos por mail</h2><p>Elegí cómo querés escribirnos o copiá la dirección.</p><p class="email-address">hola@strellaestudio.com.ar</p><div class="email-options"><a href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=hola%40strellaestudio.com.ar" target="_blank" rel="noopener noreferrer">Abrir Gmail ↗</a><a href="https://outlook.live.com/mail/0/deeplink/compose?to=hola%40strellaestudio.com.ar" target="_blank" rel="noopener noreferrer">Abrir Outlook ↗</a><a href="mailto:hola@strellaestudio.com.ar">Usar mi aplicación de correo</a><button type="button" class="email-copy">Copiar dirección</button></div><p class="email-status" role="status"></p><button type="button" class="email-close">Cerrar</button>';
  document.body.append(dialog);
  dialog.querySelector('.email-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>opener?.focus());
  dialog.querySelector('.email-copy').addEventListener('click',async()=>{
   const status=dialog.querySelector('.email-status');
   try{await navigator.clipboard.writeText(email);status.textContent='Dirección copiada. Pegala en tu correo.';}
   catch{status.textContent='Seleccioná la dirección de arriba y copiala para pegarla en tu correo.';}
  });
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href^="mailto:"]');
  if(!link||link.getAttribute('href').split('?')[0].toLowerCase()!=='mailto:'+email||dialog?.contains(link)||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  if(typeof HTMLDialogElement==='undefined')return;
  event.preventDefault();opener=link;
  if(!dialog)createEmailDialog();
  dialog.querySelector('.email-status').textContent='';
  dialog.showModal();
 });
})();
