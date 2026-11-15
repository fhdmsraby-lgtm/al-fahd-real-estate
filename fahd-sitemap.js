/* AL FAHD - Sitemap Generator - يستخدم في لوحة الإدارة فقط - لا يظهر للزوار
   الاستخدام: في admin.html - بعد تسجيل الدخول - افتح Console أو زر مخصص
   fahdGenerateSitemap() -> بيرجع نص sitemap.xml فيه العقارات المتاحة فقط
   و fahdGeneratePropertyLinks() -> قائمة روابط /properties/ID/
*/
async function fahdGenerateSitemap(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  var snap=await db.collection("properties").limit(200).get();
  var urls=['<url><loc>'+SITE+'</loc><changefreq>daily</changefreq><priority>1.0</priority></url>'];
  snap.forEach(function(d){
    var p=d.data(); var s=String(p.status||"متاح");
    if(/قيد المراجعة|معلق|مرفوض|مسودة|مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز/i.test(s)) return; // غير متاح - لا يضاف
    var last=(p.createdAt||"").slice(0,10);
    urls.push('<url><loc>'+SITE+'properties/'+d.id+'/</loc>'+(last?'<lastmod>'+last+'</lastmod>':'')+'<changefreq>weekly</changefreq><priority>0.8</priority></url>');
  });
  var xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join("\n")+'\n</urlset>';
  console.log(xml);
  // انسخ الناتج من Console والصقه في ملف sitemap.xml في GitHub
  return xml;
}
async function fahdGeneratePropertyLinks(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  var snap=await db.collection("properties").limit(200).get();
  var out=[];
  snap.forEach(function(d){ var p=d.data(); var s=String(p.status||"متاح"); if(/قيد المراجعة|مباع|مؤجر|غير متاح|متوقف/i.test(s)) return; out.push(SITE+"properties/"+d.id+"/  |  "+(p.title||"")+" - "+(p.city||"")); });
  console.log(out.join("\n")); return out;
}
