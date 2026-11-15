/* AL FAHD - Smart Assistant v2 - Flexible / عرفي - لا يطلب تطابق 100%
   يفهم: رنج / رينج / حدود / حوالي / تقريبا / بيزمنت / روف / بدي / عايز
   لو العميل قال كلمة واحدة بس، يجيب أقرب خيارات - مش يقول ملقيتش
   لا يخترع عقارات - لا يعدل - لا يحذف - قراءة فقط - من Firebase بتاع الموقع
*/
(function(){
  var SITE="https://fhdmsraby-lgtm.github.io/al-fahd-real-estate/";
  var WA="https://wa.me/201040872120?text=";
  function num(v){ var n=parseFloat(String(v||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; }
  function isAvailable(p){
    var s=String(p.status||"متاح");
    if(/قيد المراجعة|معلق|مرفوض|مسودة/i.test(s)) return false;
    if(/مباع|تم البيع|مؤجر|تم التأجير|غير متاح|متوقف|محجوز/i.test(s)) return false;
    return true;
  }
  function clean(s){ return String(s||"").toLowerCase(); }
  function parse(q){
    var t=clean(q);
    var out={area:"",deal:"",maxPrice:0,minPrice:0,rooms:0,baths:0,minArea:0,type:"",finish:"",furnished:null,feature:"",raw:t};
    var areas=["التجمع الخامس","التجمع الاول","التجمع الأول","الرحاب","مدينتي","الشروق","مصر الجديدة","المعادي","6 أكتوبر","اكتوبر","التجمع","القاهرة الجديدة","زايد","الشيخ زايد","العبور","المقطم","مدينة نصر","القطامية","التجمع الثالث","التجمع الاول"];
    for(var i=0;i<areas.length;i++){ if(t.indexOf(areas[i].toLowerCase())!==-1){ out.area=areas[i]; break; } }
    if(/ايجار|إيجار|اجار|للإيجار|كراء|rent|ايجار/.test(t)) out.deal="rent";
    else if(/بيع|للبيع|شراء|sale/.test(t)) out.deal="sale";
    if(/مفروش|مفروشة|furnished/.test(t)) out.furnished=true;
    if(/غير مفروش|بدون فرش|unfurnished/.test(t)) out.furnished=false;
    // السعر - رنج / رينج / حدود / حوالي / تقريبا / بحد أقصى / حتى / مليون / الف / جنيه
    // مثال: بدي شقة رنج 5 مليون - عايز شقة حدود 4 مليون - حوالي 6 مليون
    var m=t.match(/(?:رنج|رينج|range|حدود|حوالي|تقريبا|تقريباً|بحد أقصى|حد اقصى|حتى|اقل من|أقل من|ما يزيدش|under|max|بـ|ب|في حدود|بحدود)\s*([\d.,]+)\s*(مليون|مليار|الف|ألف|k|جنيه|ج)?/);
    if(m){ var v=parseFloat(m[1].replace(",",".")); if(m[2]&&m[2].indexOf("مليون")!==-1) v=v*1000000; else if(m[2]&&(m[2].indexOf("الف")!==-1||m[2].indexOf("ألف")!==-1)) v=v*1000; else if(v<1000) v=v*1000000; out.maxPrice=v; out.minPrice=v*0.6; }
    else { var m2=t.match(/([\d.,]+)\s*مليون/); if(m2){ out.maxPrice=parseFloat(m2[1].replace(",","."))*1000000; out.minPrice=out.maxPrice*0.6; } }
    // رنج بين X و Y : بين 4 و 6 مليون
    var mr=t.match(/بين\s*([\d.,]+)\s*(?:و|-|to)\s*([\d.,]+)\s*(مليون)?/);
    if(mr){ var a=parseFloat(mr[1]), b=parseFloat(mr[2]); if(mr[3]){a*=1000000;b*=1000000;} else if(a<1000){a*=1000000;b*=1000000;} out.minPrice=Math.min(a,b); out.maxPrice=Math.max(a,b); }
    var m3=t.match(/(\d+)\s*(غرف|غرفة|اوض|أوض|اوضة|غرفه|غرفتين|اوضتين)/); if(m3) out.rooms=parseInt(m3[1],10);
    if(/غرفتين|اوضتين/.test(t) && !out.rooms) out.rooms=2;
    var m4=t.match(/(\d+)\s*(حمام|حمامات)/); if(m4) out.baths=parseInt(m4[1],10);
    var m5=t.match(/(\d+)\s*(متر|م²|م2)/); if(m5) out.minArea=parseInt(m5[1],10);
    if(/فيلا|فيلات|villa/.test(t)) out.type="villa";
    else if(/تاون|تاونهاوس|townhouse/.test(t)) out.type="town";
    else if(/دوبلكس|duplex/.test(t)) out.type="duplex";
    else if(/شقة|شقه|شقق|apartment|استوديو|ستوديو/.test(t)) out.type="apartment";
    else if(/شاليه|شاليهات/.test(t)) out.type="chalet";
    if(/بيزمنت|بدروم|basement|بيسمنت/.test(t)) out.feature="بيزمنت";
    else if(/روف|روف|roof|سطح/.test(t)) out.feature="روف";
    else if(/حديقة|جاردن|garden/.test(t)) out.feature="حديقة";
    else if(/حمام سباحة|pool|مسبح/.test(t)) out.feature="حمام سباحة";
    if(/نصف تشطيب|نص تشطيب/.test(t)) out.finish="نصف تشطيب";
    else if(/تشطيب كامل|متشطب|تشطيب/.test(t)) out.finish="تشطيب";
    else if(/الترا|سوبر لوكس|لوكس/.test(t)) out.finish="لوكس";
    return out;
  }
  function matchProps(criteria){
    var list=(window.props||[]).filter(isAvailable);
    if(!list.length) return [];
    var scored=list.map(function(p){
      var score=0, diffs=[];
      var hay=clean((p.title||"")+" "+(p.city||"")+" "+(p.address||"")+" "+(p.type||"")+" "+(p.details||""));
      var price=num(p.price);
      if(criteria.area){ if(hay.indexOf(criteria.area.toLowerCase())!==-1) score+=30; else { score+=2; diffs.push("في منطقة تانية: "+(p.city||"")); } }
      if(criteria.deal){
        var isRent=/ايجار|إيجار|مفروش|rent/i.test(String(p.type||"")+" "+String(p.details||""));
        if((criteria.deal==="rent")===isRent) score+=15; else diffs.push(criteria.deal==="rent"?"ده للبيع":"ده للإيجار");
      }
      if(criteria.maxPrice && price){
        if(price>=criteria.minPrice && price<=criteria.maxPrice) score+=30;
        else if(price<=criteria.maxPrice*1.3) { score+=18; diffs.push("السعر أعلى شوية من الرنج بتاعك"); }
        else if(price>=criteria.minPrice*0.6) { score+=12; diffs.push("السعر أقل من الرنج - فرصة كويسة"); }
        else { score+=5; diffs.push("السعر بعيد شوية عن الرنج"); }
      }
      if(criteria.rooms && num(p.rooms)){ if(num(p.rooms)===criteria.rooms) score+=12; else if(num(p.rooms)>=criteria.rooms) score+=8; else { score+=4; diffs.push("عدد الغرف مختلف"); } }
      if(criteria.minArea && num(p.area)){ if(num(p.area)>=criteria.minArea) score+=5; else diffs.push("المساحة أصغر شوية"); }
      if(criteria.furnished===true){ if(/مفروش/i.test(hay)) score+=10; else diffs.push("مش مفروش"); }
      if(criteria.finish){ if(hay.indexOf(criteria.finish.toLowerCase())!==-1) score+=5; }
      if(criteria.feature){ if(hay.indexOf(criteria.feature.toLowerCase())!==-1) score+=20; else { score-=2; diffs.push("مفيهوش "+criteria.feature); } }
      if(criteria.type){
        if(criteria.type==="villa" && /فيلا|villa/i.test(hay)) score+=10;
        if(criteria.type==="apartment" && /شقة|شقه/i.test(hay)) score+=8;
        if(criteria.type==="duplex" && /دوبلكس/i.test(hay)) score+=10;
      }
      // لو العميل قال كلمة واحدة بس زي بيزمنت - خلي اللي فيه الميزة يطلع الأول حتى لو مفيش منطقة
      if(!criteria.area && !criteria.maxPrice && !criteria.rooms && criteria.feature) score+=10;
      // لو مفيش أي معيار - اعرض الأحدث / المميز الأول
      if(!criteria.area && !criteria.maxPrice && !criteria.rooms && !criteria.feature && !criteria.type) score=5;
      return {p:p,score:score,diffs:diffs};
    });
    scored.sort(function(a,b){return b.score-a.score;});
    // مرن: حتى لو النتيجة مش 100% - اعرض أقرب 3 دايما - مع توضيح الفرق
    return scored.slice(0,3);
  }
  function ensureUI(){
    if(document.getElementById("fahd-ai-btn")) return;
    var btn=document.createElement("button"); btn.id="fahd-ai-btn"; btn.textContent="💬 مساعد الفهد العقاري";
    btn.onclick=function(){ var b=document.getElementById("fahd-ai-box"); b.style.display=(b.style.display==="block"?"none":"block"); };
    var box=document.createElement("div"); box.id="fahd-ai-box";
    box.innerHTML='<div id="fahd-ai-head"><span>🏠 مساعد الفهد العقاري — من عقارات المكتب فقط</span><button onclick="document.getElementById(\'fahd-ai-box\').style.display=\'none\'" style="background:none;border:none;color:#D4AF37;font-size:18px;cursor:pointer">✕</button></div>'
      +'<div id="fahd-ai-msgs"></div>'
      +'<div style="padding:0 12px 6px"><span class="fahd-ai-chip" data-q="عايز شقة في التجمع الخامس 3 غرف بحد أقصى 5 مليون">شقة التجمع 3 غرف - 5 مليون</span> <span class="fahd-ai-chip" data-q="بدي شقة مفروشة للإيجار في الرحاب">مفروشة للإيجار - الرحاب</span> <span class="fahd-ai-chip" data-q="بدي شقة رنج 5 مليون">شقة رنج 5 مليون</span> <span class="fahd-ai-chip" data-q="عايز فيلا بيزمنت">فيلا بيزمنت</span></div>'
      +'<div id="fahd-ai-input-row"><input id="fahd-ai-input" placeholder="اكتب طلبك بالعربي... مثال: بدي شقة رنج 5 مليون"><button id="fahd-ai-send">إرسال</button></div>';
    document.body.appendChild(btn); document.body.appendChild(box);
    document.getElementById("fahd-ai-send").onclick=send;
    document.getElementById("fahd-ai-input").addEventListener("keydown",function(e){ if(e.key==="Enter") send(); });
    box.querySelectorAll(".fahd-ai-chip").forEach(function(c){ c.onclick=function(){ document.getElementById("fahd-ai-input").value=c.getAttribute("data-q"); send(); }; });
    addMsg("bot","أهلاً بيك في مكتب الفهد 👋<br>قولي طلبك بأي طريقة — حتى لو كلمة واحدة — وأنا هجيبلك أقرب خيارات من عقارات المكتب.<br><b>مثال:</b> بدي شقة رنج 5 مليون — عايز فيلا بيزمنت — شقة للايجار في الرحاب");
  }
  function addMsg(who,html){
    var m=document.getElementById("fahd-ai-msgs"); if(!m) return;
    var d=document.createElement("div"); d.className="fahd-ai-msg "+who; d.innerHTML=html; m.appendChild(d); m.scrollTop=m.scrollHeight;
  }
  function send(){
    var inp=document.getElementById("fahd-ai-input"); var q=(inp.value||"").trim(); if(!q) return;
    addMsg("user",q.replace(/</g,"&lt;")); inp.value="";
    var crit=parse(q);
    var res=matchProps(crit);
    if(!res.length){
      addMsg("bot","العقارات لسه بتحمل... دوس تحديث فوق، أو دوس واتساب والمكتب هيبعتلك كل المتاح.<br><a href='"+WA+encodeURIComponent("أريد عقار: "+q)+"' target='_blank' style='display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;margin-top:8px;font-weight:900'>📲 واتساب المكتب</a>");
      return;
    }
    var hasExact=res.some(function(r){return r.score>=40;});
    var intro=hasExact ? "لقيتلك <b>"+res.length+" عقار</b> من عقارات المكتب — مطابق أو قريب من طلبك 👇" : "ملقيتش مطابق 100% — بس لقيتلك <b>أقرب "+res.length+" خيارات</b> من عقارات المكتب — شوفهم، ولو عايز أضيق أكتر قولي 👇";
    addMsg("bot",intro);
    res.forEach(function(r){
      var p=r.p;
      var pageUrl=SITE+"properties/"+encodeURIComponent(p._id)+"/";
      var img=(p.images&&p.images[0])||p.image||"logo.jpeg";
      var note=r.diffs.length?"<div style='color:#FBBF24;font-size:12px'>⚠️ ملاحظة: "+r.diffs.join(" • ")+"</div>":"<div style='color:#4ade80;font-size:12px'>✅ مطابق لطلبك</div>";
      var card="<div class='fahd-ai-card'><img src='"+img+"' alt=''><div style='margin-top:8px'><b>"+String(p.title||"").replace(/</g,"&lt;")+"</b></div><div>📍 "+(p.city||"")+" - "+(p.address||"")+"</div><div style='color:#D4AF37;font-weight:900;font-size:18px'>"+(p.price||"")+" جنيه</div><div>🛏️ "+(p.rooms||"-")+" غرف | 🛁 "+(p.baths||"-")+" حمام | 📐 "+(p.area||"-")+" م²</div><div>"+String(p.details||"").slice(0,120)+"</div>"+note+"<div style='margin-top:8px;display:flex;gap:8px'><a href='"+pageUrl+"' target='_blank' style='background:#D4AF37;color:#000;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:900'>🔗 صفحة العقار</a> <a href='"+WA+encodeURIComponent("أريد الاستفسار عن: "+(p.title||"")+" - "+pageUrl)+"' target='_blank' style='background:#16a34a;color:#fff;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:900'>📲 واتساب</a></div></div>";
      addMsg("bot",card);
    });
    addMsg("bot","عايز أقرب أكتر؟ قولي رنج مختلف، أو منطقة تانية، أو عدد غرف مختلف — مثال: <b>بدي شقة رنج 4 مليون</b> — أو دوس واتساب 📲");
  }
  document.addEventListener("DOMContentLoaded",ensureUI);
  if(document.readyState!=="loading") ensureUI();
})();
