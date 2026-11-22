// AL FAHD - Firestore-backed sitemap generator for GitHub Actions
import { readdir, unlink, writeFile } from "node:fs/promises";
const projectId = "al-fahd-real-estate";
const apiKey = process.env.FIREBASE_API_KEY || "AIzaSyBzyKd-sFJzeZMQsxaJaeuA_tQxNOMRtAs";
const site = "https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/properties`;
const excluded = /قيد المراجعة|معلق|مرفوض|مسودة|مسوده|قيد|مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز|تم حجز/i;
function value(f){if(!f)return "";if("stringValue"in f)return f.stringValue;if("timestampValue"in f)return f.timestampValue;if("integerValue"in f)return f.integerValue;if("doubleValue"in f)return f.doubleValue;if("booleanValue"in f)return f.booleanValue;return "";}
function xml(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");}
function dateOnly(v){const d=v?new Date(v):new Date();return Number.isNaN(d.getTime())?new Date().toISOString().slice(0,10):d.toISOString().slice(0,10);}
function available(f){const s=String(value(f.status)||"متاح"),a=value(f.approved);return !excluded.test(s)&&a!==false&&a!==0&&a!=="pending"&&a!=="قيد المراجعة"&&a!=="مرفوض";}
function entry(loc,lastmod,freq,priority){return `  <url><loc>${xml(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;}
function urlset(items){return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</urlset>\n`;}
function indexXml(names,today){return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${names.map(n=>`  <sitemap><loc>${site}${n}</loc><lastmod>${today}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`;}
const all=[];let token="";
do{const u=new URL(base);u.searchParams.set("pageSize","1000");u.searchParams.set("key",apiKey);if(token)u.searchParams.set("pageToken",token);const res=await fetch(u);if(!res.ok)throw new Error(`Firestore list failed ${res.status}: ${(await res.text()).slice(0,700)}. Verify public Firestore read rules/API key.`);const data=await res.json();for(const doc of data.documents||[]){const id=doc.name.split("/").pop(),f=doc.fields||{};if(available(f))all.push({id,lastmod:dateOnly(value(f.updatedAt)||value(f.createdAt))});}token=data.nextPageToken||"";}while(token);
all.sort((a,b)=>b.lastmod.localeCompare(a.lastmod));const today=new Date().toISOString().slice(0,10),files=new Map(),chunks=[];for(let i=0;i<all.length;i+=1000)chunks.push(all.slice(i,i+1000));
if(chunks.length<=45){files.set("sitemap.xml",urlset([entry(site,today,"daily","1.0"),entry(site+"property.html",today,"weekly","0.7"),...all.map(p=>entry(site+"property.html?id="+encodeURIComponent(p.id),p.lastmod,"weekly","0.8"))]));files.set("sitemap-index.xml",indexXml(["sitemap.xml"],today));}
else{const names=[];chunks.forEach((chunk,i)=>{const n=`sitemap-properties-${i+1}.xml`;names.push(n);const items=chunk.map(p=>entry(site+"property.html?id="+encodeURIComponent(p.id),p.lastmod,"weekly","0.8"));if(i===0)items.unshift(entry(site,today,"daily","1.0"),entry(site+"property.html",today,"weekly","0.7"));files.set(n,urlset(items));});const ix=indexXml(names,today);files.set("sitemap.xml",ix);files.set("sitemap-index.xml",ix);}
for(const [n,c] of files)await writeFile(n,c,"utf8");
for(const n of await readdir("."))if(/^sitemap-properties-\\d+\\.xml$/.test(n)&&!files.has(n))await unlink(n);
console.log(`Generated ${all.length} available property URLs; files: ${[...files.keys()].join(", ")}`);
