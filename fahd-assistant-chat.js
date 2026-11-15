/* AL FAHD - Smart Assistant - Modular - Rule-based first - NO API KEY in frontend
   يقرأ من window.props (نفس Firebase بتاع الموقع) - لا يخترع عقارات - لا يعدل - لا يحذف - لا يعرض بيانات ملاك
   لو مزود AI تعطل، البحث القاعدي شغال 100%
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
  // --- فهم الطلب - مصري + شامي ---
  function parse(q){
    var t=clean(q);
    var out={area:"",deal:"",maxPrice:0,minPrice:0,rooms:0,baths:0,minArea:0,type:"",finish:"",furnished:null};
    // المنطقة
    var areas=["التجمع الخامس","التجمع الاول","التجمع الأول","الرحاب","مدينتي","الشروق","مصر الجديدة","المعادي","6 أكتوبر","اكتوبر","التجمع","القاهرة الجديدة","زايد","الشيخ زايد","العبور","العبور الجديدة","المقطم","مدينة نصر"];
    for(var i=0;i<areas.length;i++){ if(t.indexOf(areas[i].toLowerCase())!==-1){ out.area=areas[i]; break; } }
    // بيع / إيجار
    if(/ايجار|إيجار|اجار|للإيجار|مفروش|كراء|rent/.test(t)) out.deal="rent";
    else if(/بيع|للبيع|شراء|sale|بيع/.test(t)) out.deal="sale";
    // مفروش
    if(/مفروش|مفروشة|furnished|مفروش/.test(t)) out.furnished=true;
    if(/غير مفروش|بدون فرش|غير مفروشة|unfurnished/.test(t)) out.furnished=false;
    // السعر - بحد أقصى / حتى / اقل من / مليون / الف
    var m=t.match(/(?:بحد أقصى|حد اقصى|حتى|اقل من|أقل من|ما يزيدش عن|ما يتعداش|under|max|اقل من)\s*([\d.,]+)\s*(مليون|مليار|الف|ألف|k)?/);
    if(m){ var v=parseFloat(m[1].replace(",",".")); if(m[2]&&m[2].indexOf("مليون")!==-1) v=v*1000000; if(m[2]&&(m[2].indexOf("الف")!==-1||m[2].indexOf("ألف")!==-1)) v=v*1000; out.maxPrice=v; }
    else { var m2=t.match(/([\d.,]+)\s*مليون/); if(m2) out.maxPrice=parseFloat(m2[1].replace(",","."))*1000000; }
    var m3=t.match(/(\d+)\s*(غرف|غرفة|اوض|أوض|اوضة|غرفه)/); if(m3) out.rooms=parseInt(m3[1],10);
    var m4=t.match(/(\d+)\s*(حمام|حمامات)/); if(m4) out.baths=parseInt(m4[1],10);
    var m5=t.match(/(\d+)\s*(متر|م²|م2)/); if(m5) out.minArea=parseInt(m5[1],10);
    // نوع العقار
    if(/فيلا|فيلات|villa/.test(t)) out.type="villa";
    else if(/تاون|تاونهاوس|townhouse/.test(t)) out.type="town";
    else if(/دوبلكس|duplex/.test(t)) out.type="duplex";
    else if(/شقة|شقه|شقق|apartment/.test(t)) out.type="apartment";
    // التشطيب
    if(/نصف تشطيب|نص تشطيب|نصف/.test(t)) out.finish="نصف تشطيب";
    else if(/تشطيب كامل|متشطب|تشطيب/.test(t)) out.finish="تشطيب";
    else if(/الترا|سوبر لوكس|لوكس/.test(t)) out.finish="لوكس";
    return out;
  }
  function matchProps(criteria){
    var list=(window.props||[]).filter(isAvailable);
    var scored=list.map(function(p){
      var score=0, diffs=[];
      var hay=clean((p.title||"")+" "+(p.city||"")+" "+(p.address||"")+" "+(p.type||"")+" "+(p.details||""));
      if(criteria.area){ if(hay.indexOf(criteria.area.toLowerCase())!==-1) score+=30; else diffs.push("المنطقة مختلفة: "+(p.city||"")); }
      if(criteria.deal){
        var isRent=/ايجار|إيجار|مفروش|rent/i.test(String(p.type||"")+" "+String(p.details||""));
        if((criteria.deal==="rent")===isRent) score+=20; else diffs.push(criteria.deal==="rent"?"ده للبيع مش إيجار":"ده للإيجار مش بيع");
      }
      if(criteria.maxPrice && num(p.price)){ if(num(p.price)<=criteria.maxPrice) score+=25; else { score-=10; diffs.push("السعر أعلى من ميزانيتك"); } }
      if(criteria.rooms && num(p.rooms)){ if(num(p.rooms)>=criteria.rooms) score+=10; else diffs.push("عدد الغرف أقل"); }
      if(criteria.minArea && num(p.area)){ if(num(p.area)>=criteria.minArea) score+=5; else diffs.push("المساحة أصغر"); }
      if(criteria.furnished===true){ if(/مفروش/i.test(hay)) score+=10; else diffs.push("مش مفروش"); }
      if(criteria.finish){ if(hay.indexOf(criteria.finish.toLowerCase())!==-1) score+=5; }
      return {p:p,score:score,diffs:diffs};
    });
    // فلتر صارم للسعر والمنطقة لو المستخدم حددهم
    var filtered=scored.filter(function(x){
      if(criteria.area && x.score<30) return false;
      if(criteria.maxPrice && num(x.p.price)>criteria.maxPrice*1.25) return false;
      return x.score>0;
    });
    filtered.sort(function(a,b){return b.score-a.score;});
    return filtered.slice(0,3);
  }
  // --- UI ---
  function ensureUI(){
    if(document.getElementById("fahd-ai-btn")) return;
    var btn=document.createElement("button"); btn.id="fahd-ai-btn"; btn.textContent="💬 مساعد الفهد العقاري";
    btn.onclick=function(){ var b=document.getElementById("fahd-ai-box"); b.style.display=(b.style.display==="block"?"none":"block"); };
    var box=document.createElement("div"); box.id="fahd-ai-box";
    box.innerHTML='<div id="fahd-ai-head"><span>🏠 مساعد الفهد العقاري — من عقارات المكتب فقط</span><button onclick="document.getElementById(\'fahd-ai-box\').style.display=\'none\'" style="background:none;border:none;color:#D4AF37;font-size:18px;cursor:pointer">✕</button></div>'
      +'<div id="fahd-ai-msgs"></div>'
      +'<div style="padding:0 12px 6px"><span class="fahd-ai-chip" data-q="عايز شقة في التجمع الخامس 3 غرف بحد أقصى 5 مليون">شقة التجمع 3 غرف - 5 مليون</span> <span class="fahd-ai-chip" data-q="بدي شقة مفروشة للإيجار في الرحاب">مفروشة للإيجار - الرحاب</span> <span class="fahd-ai-chip" data-q="أريد فيلا نصف تشطيب في التجمع الأول بحد أقصى 11 مليون">فيلا التجمع الأول</span></div>'
      +'<div id="fahd-ai-input-row"><input id="fahd-ai-input" placeholder="اكتب طلبك... مثال: عايز شقة 3 غرف في الرحاب"><button id="fahd-ai-send">إرسال</button></div>';
    document.body.appendChild(btn); document.body.appendChild(box);
    document.getElementById("fahd-ai-send").onclick=send;
    document.getElementById("fahd-ai-input").addEventListener("keydown",function(e){ if(e.key==="Enter") send(); });
    box.querySelectorAll(".fahd-ai-chip").forEach(function(c){ c.onclick=function(){ document.getElementById("fahd-ai-input").value=c.getAttribute("data-q"); send(); }; });
    addMsg("bot","أهلاً بيك في مكتب الفهد 👋<br>قولي طلبك — المنطقة، البيع أو الإيجار، الميزانية، عدد الغرف — وأنا هجيبلك من عقارات المكتب المتاحة بس.<br><b>مثال:</b> عايز شقة في التجمع الخامس 3 غرف بحد أقصى 5 مليون");
  }
  function addMsg(who,html){
    var m=document.getElementById("fahd-ai-msgs"); if(!m) return;
    var d=document.createElement("div"); d.className="fahd-ai-msg "+who; d.innerHTML=html; m.appendChild(d); m.scrollTop=m.scrollHeight;
  }
  function send(){
    var inp=document.getElementById("fahd-ai-input"); var q=(inp.value||"").trim(); if(!q) return;
    addMsg("user",q.replace(/</g,"&lt;")); inp.value="";
    var crit=parse(q);
    var missing=[];
    if(!crit.area) missing.push("المنطقة");
    if(!crit.deal) missing.push("بيع ولا إيجار");
    if(!crit.maxPrice) missing.push("الميزانية");
    // لو ناقص بيانات مهمة - اسأل قبل العرض
    if(missing.length>=2){
      addMsg("bot","تمام — عشان أجيبلك الصح بالظبط 👌<br>ممكن تقولي: <b>"+missing.join(" + ")+"</b>؟<br>مثال: عايز شقة في التجمع الخامس 3 غرف بحد أقصى 5 مليون");
      return;
    }
    var res=matchProps(crit);
    if(!res.length){
      addMsg("bot","ملقيتش عقار مطابق 100% لطلبك دلوقتي — من العقارات المتاحة في المكتب.<br>ممكن تجرب توسع الميزانية شوية أو تغير المنطقة؟ أو دوس واتساب وأنا أوصلك بالمكتب وهنشوفلك أقرب حاجة.<br><a href='"+WA+encodeURIComponent("أريد عقار: "+q)+"' target='_blank' style='display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;margin-top:8px;font-weight:900'>📲 واتساب المكتب</a>");
      return;
    }
    var html="لقيتلك <b>"+res.length+" عقار</b> من عقارات المكتب المتاحة — مطابق لطلبك أو قريب منه 👇";
    addMsg("bot",html);
    res.forEach(function(r){
      var p=r.p;
      var pageUrl=SITE+"properties/"+encodeURIComponent(p._id)+"/";
      var img=(p.images&&p.images[0])||p.image||"logo.jpeg";
      var note=r.diffs.length?"<div style='color:#FBBF24;font-size:12px'>⚠️ ملاحظة: "+r.diffs.join(" • ")+"</div>":"";
      var card="<div class='fahd-ai-card'><img src='"+img+"' alt=''><div style='margin-top:8px'><b>"+String(p.title||"").replace(/</g,"&lt;")+"</b></div><div>📍 "+(p.city||"")+" - "+(p.address||"")+"</div><div style='color:#D4AF37;font-weight:900;font-size:18px'>"+(p.price||"")+" جنيه</div><div>🛏️ "+(p.rooms||"-")+" غرف | 🛁 "+(p.baths||"-")+" حمام | 📐 "+(p.area||"-")+" م²</div><div>"+String(p.details||"").slice(0,120)+"</div>"+note+"<div style='margin-top:8px;display:flex;gap:8px'><a href='"+pageUrl+"' target='_blank' style='background:#D4AF37;color:#000;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:900'>🔗 صفحة العقار</a> <a href='"+WA+encodeURIComponent("أريد الاستفسار عن: "+(p.title||"")+" - "+pageUrl)+"' target='_blank' style='background:#16a34a;color:#fff;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:900'>📲 واتساب</a></div></div>";
      addMsg("bot",card);
    });
    addMsg("bot","عايز أضيق النتائج أكتر؟ قولي ميزانية أو منطقة أو عدد غرف مختلف — أو دوس واتساب والمكتب هيتواصل معاك 📲");
  }
  document.addEventListener("DOMContentLoaded",ensureUI);
  if(document.readyState!=="loading") ensureUI();
})();
