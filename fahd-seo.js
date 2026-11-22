/* AL FAHD - SEO v2 - Per-property + Unified Canonical + OG + Schema.org
   لا يغير تصميم ولا وظائف. ملف مستقل - لو اتشال الموقع بيرجع زي ما هو.
   التوحيد: الرابط الرسمي Canonical = SITE + property.html?id=ID - لكل العقارات
   الرابط القديم ?prop=ID و ?id=ID لسه شغال - لكن Canonical يشاور للرسمي - عشان Google ما يعتبرهم صفحتين مكررتين
   لو العقار مباع / مؤجر / محجوز / قيد المراجعة: robots = noindex - مش يظهر كمتاح
*/
(function(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  function setMeta(sel,attr,val,content){
    var el=document.querySelector(sel);
    if(!el){ el=document.createElement("meta"); if(attr==="property") el.setAttribute("property",val); else el.setAttribute("name",val); document.head.appendChild(el); }
    el.setAttribute("content",content);
  }
  function setCanonical(href){
    var l=document.querySelector('link[rel="canonical"]');
    if(!l){ l=document.createElement("link"); l.setAttribute("rel","canonical"); document.head.appendChild(l); }
    l.setAttribute("href",href);
  }
  function setRobots(content){
    var el=document.querySelector('meta[name="robots"]');
    if(!el){ el=document.createElement("meta"); el.setAttribute("name","robots"); document.head.appendChild(el); }
    el.setAttribute("content",content);
  }
  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function num(v){ var n=parseFloat(String(v||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; }
  function isAvailable(p){ var s=String(p.status||"متاح"); if(/قيد المراجعة|معلق|مرفوض|مسودة|مسوده|قيد|مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز|تم حجز/i.test(s)) return false; return true; }
  function propUrl(id){ if(typeof window.fahdPropUrl==="function") return window.fahdPropUrl(id); return SITE+"property.html?id="+encodeURIComponent(id); }
  // Homepage SEO - افتراضي
  setMeta('meta[name="description"]',"name","description","مكتب الفهد للعقارات - شقق وفيلات للبيع والإيجار في التجمع الأول والخامس، الرحاب، مدينتي، الشروق، مصر الجديدة، المعادي، 6 أكتوبر - مباشر مع المالك.");
  setMeta('meta[property="og:title"]',"property","og:title","مكتب الفهد للعقارات | AL FAHD REAL ESTATE");
  setMeta('meta[property="og:description"]',"property","og:description","شقق وفيلات للبيع والإيجار في القاهرة - مباشر مع المالك - واتساب 01040872120");
  setMeta('meta[property="og:type"]',"property","og:type","website");
  setMeta('meta[property="og:url"]',"property","og:url",SITE);
  setMeta('meta[property="og:image"]',"property","og:image",SITE+"logo.jpeg");
  setMeta('meta[name="twitter:card"]',"name","twitter:card","summary_large_image");
  // لو مفيش ?prop= - Canonical = الرئيسية
  var _params=new URLSearchParams(location.search);
  if(!_params.get("prop") && !_params.get("id")){ setCanonical(SITE); setRobots("index, follow"); }
  if(!document.getElementById("fahd-org-schema")){
    var sc=document.createElement("script"); sc.id="fahd-org-schema"; sc.type="application/ld+json";
    sc.textContent=JSON.stringify({"@context":"https://schema.org","@type":"RealEstateAgent","name":"مكتب الفهد للعقارات - AL FAHD REAL ESTATE","url":SITE,"telephone":"+201040872120","areaServed":"القاهرة، مصر","priceRange":"EGP","sameAs":["https://www.instagram.com/alfahad.estate.eg_"]});
    document.head.appendChild(sc);
  }
  // Per-property SEO - ?prop=ID أو ?id=ID - ينتظر window.props لو لسه بيحمل
  function applyPropSEO(){
    try{
      var id=new URLSearchParams(location.search).get("prop")||new URLSearchParams(location.search).get("id");
      if(!id) return;
      var list=window.props||[];
      var p=list.find(function(x){return x._id===id;});
      if(!p){
        // حاول مرة تانية بعد تحميل العقارات - من غير ما تكسر الصفحة
        setTimeout(applyPropSEO, 800);
        return;
      }
      var avail=isAvailable(p);
      var title=(p.title||"عقار")+" - "+(p.city||"القاهرة")+" | مكتب الفهد للعقارات";
      document.title=title;
      var desc="عقار - "+(p.title||"")+" في "+(p.city||"")+" - "+(p.price||"")+" جنيه - "+(p.area||"")+" م² - "+(p.rooms||"-")+" غرف - "+(p.baths||"-")+" حمام. تواصل واتساب 01040872120 - مكتب الفهد.";
      setMeta('meta[name="description"]',"name","description",desc);
      setMeta('meta[property="og:title"]',"property","og:title",title);
      setMeta('meta[property="og:description"]',"property","og:description",desc);
      setMeta('meta[property="og:type"]',"property","og:type","article");
      var img=(p.images&&p.images[0])||p.image||"logo.jpeg";
      setMeta('meta[property="og:image"]',"property","og:image",img);
      var canon=propUrl(id);
      setCanonical(canon);
      setMeta('meta[property="og:url"]',"property","og:url",canon);
      setMeta('meta[name="twitter:card"]',"name","twitter:card","summary_large_image");
      // لو غير متاح - noindex - مش يظهر كمتاح في Google
      setRobots(avail ? "index, follow" : "noindex, follow");
      var old=document.getElementById("fahd-prop-schema"); if(old) old.remove();
      var sc2=document.createElement("script"); sc2.id="fahd-prop-schema"; sc2.type="application/ld+json";
      var offers={"@type":"Offer","price":num(p.price),"priceCurrency":"EGP","availability": avail ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"};
      var obj={"@context":"https://schema.org","@type":"RealEstateListing","name":p.title||"","description":p.details||p.title||"","url":canon,"image": (p.images&&p.images.length?p.images:[img]),"offers":offers,"address":{"@type":"PostalAddress","addressLocality":p.city||"القاهرة","streetAddress":p.address||"","addressCountry":"EG"},"numberOfRooms":num(p.rooms),"numberOfBathroomsTotal":num(p.baths),"floorSize":{"@type":"QuantitativeValue","value":num(p.area),"unitCode":"MTK"}};
      sc2.textContent=JSON.stringify(obj);
      document.head.appendChild(sc2);
    }catch(e){}
  }
  window.fahdApplyPropSEO=applyPropSEO;
  document.addEventListener("DOMContentLoaded", applyPropSEO);
  // لو window.props اتحدث بعد التحميل - طبق تاني
  setTimeout(applyPropSEO, 1500);
})();
