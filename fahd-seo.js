/* AL FAHD - SEO Add-on - Modular - v1 - Phase 1
   لا يغير تصميم index ولا وظائفه. فقط يضيف Meta + Canonical + Schema.org
   ويحول رابط ?prop=ID الي رابط صفحة مستقلة /properties/ID/ للعرض والمشاركة
   لو اتشال الملف ده، الموقع بيرجع v2039 زي ما هو.
*/
(function(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  var WA="201040872120";
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
  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function num(v){ var n=parseFloat(String(v||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; }
  function isAvailable(p){
    var s=String(p.status||"متاح");
    if(/قيد المراجعة|معلق|مرفوض|مسودة/i.test(s)) return false;
    if(/مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز/i.test(s)) return false;
    return true;
  }
  // --- Homepage SEO (default) ---
  setMeta('meta[name="description"]',"name","description","مكتب الفهد للعقارات - شقق وفيلات للبيع والإيجار في التجمع الأول والخامس، الرحاب، مدينتي، الشروق، مصر الجديدة، المعادي، 6 أكتوبر - مباشر مع المالك.");
  setMeta('meta[property="og:title"]',"property","og:title","مكتب الفهد للعقارات | AL FAHD REAL ESTATE");
  setMeta('meta[property="og:description"]',"property","og:description","شقق وفيلات للبيع والإيجار في القاهرة - مباشر مع المالك - واتساب 01040872120");
  setMeta('meta[property="og:type"]',"property","og:type","website");
  setCanonical(SITE);
  // Schema.org - RealEstateAgent
  if(!document.getElementById("fahd-org-schema")){
    var sc=document.createElement("script"); sc.id="fahd-org-schema"; sc.type="application/ld+json";
    sc.textContent=JSON.stringify({"@context":"https://schema.org","@type":"RealEstateAgent","name":"مكتب الفهد للعقارات - AL FAHD REAL ESTATE","url":SITE,"telephone":"+201040872120","areaServed":"القاهرة، مصر","priceRange":"EGP","sameAs":["https://www.instagram.com/alfahad.estate.eg_"]});
    document.head.appendChild(sc);
  }
  // --- Per-property SEO when ?prop=ID ---
  function applyPropSEO(){
    try{
      var id=new URLSearchParams(location.search).get("prop");
      if(!id) return;
      var list=window.props||[];
      var p=list.find(function(x){return x._id===id;});
      if(!p) return;
      var title=(p.title||"عقار")+" - "+(p.city||"القاهرة")+" | مكتب الفهد للعقارات";
      document.title=title;
      var desc="شقة للبيع / للإيجار - "+(p.title||"")+" في "+(p.city||"")+" - "+(p.price||"")+" جنيه - "+(p.area||"")+" م² - "+(p.rooms||"-")+" غرف - "+(p.baths||"-")+" حمام. تواصل واتساب 01040872120 - مكتب الفهد.";
      setMeta('meta[name="description"]',"name","description",desc);
      setMeta('meta[property="og:title"]',"property","og:title",title);
      setMeta('meta[property="og:description"]',"property","og:description",desc);
      var img=(p.images&&p.images[0])||p.image||"logo.jpeg";
      setMeta('meta[property="og:image"]',"property","og:image",img);
      var canon=SITE+"properties/"+encodeURIComponent(id)+"/";
      setCanonical(canon);
      // Schema.org - RealEstateListing + Apartment/House
      var old=document.getElementById("fahd-prop-schema"); if(old) old.remove();
      var sc2=document.createElement("script"); sc2.id="fahd-prop-schema"; sc2.type="application/ld+json";
      var offers={"@type":"Offer","price":num(p.price),"priceCurrency":"EGP","availability": isAvailable(p) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"};
      var obj={"@context":"https://schema.org","@type":"RealEstateListing","name":p.title||"","description":p.details||p.title||"","url":canon,"image": (p.images&&p.images.length?p.images:[img]),"offers":offers,"address":{"@type":"PostalAddress","addressLocality":p.city||"القاهرة","streetAddress":p.address||"","addressCountry":"EG"},"numberOfRooms":num(p.rooms),"numberOfBathroomsTotal":num(p.baths),"floorSize":{"@type":"QuantitativeValue","value":num(p.area),"unitCode":"MTK"}};
      sc2.textContent=JSON.stringify(obj);
      document.head.appendChild(sc2);
      // زر رابط الصفحة المستقلة - يظهر في صفحة العقار المختار فقط - بدون تغيير الكارد الأصلي
      // لا نضيف أزرار إدارية هنا
    }catch(e){ console.warn("fahd-seo",e); }
  }
  // حاول بعد تحميل العقارات - loadProps موجود في index
  var tries=0; var t=setInterval(function(){ tries++; applyPropSEO(); if(tries>30) clearInterval(t); },1000);
  // رابط الصفحة المستقلة - دالة مساعدة للمساعد العقاري والمشاركة
  window.fahdPropPageUrl=function(id){ return SITE+"properties/"+encodeURIComponent(id)+"/"; };
  window.fahdIsAvailable=isAvailable;
  window.fahdNum=num;
})();
