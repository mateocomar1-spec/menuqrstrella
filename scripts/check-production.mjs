import {loadEnv} from 'vite';
const env={...loadEnv('production',process.cwd(),''),...process.env};
const url=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_ANON_KEY;
function stop(message){console.error(`No se generó la versión de producción: ${message}`);process.exit(1);}
if(!url||!key)stop('faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Configuralas en Netlify.');
try{if(new URL(url).protocol!=='https:')stop('la URL de Supabase debe usar HTTPS.');}catch{stop('la URL de Supabase no es válida.');}
if(key.startsWith('sb_secret_'))stop('la clave es privada. Usá la publishable key pública.');
if(!key.startsWith('sb_publishable_')){
 try{if(JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role!=='anon')stop('se necesita una clave pública anon.');}
 catch{stop('la clave pública no tiene un formato reconocido.');}
}
console.log('Configuración pública de producción presente. Esto no verifica permisos ni conectividad.');
