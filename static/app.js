/* Expert na prácu: accessible navigation, calculator and direct inquiry. */
(function () {
  'use strict';
  var lang=document.documentElement.lang.split('-')[0];
  var locale={sk:'sk-SK',en:'en-GB',hu:'hu-HU'}[lang]||'sk-SK';
  var header=document.getElementById('site-header');
  if(header){
    var toggle=header.querySelector('.nav-toggle');
    function closeMenu(){header.classList.remove('nav-open');if(toggle)toggle.setAttribute('aria-expanded','false');}
    if(toggle)toggle.addEventListener('click',function(){var open=header.classList.toggle('nav-open');toggle.setAttribute('aria-expanded',String(open));});
    header.querySelectorAll('.main-nav a').forEach(function(a){a.addEventListener('click',closeMenu);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&header.classList.contains('nav-open')){closeMenu();toggle.focus();}});
  }
  var dataEl=document.getElementById('calc-data'), form=document.getElementById('calc-form');
  if(dataEl&&form){
    var data;try{data=JSON.parse(dataEl.textContent);}catch(e){return;}
    var ui=data.ui,typeEl=document.getElementById('calc-type'),nsEl=document.getElementById('calc-ns');
    var numberEl=document.createElement('input');numberEl.type='number';numberEl.step='1';numberEl.id='calc-number';numberEl.className='calc-number';numberEl.setAttribute('aria-label',{sk:'Počet normostrán',en:'Number of standard pages',hu:'Normáloldalak száma'}[lang]);
    document.querySelector('.range-top').appendChild(numberEl);
    function money(n){return new Intl.NumberFormat(locale,{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);}
    function type(){return data.types.find(function(t){return t.id===typeEl.value;})||data.types[0];}
    function deadline(){var c=form.querySelector('[name=deadline]:checked');return data.deadlines.find(function(d){return c&&d.id===c.value;})||data.deadlines[0];}
    function addons(){return data.addons.filter(function(a){var c=form.querySelector('[name=addon][value="'+a.id+'"]');return c&&c.checked&&!c.disabled;});}
    function range(){var t=type();nsEl.min=numberEl.min=t.min_ns;nsEl.max=numberEl.max=t.max_ns;if(+nsEl.value<t.min_ns||+nsEl.value>t.max_ns)nsEl.value=t.default_ns;document.getElementById('calc-min').textContent=t.min_ns;document.getElementById('calc-max').textContent=t.max_ns;
      // Never charge the same statistics service twice.
      var stats=form.querySelector('[name=addon][value=stats]');if(stats){stats.disabled=t.id==='statistics';if(stats.disabled)stats.checked=false;}
    }
    function update(){
      var t=type(),d=deadline(),n=+nsEl.value,selected=addons(),bare=t.price*n,base=bare*d.mult,pct=0;
      data.discounts.forEach(function(dis){if(n>=dis.from)pct=dis.pct;});
      var discount=Math.round(base*pct/100),fixed=t.id==='statistics'?120:0,extra=selected.reduce(function(s,a){return s+a.price;},0),total=Math.round(base-discount+extra+fixed);
      numberEl.value=n;document.getElementById('calc-ns-out').textContent=n;
      document.getElementById('calc-words').textContent='≈ '+new Intl.NumberFormat(locale).format(n*250)+' '+ui.words;
      document.getElementById('calc-total').textContent=money(total);
      document.getElementById('calc-per-ns').textContent=new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(total/n)+' € '+ui.per_ns;
      var list=document.getElementById('calc-breakdown');list.replaceChildren();
      function row(label,value){var li=document.createElement('li'),a=document.createElement('span'),b=document.createElement('span');a.textContent=label;b.textContent=value;li.append(a,b);list.appendChild(li);}
      row(ui.base+' · '+n+' NS × '+money(t.price),money(bare));
      if(base>bare)row(d.label+' · '+d.surcharge,'+'+money(base-bare));
      if(pct)row(ui.discount+' −'+pct+' %','−'+money(discount));
      if(fixed)row({sk:'Základná analýza dát',en:'Basic data analysis',hu:'Alap adatelemzés'}[lang],'+'+money(fixed));
      selected.forEach(function(a){row(a.label,'+'+money(a.price));});
      nsEl.style.setProperty('--fill',((n-t.min_ns)/(t.max_ns-t.min_ns)*100)+'%');
      var params=new URLSearchParams({type:t.id,ns:String(n),deadline:d.id,addons:selected.map(function(a){return a.id;}).join(','),estimate:String(total)});
      document.querySelectorAll('[data-calc-quote]').forEach(function(a){a.href={en:'/en/contact/',hu:'/hu/kapcsolat/',sk:'/kontakt/'}[lang]+'?'+params.toString()+'#formular';});
    }
    typeEl.addEventListener('change',function(){range();update();});nsEl.addEventListener('input',update);
    function syncNumber(){var t=type(),n=Number(numberEl.value);nsEl.value=Math.min(t.max_ns,Math.max(t.min_ns,Number.isFinite(n)?Math.round(n):t.default_ns));update();}
    numberEl.addEventListener('input',function(){if(numberEl.value!==''&&+numberEl.value>=type().min_ns&&+numberEl.value<=type().max_ns)syncNumber();});
    numberEl.addEventListener('change',syncNumber);
    form.addEventListener('change',function(e){if(e.target.name==='deadline'||e.target.name==='addon')update();});
    form.addEventListener('submit',function(e){e.preventDefault();});range();update();
  }
  var inquiry=document.getElementById('inquiry-form');
  if(inquiry){
    var strings={sk:{sending:'Odosielam…',success:'Formulár bol odoslaný službe na doručenie. Ak odpoveď nepríde, skontrolujte aj priečinok Spam.',error:'Správu sa nepodarilo potvrdiť. Zadanie zostalo vyplnené; skúste odoslanie neskôr.',privacy:'Potvrďte, prosím, oboznámenie s ochranou údajov.'},en:{sending:'Sending…',success:'The form was submitted to the delivery service. Please check your spam folder if you do not receive a reply.',error:'Submission could not be confirmed. Your text is preserved; please try again later.',privacy:'Please acknowledge the privacy notice.'},hu:{sending:'Küldés…',success:'Az űrlapot továbbítottuk a kézbesítési szolgáltatásnak. Ellenőrizze a levélszemét mappát is.',error:'A küldést nem sikerült megerősíteni. A beírt szöveg megmaradt; próbálja újra később.',privacy:'Kérjük, vegye tudomásul az adatkezelési tájékoztatót.'}}[lang];
    var params=new URLSearchParams(location.search),ns=params.get('ns'),estimate=params.get('estimate');
    var typeMap={seminar:0,bachelor:1,master:2,rigorous:3,dissertation:4,proofreading:5,statistics:6};
    if(Object.prototype.hasOwnProperty.call(typeMap,params.get('type')))document.getElementById('f-type').selectedIndex=typeMap[params.get('type')];
    if(ns&&/^\d{1,3}$/.test(ns))document.getElementById('f-ns').value=ns+' NS';
    if(estimate&&/^\d{1,7}$/.test(estimate)){
      var summary=document.createElement('input');summary.type='hidden';summary.name='calculator_selection';summary.value=['type','ns','deadline','addons','estimate'].map(function(k){return k+': '+(params.get(k)||'').slice(0,200);}).join('; ');inquiry.appendChild(summary);
      var out=document.createElement('p');out.className='note';out.textContent={sk:'Výber z kalkulačky (orientačne): ',en:'Calculator estimate: ',hu:'Kalkulátoros becslés: '}[lang]+new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(+estimate);inquiry.prepend(out);
    }
    var busy=false;
    inquiry.addEventListener('submit',async function(e){
      e.preventDefault();if(busy||!inquiry.reportValidity())return;
      var status=document.getElementById('form-status'),button=inquiry.querySelector('[type=submit]');
      if(inquiry.querySelector('[name=_honey]').value)return;
      busy=true;button.disabled=true;var label=button.textContent;button.textContent=strings.sending;status.textContent='';
      var payload=Object.fromEntries(new FormData(inquiry).entries());payload.language=lang;payload.page=location.origin+location.pathname;
      var controller=new AbortController(),timeout=setTimeout(function(){controller.abort();},15000);
      try{
        var endpoint=inquiry.action.replace('https://formsubmit.co/','https://formsubmit.co/ajax/');
        var res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        var result=await res.json();if(!res.ok||!(result.success===true||result.success==='true'))throw new Error('Submission not confirmed');
        status.textContent=strings.success;inquiry.reset();
      }catch(err){status.textContent=strings.error;}
      finally{clearTimeout(timeout);busy=false;button.disabled=false;button.textContent=label;}
    });
  }
})();
