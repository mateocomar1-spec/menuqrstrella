"""Importa el catálogo XLSX sin dependencias. Uso: python3 scripts/import_excel.py archivo.xlsx"""
import sys, zipfile, xml.etree.ElementTree as ET, json
from pathlib import Path
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(sys.argv[1]) as z:
 strings=[''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
 def rows(num):
  result=[]
  for row in ET.fromstring(z.read(f'xl/worksheets/sheet{num}.xml')).findall('m:sheetData/m:row',ns):
   cells={}
   for c in row.findall('m:c',ns):
    col=''.join(x for x in c.attrib['r'] if x.isalpha()); v=c.find('m:v',ns)
    value=v.text if v is not None else ''.join(c.find('m:is',ns).itertext()) if c.find('m:is',ns) is not None else ''
    if c.attrib.get('t')=='s':value=strings[int(value)]
    cells[col]=value
   if any(cells.values()):result.append(cells)
  return result
 def table(num,key):
  rr=rows(num); idx=next(i for i,r in enumerate(rr) if key in r.values()); headers=rr[idx]
  return [{v:r.get(k,'').strip() for k,v in headers.items() if v} for r in rr[idx+1:] if r.get('A')]
 config={r['clave']:r['valor'] for r in table(1,'clave')}
 cats=table(2,'id_categoria'); products=table(3,'id_producto')
 def money(v):return float(v) if v else None
 def flag(v):return str(v).strip().upper() in ('TRUE','1','SI','SÍ')
 output={'settings':{'name':config.get('nombre_negocio','LA PICCOLINA'),'whatsapp':str(int(float(config.get('whatsapp','0')))),'open':flag(config.get('estado_abierto','TRUE')),'delivery':config.get('estado_delivery',config.get('delivery','TRUE')).upper() not in ('FALSE','NO','0'),'deliveryFee':6500,'notice':'','logo':'','active':config.get('estado_servicio','SI').upper()!='NO'},'categories':[{'id':r['id_categoria'],'name':r['nombre'],'order':money(r.get('orden','')) or 0} for r in cats],'products':[]}
 for r in products:
  name=r['nombre']; lower=name.lower(); bundle=18 if 'docena' in lower and 'y media' in lower else 6 if 'media docena' in lower else 12 if 'docena' in lower else 0
  output['products'].append({'id':r['id_producto'],'category':r['id_categoria'],'name':name,'description':r.get('descripcion',''),'price':money(r.get('precio','')),'small':money(r.get('precio_chica','')),'large':money(r.get('precio_grande','')),'image':r.get('imagen_url',''),'available':flag(r.get('disponible','TRUE')),'featured':flag(r.get('destacado','FALSE')),'bundle':bundle})
 # La planilla contiene una pizza mitad y mitad sin categoría ni precios.
 # Conservarla como borrador en Pizzas; no inventar un importe.
 for p in output['products']:
  if p['category']=='pizza_mitad_y_mitad' and p['price'] is None and p['small'] is None and p['large'] is None:
   p['category']='pizzas'; p['available']=False
 Path('public/menu.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
 print(f"Importados {len(output['categories'])} categorías y {len(output['products'])} productos")
