/* AL FAHD - Assistant v5 - Pagination + Fresh + Unified Links + Auto-scroll - موظف مبيعات محترف - COMPACT
   آلية موحدة لجلب العقارات: window.props + Cache + Firestore مباشرة - يقرأ كل المتاح - مش عينة
   يدرس 13 نقطة: سعر - منطقة/مرحلة/مجموعة - مساحة - غرف - حمامات - تشطيب - دور - أسانسير - حديقة - روف/بنتهاوس - بيزمنت - مفروش - جاهزية
   بحث بالميزانية: من 3 لـ 4 مليون - لو أقرب 4.2 يعرضها ويوضح الفرق - ممنوع اختراع سعر
   بياع: عيشة غنية = فاخر + مساحة كبيرة + موقع مميز + حديقة + بنتهاوس + فيلات
   عرض: 3-5 في الأول - اعرض المزيد عند الطلب - صورة أصلية - سعر حقيقي - رابط صحيح
   حوار: سؤال واحد مهم بس لو ناقص - مش يكرر - بعد العرض: تحب نرتب معاينة؟
   ممنوع يقول لم أجد ويسكت - يوسع السعر - مناطق قريبة - يعرض الأقرب - يوضح الفرق - يحول واتساب
   أمان: Read Only - لا يضيف/يحذف/يعدل - لا يعرض المباع/قيد المراجعة - لا يعرض بيانات ملاك
   COMPACT: صغير - لا يبطئ الموقع - لا يغير تصميم الموقع
*/
(function(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  var WA_BASE="https://wa.me/201040872120?text=";
  var WA_NUM="01040872120";
  var FB_CONFIG={apiKey:"AIzaSyBzyKd-sFJzeZMQsxaJaeuA_tQxNOMRtAs",authDomain:"al-fahd-real-estate.firebaseapp.com",projectId:"al-fahd-real-estate",storageBucket:"al-fahd-real-estate.firebasestorage.app",messagingSenderId:"513435020066",appId:"1:513435020066:web:58453287f89585ce84937b",measurementId:"G-6VHP88T03V"};
  var cacheProps=null, cacheTime=0, lastResults=[], lastCriteria=null, shownCount=0, convo={budget:null,area:null,rooms:null,deal:null};
  function num(v){ var n=parseFloat(String(v||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; }
  function fmtPrice(n){ if(!n) return ""; if(n>=1000000){ var m=n/1000000; return (m%1===0?String(m):m.toFixed(2).replace(/\.0$/,""))+" مليون جنيه"; } return n.toLocaleString("en-US")+" جنيه"; }
  function isAvailable(p){ var s=String(p.status||"متاح"); if(/قيد المراجعة|معلق|مرفوض|مسودة|مسوده|قيد|مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز|تم حجز/i.test(s)) return false; return true; }
  function clean(s){ return String(s||"").toLowerCase(); }
  function hayOf(p){ return clean((p.title||"")+" "+(p.city||"")+" "+(p.address||"")+" "+(p.type||"")+" "+(p.details||"")+" "+(p.compound||"")+" "+(p.stage||"")+" "+(p.group||"")+" "+(p.finish||p.finishing||"")+" "+(p.floor||p.door||"")); }
  // --- آلية موحدة لجلب كل العقارات - Pagination + Fresh - تستخدم fahd-core-fix.js لو موجود ---
  async function getAllProps(force){
    // 1) لو fahd-core موجود - استخدمه: Pagination كامل + كاش 5 دقائق + dedup by doc id - مش limit(100/200)
    try{
      if(typeof window.fahdFetchAllProps==="function"){
        var all=await window.fahdFetchAllProps({force:!!force});
        var avail=all.filter(isAvailable);
        // حدث window.props لو كان ناقص
        try{ if(!window.props||window.props.length<all.length) window.props=all; }catch(e){}
        return avail;
      }
    }catch(e){}
    // 2) Fallback لو fahd-core مش متحمل: Pagination مباشرة هنا - نفس المنطق - من غير limit(100/200)
    if(cacheProps && !force && (Date.now()-cacheTime<5*60*1000)) return cacheProps;
    var map={};
    function add(list){ (list||[]).forEach(function(p){ if(!p) return; var id=p._id||p.id||""; var k=id||((p.title||"")+"|"+(p.price||"")+"|"+(p.address||"")); if(!seenCheck(k)){ map[k]=Object.assign({},p,{_id:id||k}); } }); }
    function seenCheck(k){ return !!map[k]; }
    try{ add(window.props||[]); }catch(e){}
    // لو window.props فيه بيانات - مش معناه انها كاملة - جرب Firestore بـ Pagination للتأكد من Fresh
    try{
      var db=null;
      if(typeof firebase!=="undefined"){ try{ if(!firebase.apps||!firebase.apps.length) firebase.initializeApp(FB_CONFIG); }catch(e){} try{ db=firebase.firestore(); }catch(e){} }
      if(db){
        var seenIds={}; Object.keys(map).forEach(function(k){ var pid=map[k]._id; if(pid) seenIds[pid]=1; });
        var lastDoc=null, guard=0;
        while(guard<50){
          guard++;
          var q=db.collection("properties").orderBy("__name__").limit(500);
          if(lastDoc) q=q.startAfter(lastDoc);
          var snap=null;
          try{ snap=await q.get(); }catch(e){ try{ var q2=db.collection("properties").limit(500); if(lastDoc) q2=q2.startAfter(lastDoc); snap=await q2.get(); }catch(e2){ break; } }
          if(!snap||snap.empty) break;
          snap.forEach(function(d){ if(!seenIds[d.id]){ seenIds[d.id]=1; var v=d.data(); v._id=d.id; map[d.id]=v; } });
          if(snap.size<500) break;
          lastDoc=snap.docs[snap.docs.length-1];
        }
      }
    }catch(e){}
    var list=Object.keys(map).map(function(k){return map[k];}).filter(isAvailable);
    cacheProps=list; cacheTime=Date.now();
    try{ if(!window.props||window.props.length<list.length) window.props=list; }catch(e){}
    return list;
  }
  // --- فهم الطلب - مصري + شامي + عامي ---
  function parse(q, prev){
    var t=clean(q);
    var out={area:"",deal:"",minPrice:0,maxPrice:0,rooms:0,baths:0,minArea:0,type:"",finish:"",floor:"",elevator:null,garden:null,roof:null,basement:null,furnished:null,ready:null,luxury:false,investment:false,cheapest:false,talkHuman:false,more:false,raw:t,anyWords:[]};
    if(prev){ if(prev.area) out.area=prev.area; if(prev.deal) out.deal=prev.deal; if(prev.rooms) out.rooms=prev.rooms; if(prev.maxPrice) {out.maxPrice=prev.maxPrice; out.minPrice=prev.minPrice;} }
    if(/اتكلم|أتكلم|موظف|حد من المكتب|بني ادم|بني آدم|انسان|حد حقيقي|كلموني|تواصل|واتساب|معاينة|احجز معاينة|ارتب معاينة/i.test(t)) out.talkHuman=true;
    if(/اعرض المزيد|المزيد|كمان|غيرهم|خيارات تانية|عرض المزيد|المزيد من/i.test(t)) out.more=true;
    if(/ارخص|أرخص|اقل سعر|أقل سعر|ارخص شقة|cheapest/i.test(t)) out.cheapest=true;
    if(/استثمار|استثماري|عائد|ايجارها|تأجيرها|investment/i.test(t)) out.investment=true;
    if(/عيشة غنية|غنية|فخم|فخامة|راقي|راقية|لوكس|vip|كلاس|قصر|كمبوند|مستوى راق|فاخرة|فاخر|عيشة/i.test(t)) out.luxury=true;
    // المنطقة والمرحلة والمجموعة
    var areas=["التجمع الخامس","التجمع الاول","التجمع الأول","التجمع الثالث","الرحاب","مدينتي","الشروق","مصر الجديدة","المعادي","6 أكتوبر","اكتوبر","التجمع","القاهرة الجديدة","زايد","الشيخ زايد","العبور","المقطم","مدينة نصر","القطامية"];
    for(var i=0;i<areas.length;i++){ if(t.indexOf(areas[i].toLowerCase())!==-1){ out.area=areas[i]; break; } }
    // مرحلة / مجموعة - أي كلمة بعد المرحلة / مجموعة / جروب
    var ms=t.match(/(?:مرحلة|مجموعة|جروب|كمبوند|compound)\s*([^\s,،]+(?:\s+[^\s,،]+)?)/); if(ms) out.area=out.area||ms[0];
    if(/ايجار|إيجار|اجار|للإيجار|كراء|rent|مفروشة للإيجار|للايجار/i.test(t)) out.deal="rent";
    else if(/بيع|للبيع|شراء|sale|اشتري|أشتري|اتملك|تمليك/i.test(t)) out.deal="sale";
    if(/مفروش|مفروشة|furnished/.test(t)) out.furnished=true;
    if(/غير مفروش|بدون فرش/.test(t)) out.furnished=false;
    if(/جاهز|جاهزة|جاهزة للسكن|استلام فوري|فوري|سكن على طول|على المفتاح/.test(t)) out.ready=true;
    if(/نصف تشطيب|نص تشطيب/.test(t)) out.finish="نصف تشطيب";
    else if(/تشطيب كامل|متشطب|تشطيب|سوبر لوكس|الترا/.test(t)) out.finish="تشطيب";
    // الدور
    var mf=t.match(/(?:الدور|دور)\s*([^\s,،]+)/); if(mf) out.floor=mf[1];
    if(/ارضي|أرضي|دور ارضي/.test(t)) out.floor="أرضي";
    if(/اخير|أخير|آخر/.test(t)) out.floor="أخير";
    if(/اسانسير|أسانسير|مصعد|elevator|lift/.test(t)) out.elevator=true;
    if(/حديقة|جاردن|garden|جاردن|حديقة خاصة/.test(t)) out.garden=true;
    if(/بنتهاوس|penthouse|روف|roof|سطح/.test(t)) out.roof=true;
    if(/بيزمنت|بدروم|basement|بيسمنت/.test(t)) out.basement=true;
    // الميزانية: من X لـ Y - رنج - حدود - حوالي - حتى - مليون
    var mr=t.match(/من\s*([\d.,]+)\s*(?:لـ|ل|الى|إلى|-|to)\s*([\d.,]+)\s*(مليون|مليار|الف|ألف|جنيه|ج)?/);
    if(mr){ var a=parseFloat(mr[1].replace(",",".")), b=parseFloat(mr[2].replace(",",".")); var mult=1; if(mr[3]&&mr[3].indexOf("مليون")!==-1) mult=1000000; else if(mr[3]&&(mr[3].indexOf("الف")!==-1||mr[3].indexOf("ألف")!==-1)) mult=1000; else if(a<1000&&b<1000) mult=1000000; a*=mult; b*=mult; out.minPrice=Math.min(a,b); out.maxPrice=Math.max(a,b); }
    else {
      var m=t.match(/(?:رنج|رينج|range|حدود|حوالي|تقريبا|تقريباً|بحد أقصى|حد اقصى|حتى|اقل من|أقل من|under|max|بـ|ب|في حدود|بحدود|سعر|ميزانية|بكام|بحدود|في رنج)\s*([\d.,]+)\s*(مليون|مليار|الف|ألف|k|جنيه|ج)?/);
      if(m){ var v=parseFloat(m[1].replace(",",".")); if(m[2]&&m[2].indexOf("مليون")!==-1) v*=1000000; else if(m[2]&&(m[2].indexOf("الف")!==-1||m[2].indexOf("ألف")!==-1)) v*=1000; else if(v>0&&v<1000) v*=1000000; out.maxPrice=v; out.minPrice=v*0.55; }
      else { var m2=t.match(/([\d.,]+)\s*مليون/); if(m2){ out.maxPrice=parseFloat(m2[1].replace(",","."))*1000000; out.minPrice=out.maxPrice*0.55; } }
    }
    var m3=t.match(/(\d+)\s*(غرف|غرفة|اوض|أوض|اوضة|غرفه)/); if(m3) out.rooms=parseInt(m3[1],10);
    if(/غرفتين|اوضتين/.test(t)&&!out.rooms) out.rooms=2;
    var m4=t.match(/(\d+)\s*(حمام|حمامات)/); if(m4) out.baths=parseInt(m4[1],10);
    var m5=t.match(/(\d+)\s*(متر|م²|م2)/); if(m5) out.minArea=parseInt(m5[1],10);
    if(/فيلا|فيلات|villa|قصر/.test(t)) out.type="villa";
    else if(/تاون|townhouse/.test(t)) out.type="town";
    else if(/دوبلكس|duplex/.test(t)) out.type="duplex";
    else if(/بنتهاوس|penthouse/.test(t)) out.type="penthouse";
    else if(/شقة|شقه|شقق|apartment|استوديو|ستوديو/.test(t)) out.type="apartment";
    else if(/شاليه/.test(t)) out.type="chalet";
    var stop=["عايز","بدي","اريد","أريد","شقة","شقه","فيلا","في","من","انا","أنا","لو","ممكن","عندكم","فيه","فيها","كده","كدا","ايه","اي","اللي","ده","دي","مليون","جنيه","غرف","غرفة","مفروشة","للايجار","للبيع","عيشة","غنية","فاخرة","فاخر","راقي"];
    out.anyWords=t.split(/\s+/).filter(function(w){ return w.length>2 && stop.indexOf(w)===-1 && !/^\d+$/.test(w); });
    return out;
  }
  // --- دراسة كل عقار - 13 نقطة - ترتيب حسب التطابق ---
  function rankAll(list, c){
    var scored=list.map(function(p){
      var score=10, reasons=[], diffs=[];
      var hay=hayOf(p); var price=num(p.price);
      if(c.area){ if(hay.indexOf(c.area.toLowerCase())!==-1){ score+=35; reasons.push("في "+c.area); } else { score+=2; diffs.push("في منطقة تانية: "+(p.city||"")); } }
      if(c.maxPrice && price){
        if(price>=c.minPrice && price<=c.maxPrice){ score+=35; reasons.push("السعر في ميزانيتك"); }
        else if(price<=c.maxPrice*1.15){ score+=28; diffs.push("أعلى من ميزانيتك بـ "+fmtPrice(price-c.maxPrice)+" بس"); }
        else if(price>=c.minPrice*0.7){ score+=22; diffs.push("أقل من ميزانيتك - فرصة"); }
        else if(price<c.minPrice){ score+=18; diffs.push("أرخص من ميزانيتك بكتير"); }
        else { score+=10; diffs.push("السعر "+fmtPrice(price)+" - بعيد شوية عن ميزانيتك"); }
      }
      if(c.rooms && num(p.rooms)){ if(num(p.rooms)===c.rooms){ score+=15; reasons.push(c.rooms+" غرف"); } else if(num(p.rooms)>c.rooms){ score+=10; reasons.push("أوسع - "+num(p.rooms)+" غرف"); } else { score+=4; diffs.push("عدد الغرف مختلف"); } }
      if(c.baths && num(p.baths)){ if(num(p.baths)>=c.baths) score+=8; else diffs.push("عدد الحمامات أقل"); }
      if(c.minArea && num(p.area)){ if(num(p.area)>=c.minArea){ score+=8; reasons.push("مساحة "+num(p.area)+" م²"); } else diffs.push("المساحة أصغر"); }
      if(c.finish){ if(hay.indexOf(c.finish.toLowerCase())!==-1){ score+=6; reasons.push(c.finish); } }
      if(c.floor){ if(hay.indexOf(String(c.floor).toLowerCase())!==-1) score+=6; }
      if(c.elevator===true){ if(/اسانسير|أسانسير|مصعد|elevator/i.test(hay)){ score+=8; reasons.push("فيه أسانسير"); } else diffs.push("مفيش أسانسير واضح"); }
      if(c.garden===true){ if(/حديقة|جاردن|garden/i.test(hay)){ score+=15; reasons.push("حديقة خاصة"); } else diffs.push("مفيش حديقة خاصة واضحة"); }
      if(c.roof===true){ if(/روف|بنتهاوس|penthouse|roof/i.test(hay)){ score+=20; reasons.push("روف / بنتهاوس"); } else diffs.push("مش روف / بنتهاوس"); }
      if(c.basement===true){ if(/بيزمنت|بدروم|basement/i.test(hay)){ score+=20; reasons.push("فيه بيزمنت"); } else diffs.push("مفيش بيزمنت"); }
      if(c.furnished===true){ if(/مفروش/i.test(hay)){ score+=12; reasons.push("مفروشة جاهزة"); } else diffs.push("مش مفروشة"); }
      if(c.furnished===false){ if(!/مفروش/i.test(hay)) score+=6; }
      if(c.ready===true){ if(/جاهز|فوري|استلام فوري|جاهزة/i.test(hay)){ score+=8; reasons.push("جاهزة للسكن"); } }
      if(c.deal){ var dealField=String(p.deal||p.purpose||p.offerType||"").toLowerCase(); var isRent=(dealField.indexOf("rent")!==-1||dealField.indexOf("ايجار")!==-1||dealField.indexOf("إيجار")!==-1)||(/ايجار|إيجار|مفروش|rent/i.test(String(p.type||"")+" "+String(p.details||""))&&dealField.indexOf("sale")===-1&&dealField.indexOf("بيع")===-1); if((c.deal==="rent")===isRent){ score+=12; reasons.push(c.deal==="rent"?"للإيجار":"للبيع"); } else diffs.push(c.deal==="rent"?"ده للبيع":"ده للإيجار"); }
      if(c.type==="villa" && /فيلا|villa/i.test(hay)){ score+=12; reasons.push("فيلا"); }
      if(c.type==="penthouse" && /بنتهاوس|penthouse/i.test(hay)){ score+=12; reasons.push("بنتهاوس"); }
      if(c.luxury){
        var lux=0; if(/لوكس|فيلا|كمبوند|تشطيب|حديقة|روف|بنتهاوس/i.test(hay)) lux+=15; if(price>8000000) lux+=15; if(num(p.area)>220) lux+=10;
        score+=lux; if(lux>0) reasons.push("مستوى راقي - عيشة غنية");
      }
      if(c.investment){ if(/استثمار|عائد|ايجار|مفروش|استثماري/i.test(hay)) score+=10; if(price>0&&price<6000000) score+=8; reasons.push("مناسبة للاستثمار"); }
      if(c.cheapest){ score+= (price>0? (10000000-price)/1000000 : 0); }
      c.anyWords.forEach(function(w){ if(w.length>2 && hay.indexOf(w)!==-1) score+=6; });
      if(p.featuredUntil||p.isFeatured) score+=4;
      return {p:p,score:score,reasons:reasons,diffs:diffs};
    });
    scored.sort(function(a,b){return b.score-a.score;});
    if(c.cheapest) scored.sort(function(a,b){return num(a.p.price)-num(b.p.price);});
    if(c.luxury){ var top=scored.slice(0,8); top.sort(function(a,b){return num(b.p.price)-num(a.p.price);}); scored=top.concat(scored.slice(8)); }
    return scored;
  }
  function salesPitch(r,c){
    var p=r.p; var lines=[];
    if(r.reasons.length) lines.push("✅ ليه رشحتها ليك: "+r.reasons.join(" • "));
    if(c.luxury) lines.push("🏛️ عيشة غنية بجد - تشطيب راقي، موقع مميز، مساحة تفتح النفس.");
    else if(c.investment) lines.push("📈 فرصة استثمارية - موقع مطلوب، وسعرها قابل للزيادة، وسهلة التأجير.");
    else if(c.maxPrice) lines.push("💰 سعرها في حدود ميزانيتك - وموقعها ممتاز للسكن والاستثمار.");
    else lines.push("🏠 من أحسن الشقق المتاحة عندنا دلوقتي - موقع وسعر ومساحة متوازنين.");
    return lines.join("<br>");
  }
  function ensureUI(){
    if(document.getElementById("fahd-ai-btn")) return;
    var btn=document.createElement("button"); btn.id="fahd-ai-btn"; btn.textContent="💬 مساعد الفهد العقاري";
    btn.onclick=function(){ var b=document.getElementById("fahd-ai-box"); b.style.display=(b.style.display==="block"?"none":"block"); if(b.style.display==="block") setTimeout(scrollToBottom,100); };
    var box=document.createElement("div"); box.id="fahd-ai-box";
    box.innerHTML='<div id="fahd-ai-head"><span>🏠 مساعد الفهد — موظف مبيعات المكتب</span><button onclick="document.getElementById(\'fahd-ai-box\').style.display=\'none\'" style="background:none;border:none;color:#D4AF37;font-size:18px;cursor:pointer">✕</button></div>'
      +'<div id="fahd-ai-msgs"></div>'
      +'<div style="padding:0 12px 6px"><span class="fahd-ai-chip" data-q="أريد شقة بميزانية 3 إلى 4 ملايين">شقة 3 لـ 4 مليون</span> <span class="fahd-ai-chip" data-q="أريد شقة 3 غرف في الرحاب">3 غرف - الرحاب</span> <span class="fahd-ai-chip" data-q="أريد شقة فاخرة بمستوى راق">فاخرة - عيشة غنية</span> <span class="fahd-ai-chip" data-q="أريد شقة بحديقة خاصة">حديقة خاصة</span></div>'
      +'<div id="fahd-ai-input-row"><input id="fahd-ai-input" placeholder="اكتب طلبك... مثال: شقة 3 غرف في الرحاب"><button id="fahd-ai-send">إرسال</button></div>';
    document.body.appendChild(btn); document.body.appendChild(box);
    document.getElementById("fahd-ai-send").onclick=send;
    document.getElementById("fahd-ai-input").addEventListener("keydown",function(e){ if(e.key==="Enter") send(); });
    box.querySelectorAll(".fahd-ai-chip").forEach(function(c){ c.onclick=function(){ document.getElementById("fahd-ai-input").value=c.getAttribute("data-q"); send(); }; });
    addMsg("bot","أهلاً بيك في مكتب الفهد 👋<br>أنا موظف مبيعات المكتب - بدرس كل الشقق المتاحة - قولي ميزانيتك والمنطقة وعدد الغرف - وهجيبلك أفضل 3-5 خيارات - وأشرحلك ليه كل واحدة مناسبة ليك.<br><b>جرب:</b> أريد شقة بميزانية 3 إلى 4 ملايين — أريد شقة فاخرة بمستوى راق — أريد شقة بحديقة خاصة");
    // سريع: أول ما الموقع يفتح - لا تحمل Firebase - استخدم الشقق اللي في الصفحة + الكاش بس - Firebase يتجيب بس أول ما العميل يسأل - مرة واحدة
  }
  function scrollToBottom(){
    var m=document.getElementById("fahd-ai-msgs"); if(!m) return;
    // انزل لآخر رسالة - تحت السؤال - العميل مش هيطلع بصباعه
    var go=function(){ try{ m.scrollTop=m.scrollHeight; m.scrollTo({top:m.scrollHeight,behavior:"smooth"}); }catch(e){ m.scrollTop=m.scrollHeight; } };
    go();
    requestAnimationFrame(go);
    setTimeout(go,50); setTimeout(go,200); setTimeout(go,500);
  }
  function addMsg(who,html){
    var m=document.getElementById("fahd-ai-msgs"); if(!m) return;
    var d=document.createElement("div"); d.className="fahd-ai-msg "+who; d.innerHTML=html; m.appendChild(d);
    scrollToBottom();
    // بعد ما الصور تحمل - انزل تاني - عشان الصورة ما ترفعش الرسايل فوق
    var imgs=d.querySelectorAll("img"); imgs.forEach(function(im){ im.addEventListener("load",scrollToBottom); });
  }
  function waLink(text){ return WA_BASE+encodeURIComponent(text); }
  function renderCards(ranked, c, start, count){
    var slice=ranked.slice(start, start+count);
    slice.forEach(function(r, idx){
      var p=r.p; var globalIdx=start+idx;
      var pageUrl=(typeof window.fahdPropUrl==="function"?window.fahdPropUrl(p._id):SITE+"properties/"+encodeURIComponent(p._id)+"/");
      var img=(p.images&&p.images[0])||p.image||"logo.jpeg";
      var note=r.diffs.length?"<div style='color:#FBBF24;font-size:12px'>⚠️ ملاحظة بصراحة: "+r.diffs.join(" • ")+"</div>":"<div style='color:#4ade80;font-size:12px'>✅ مطابق لطلبك</div>";
      var rankLabel=globalIdx===0?"🥇 أفضل ترشيح ليك":globalIdx===1?"🥈 ترشيح تاني قوي":globalIdx===2?"🥉 ترشيح تالت":"⭐ ترشيح "+(globalIdx+1);
      var card="<div class='fahd-ai-card'><div style='color:#D4AF37;font-weight:900'>"+rankLabel+"</div><img loading='lazy' src='"+img+"' alt=''><div style='margin-top:8px'><b>"+String(p.title||"").replace(/</g,"&lt;")+"</b></div><div>📍 "+(p.city||"")+" - "+(p.address||"")+"</div><div style='color:#D4AF37;font-weight:900;font-size:18px'>"+(p.price||"")+" جنيه</div><div>🛏️ "+(p.rooms||"-")+" غرف | 🛁 "+(p.baths||"-")+" حمام | 📐 "+(p.area||"-")+" م²</div><div style='line-height:1.7'>"+salesPitch(r,c)+"</div><div>"+String(p.details||"").slice(0,140)+"</div>"+note+"<div style='margin-top:8px;display:flex;gap:8px'><a href='"+pageUrl+"' target='_blank' style='background:#D4AF37;color:#000;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:900'>🔗 صفحة العقار</a> <a href='"+waLink("أريد الاستفسار عن: "+(p.title||"")+" - "+pageUrl)+"' target='_blank' style='background:#16a34a;color:#fff;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:900'>📲 واتساب</a></div></div>";
      addMsg("bot",card);
    });
    return slice.length;
  }
  async function send(){
    var inp=document.getElementById("fahd-ai-input"); var q=(inp.value||"").trim(); if(!q) return;
    addMsg("user",q.replace(/</g,"&lt;")); inp.value=""; scrollToBottom();
    // تحية - رد بياع واعرض أفضل 3 من غير أسئلة كتير
    if(/^(سلام|اهلا|أهلا|هلا|ازيك|ازيكم|هاي|hi|hello|صباح|مساء|شكرا|ماشي|تمام|اوكي)/i.test(q.trim()) && q.trim().length<20){
      addMsg("bot","أهلاً بيك نورت مكتب الفهد 🌟<br>قولي ميزانيتك والمنطقة اللي بتحبها - وهجيبلك أفضل الخيارات فورا - ولو لسه مش عارف - شوف أحسن 3 عندنا 👇");
    }
    var crit=parse(q, lastCriteria);
    // طلب التحدث مع موظف - حول واتساب مباشرة مع ملخص الطلب
    if(crit.talkHuman){
      addMsg("bot","تمام - هحولك لموظف حقيقي من فريق مكتب الفهد 👨‍💼<br>للمزيد من التفاصيل أو لترتيب معاينة، تواصل مع فريق مكتب الفهد عبر واتساب:<br><b>"+WA_NUM+"</b><br><a href='"+waLink("أريد التحدث مع موظف من المكتب - طلبي: "+q)+" ' target='_blank' style='display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;margin-top:8px;font-weight:900'>📲 واتساب المكتب - دوس هنا</a>");
      return;
    }
    // اعرض المزيد - كمل من نفس النتائج القديمة - من غير ما تسأل تاني
    if(crit.more && lastResults.length){
      var n=renderCards(lastResults, lastCriteria||crit, shownCount, 3);
      shownCount+=n;
      if(shownCount>=lastResults.length) addMsg("bot","دي كل الترشيحات القريبة من طلبك - لو عايز منطقة أو ميزانية مختلفة قولي - أو دوس واتساب ونرتب معاينة 📲<br><a href='"+waLink("أريد معاينة لعقار من ترشيحات المساعد")+"' target='_blank' style='display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;margin-top:8px;font-weight:900'>📲 واتساب المكتب</a>");
      else addMsg("bot","عايز تشوف أكتر؟ اكتب <b>اعرض المزيد</b> - أو دوس واتساب لمعاينة 📲");
      return;
    }
    // حفظ سياق الحوار - عشان مش يكرر الأسئلة
    if(crit.area) convo.area=crit.area; if(crit.deal) convo.deal=crit.deal; if(crit.rooms) convo.rooms=crit.rooms; if(crit.maxPrice){ convo.budget=crit.maxPrice; }
    if(crit.area) lastCriteria=crit;
    else if(lastCriteria && (crit.maxPrice||crit.rooms||crit.luxury)) { /* ادمج مع السابق */ crit.area=lastCriteria.area||crit.area; }
    lastCriteria=crit;
    addMsg("bot","تمام - بدرس كل الشقق المتاحة دلوقتي... ⏳");
    var list=await getAllProps(false); // Fresh: كاش 5 دقائق - بعدها Pagination جديد - مش بيانات قديمة
    if(!list.length){
      addMsg("bot","الشقق لسه بتحمل من الموقع... دوس زر <b>تحديث</b> فوق، أو دوس واتساب والمكتب هيبعتلك كل المتاح فورا.<br><a href='"+waLink("أريد عقار: "+q)+"' target='_blank' style='display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;margin-top:8px;font-weight:900'>📲 واتساب المكتب - "+WA_NUM+"</a>");
      return;
    }
    var ranked=rankAll(list, crit);
    lastResults=ranked; shownCount=0;
    // لو ناقص معلومة مهمة واحدة بس - اسأل سؤال واحد - مش أكتر - وبنفس الوقت اعرض أقرب خيارات
    var missing=[];
    if(!crit.area && !crit.maxPrice && !crit.rooms && !crit.luxury && !crit.cheapest && !crit.investment && !crit.garden && !crit.roof && !crit.basement) missing.push("الميزانية أو المنطقة");
    if(missing.length){
      addMsg("bot","عشان أجيبلك الصح بالظبط - ممكن تقولي <b>"+missing[0]+"</b>؟<br>وفي نفس الوقت - دي أفضل الخيارات المتاحة عندنا دلوقتي 👇");
    } else {
      addMsg("bot","درست <b>"+list.length+" عقار متاح</b> في المكتب - ودي <b>أفضل 3-5 ترشيحات</b> لطلبك - كلهم موجودين فعلا - بأسعارهم الحقيقية 👇");
    }
    var shown=renderCards(ranked, crit, 0, 4);
    shownCount=shown; scrollToBottom();
    // بعد العرض - سؤال المتابعة - مرة واحدة
    addMsg("bot","هل تحب نرتب لك معاينة لأحد هذه العقارات؟ 🤔<br>دوس واتساب وهحجزلك معاينة - أو اكتب <b>اعرض المزيد</b> لو عايز خيارات تانية.<br><a href='"+waLink("أريد ترتيب معاينة - طلبي: "+q)+"' target='_blank' style='display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;margin-top:8px;font-weight:900'>📲 واتساب المكتب - "+WA_NUM+"</a>");
  }
  document.addEventListener("DOMContentLoaded",ensureUI);
  if(document.readyState!=="loading") ensureUI();
  // لا يوجد تحديث دوري - عشان ما يتقلش الموقع - التحديث بيحصل بس لما العميل يسأل
})();
