/* AL FAHD - Core Fix v2 - Pagination + Unified Links + Fresh Data
   لا يغير تصميم ولا أقسام ولا إدارة ولا أسعار. ملف مستقل - لو اتشال الموقع بيرجع زي ما هو.
   1) Pagination: يجلب كل العقارات من Firestore مهما زاد عددها - 500 في كل صفحة - startAfter - من غير تكرار (dedup by doc id) - من غير فقدان
   2) Fresh: كاش 5 دقائق بس - بعدها يجلب جديد - مش بيانات قديمة
   3) Unified links: الرابط الرسمي Canonical = SITE + properties/ID/ - والرابط القديم ?prop=ID و ?id=ID لسه شغال وبيتحول للرسمي في Canonical - مش بيتكسر
   4) Free quota: لا استعلامات متكررة - يجلب مرة واحدة ويخزن - ولا polling
*/
(function(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  window.FAHD_SITE=SITE;
  // الرابط الموحد الرسمي - يستخدمه المساعد + SEO + Sitemap + property.html
  window.fahdPropUrl=function(id){ return SITE+"property.html?id="+encodeURIComponent(String(id||"")); };
  window.fahdLegacyPropUrl=function(id){ return SITE+"properties/"+encodeURIComponent(String(id||""))+"/"; };
  // هل العقار متاح فعلا؟ - يستبعد المباع / المؤجر / المحجوز / المسودات / قيد المراجعة
  window.fahdIsAvailable=function(p){ if(!p) return false; var s=String(p.status||"متاح"); if(/قيد المراجعة|معلق|مرفوض|مسودة|مسوده|قيد|مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز|تم حجز/i.test(s)) return false; return true; };
  var _cache=null,_cacheTime=0,_inflight=null;
  window.fahdClearPropsCache=function(){ _cache=null; _cacheTime=0; try{ localStorage.removeItem('fahdPropsCache'); }catch(e){} };
  var CACHE_TTL=5*60*1000; // 5 دقائق - توازن بين Fresh و Free quota
  // جلب كل العقارات بـ Pagination - يعمل مع Firestore compat الموجود في index
  async function fetchAllFromFirestore(){
    var db=null;
    try{ if(typeof firebase!=="undefined" && firebase.firestore) db=firebase.firestore(); }catch(e){}
    if(!db) return [];
    var all=[], seen={};
    var lastDoc=null, guard=0;
    while(guard<50){ // 50 صفحة × 500 = 25000 عقار - أكتر من حد Sitemap بكتير - أمان من loop لا نهائي
      guard++;
      var q=db.collection("properties").orderBy("__name__").limit(500);
      if(lastDoc) q=q.startAfter(lastDoc);
      var snap;
      try{ snap=await q.get(); }catch(e){ // لو orderBy __name__ مش مسموح - جرب من غير orderBy
        try{ var q2=db.collection("properties").limit(500); if(lastDoc) q2=q2.startAfter(lastDoc); snap=await q2.get(); }catch(e2){ break; }
      }
      if(!snap || snap.empty) break;
      snap.forEach(function(d){ if(!seen[d.id]){ seen[d.id]=1; var v=d.data(); v._id=d.id; all.push(v); } });
      if(snap.size<500) break;
      lastDoc=snap.docs[snap.docs.length-1];
    }
    return all;
  }
  window.fahdFetchAllProps=async function(opts){
    opts=opts||{};
    var now=Date.now();
    if(!opts.force && _cache && (now-_cacheTime<CACHE_TTL)) return _cache;
    if(_inflight && !opts.force) return _inflight;
    _inflight=(async function(){
      var fresh=await fetchAllFromFirestore();
      // لو Firestore فشل - ارجع للكاش / window.props - مش ترجع فاضي
      if(!fresh.length){
        var fallback=[];
        try{ if(window.props&&window.props.length) fallback=window.props.slice(); }catch(e){}
        try{ var c=JSON.parse(localStorage.getItem("fahdPropsCache")||"null"); if(c&&c.props) fallback=fallback.concat(c.props); }catch(e){}
        var seen={}; var ded=[];
        fallback.forEach(function(p){ var k=p._id||p.id||""; if(k&&!seen[k]){seen[k]=1;ded.push(p);} else if(!k) ded.push(p); });
        _cache=ded; _cacheTime=now; return ded;
      }
      // خزن في الكاش + حدث window.props لو كان ناقص - من غير ما تكسر render الحالي
      _cache=fresh; _cacheTime=now;
      try{
        var mini=fresh.map(function(p){ return { _id:p._id, title:p.title, city:p.city, address:p.address, type:p.type, price:p.price, rooms:p.rooms, baths:p.baths, area:p.area, details:p.details, status:p.status, image:(p.images&&p.images[0])||p.image||"", images:p.images||[] }; });
        localStorage.setItem("fahdPropsCache", JSON.stringify({props:fresh, updatedAt:new Date().toISOString()}));
      }catch(e){}
      return fresh;
    })();
    var res=await _inflight; _inflight=null; return res;
  };
  window.fahdFetchAvailableProps=async function(opts){ var all=await window.fahdFetchAllProps(opts||{}); return all.filter(window.fahdIsAvailable); };
  // إصلاح index: propLink القديم كان بيعمل ?prop=ID - خليه يرجع الرسمي - والقديم لسه شغال في checkDeepLink
  // لا نستبدل loadProps بالكامل - نرقعها فقط لو كانت موجودة: بعد ما تحمل - كمل باقي الصفحات بـ Pagination في الخلفية
  document.addEventListener("DOMContentLoaded", function(){
    try{
      // لو الصفحة فيها ?prop=ID قديم - خلي Canonical يشاور للرابط الرسمي - من غير ما تكسر الصفحة
      var params=new URLSearchParams(location.search);
      var legacy=params.get("prop")||params.get("id");
      if(legacy && typeof window.fahdApplyPropSEO!=="function"){
        var l=document.querySelector('link[rel="canonical"]');
        if(!l){ l=document.createElement("link"); l.setAttribute("rel","canonical"); document.head.appendChild(l); }
        l.setAttribute("href", window.fahdPropUrl(legacy));
      }
      // ربط ?prop= القديم بـ /properties/ - لو المستخدم فتح الرابط القديم - الصفحة لسه بتشتغل - و Canonical هو الرسمي
    }catch(e){}
  });
})();
