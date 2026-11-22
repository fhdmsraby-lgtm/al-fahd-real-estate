/* AL FAHD - Sitemap Generator v2 - Pagination + Sitemap Index - للوحة الإدارة فقط
   الاستخدام في admin.html بعد الدخول: fahdGenerateSitemaps() في Console
   بيرجع { index, files: {sitemap.xml, sitemap-properties-1.xml, ...}, count }
   - Pagination: 500 في كل صفحة - startAfter - من غير تكرار - من غير فقدان - مهما زاد العدد
   - يستبعد المباع / المؤجر / المحجوز / المسودات / قيد المراجعة
   - لو العقارات <= 900: ملف sitemap.xml واحد
   - لو أكتر: Sitemap Index + ملفات sitemap-properties-1.xml, -2.xml ... كل ملف 1000 رابط (أمان أقل من حد Google 50000)
   - كل رابط = SITE + property.html?id=ID - الرابط الرسمي الموحد
   - انسخ الناتج والصقه في GitHub - ملفات sitemap.xml / sitemap-index.xml / sitemap-properties-N.xml
*/
async function fahdGenerateSitemaps(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  function isAvail(p){ var s=String((p&&p.status)||"متاح"); if(/قيد المراجعة|معلق|مرفوض|مسودة|مسوده|قيد|مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز|تم حجز/i.test(s)) return false; return true; }
  function escXml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  var all=[], seen={};
  var lastDoc=null, guard=0;
  while(guard<50){
    guard++;
    var q=db.collection("properties").orderBy("__name__").limit(500);
    if(lastDoc) q=q.startAfter(lastDoc);
    var snap=null;
    try{ snap=await q.get(); }catch(e){ try{ var q2=db.collection("properties").limit(500); if(lastDoc) q2=q2.startAfter(lastDoc); snap=await q2.get(); }catch(e2){ break; } }
    if(!snap||snap.empty) break;
    snap.forEach(function(d){ if(!seen[d.id]){ seen[d.id]=1; var v=d.data(); v._id=d.id; all.push(v); } });
    if(snap.size<500) break;
    lastDoc=snap.docs[snap.docs.length-1];
  }
  var avail=all.filter(isAvail);
  // رتب: الأحدث أولا
  avail.sort(function(a,b){ return String(b.createdAt||"").localeCompare(String(a.createdAt||"")); });
  var CHUNK=1000;
  var files={};
  var today=new Date().toISOString().slice(0,10);
  function urlEntry(loc, lastmod, freq, pri){ return "  <url><loc>"+escXml(loc)+"</loc>"+(lastmod?"<lastmod>"+lastmod+"</lastmod>":"")+"<changefreq>"+freq+"</changefreq><priority>"+pri+"</priority></url>"; }
  function wrap(urls){ return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join("\n")+"\n</urlset>"; }
  if(avail.length<=900){
    var urls=[urlEntry(SITE, today, "daily", "1.0"), urlEntry(SITE+"property.html", today, "weekly", "0.7")];
    avail.forEach(function(p){ urls.push(urlEntry(SITE+"property.html?id="+encodeURIComponent(p._id), (String(p.createdAt||"").slice(0,10)||today), "weekly", "0.8")); });
    files["sitemap.xml"]=wrap(urls);
    files["sitemap-index.xml"]='<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>'+SITE+'sitemap.xml</loc><lastmod>'+today+'</lastmod></sitemap>\n</sitemapindex>';
  } else {
    var chunks=[];
    for(var i=0;i<avail.length;i+=CHUNK) chunks.push(avail.slice(i,i+CHUNK));
    var indexEntries=[];
    chunks.forEach(function(chunk, idx){
      var name="sitemap-properties-"+(idx+1)+".xml";
      var urls=[];
      if(idx===0){ urls.push(urlEntry(SITE, today, "daily", "1.0")); urls.push(urlEntry(SITE+"property.html", today, "weekly", "0.7")); }
      chunk.forEach(function(p){ urls.push(urlEntry(SITE+"property.html?id="+encodeURIComponent(p._id), (String(p.createdAt||"").slice(0,10)||today), "weekly", "0.8")); });
      files[name]=wrap(urls);
      indexEntries.push("  <sitemap><loc>"+SITE+name+"</loc><lastmod>"+today+"</lastmod></sitemap>");
    });
    files["sitemap-index.xml"]='<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+indexEntries.join("\n")+"\n</sitemapindex>";
    // sitemap.xml الرئيسي يبقى متوافق: يشاور للـ Index - Search Console بيقرأه
    files["sitemap.xml"]=files["sitemap-index.xml"];
  }
  console.log("AL FAHD Sitemap v2 - total:", all.length, "available:", avail.length, "files:", Object.keys(files));
  console.log("انسخ كل ملف والصقه في GitHub بنفس الاسم.");
  return { total: all.length, available: avail.length, files: files };
}
// اسم قديم - للتوافق - بيرجع sitemap.xml بس
async function fahdGenerateSitemap(){ var r=await fahdGenerateSitemaps(); return r.files["sitemap.xml"]; }
async function fahdGeneratePropertyLinks(){
  var r=await fahdGenerateSitemaps();
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  console.log("روابط العقارات المتاحة:", r.available);
  return r;
}
