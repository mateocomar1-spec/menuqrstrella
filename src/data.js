import {createClient} from '@supabase/supabase-js';
export const connected=Boolean(import.meta.env.VITE_SUPABASE_URL&&import.meta.env.VITE_SUPABASE_ANON_KEY);
export const client=connected?createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY):null;
let version=0;
export async function loadMenu() {
 if(!client){const r=await fetch('/menu.json');if(!r.ok)throw new Error('No se pudo cargar el catálogo.');return r.json();}
 const {data,error}=await client.from('menus').select('payload,version').eq('id','la-piccolina').single();
 if(error)throw new Error('No se pudo cargar el menú. Revisá la configuración de Supabase.');
 version=data.version; return data.payload;
}
export async function isAdmin(){if(!client)return true;const {data:{user}}=await client.auth.getUser();if(!user)return false;const {data,error}=await client.rpc('is_menu_admin');return !error&&data===true;}
export async function saveMenu(payload){
 if(!client)return;
 const {data,error}=await client.from('menus').update({payload,version:version+1}).eq('id','la-piccolina').eq('version',version).select('version');
 if(error)throw new Error('No se pudo guardar. Comprobá tu sesión y tus permisos.');
 if(!data?.length)throw new Error('Otra sesión modificó el menú. Recargá antes de editar nuevamente.');
 version=data[0].version;
}
export async function uploadImage(file){
 if(!client)throw new Error('La carga de fotos requiere conectar Supabase. Podés probar con una URL HTTPS.');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Usá una foto JPG, PNG o WebP de hasta 5 MB.');
 const path=`products/${crypto.randomUUID()}.${{'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type]}`;
 const {error}=await client.storage.from('menu-images').upload(path,file,{contentType:file.type,upsert:false});if(error)throw new Error('No se pudo subir la foto.');
 return client.storage.from('menu-images').getPublicUrl(path).data.publicUrl;
}
