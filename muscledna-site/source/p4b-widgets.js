  /* ---------------- widgets ---------------- */
  function toggleGroup(root,attr,cb){
    var btns=$$('button',root);
    root.addEventListener('click',function(ev){
      var b=ev.target.closest('button');if(!b||!root.contains(b))return;
      var on=b.getAttribute('aria-pressed')==='true';
      btns.forEach(function(x){x.setAttribute('aria-pressed','false');});
      if(!on)b.setAttribute('aria-pressed','true');
      cb(on?0:+b.getAttribute(attr));
    });
  }
  function setInfo(el,h,p){el.innerHTML='<strong></strong><span></span>';el.firstChild.textContent=h;el.lastChild.textContent=p;}
  function setSlider(el){el.style.setProperty('--p',((el.value-el.min)/(el.max-el.min)*100)+'%');}
  function fmtInt(n){return Math.round(n).toLocaleString('en-US');}

  /* ---------------- sources card ---------------- */
  var SRCS={
    janssen00:{a:'Janssen I, Heymsfield SB, Wang ZM, Ross R.',t:'Skeletal muscle mass and distribution in 468 men and women aged 18–88 yr.',j:'Journal of Applied Physiology, 2000;89(1):81–88.',u:'https://doi.org/10.1152/jappl.2000.89.1.81'},
    schoenfeld10:{a:'Schoenfeld BJ.',t:'The mechanisms of muscle hypertrophy and their application to resistance training.',j:'Journal of Strength and Conditioning Research, 2010;24(10):2857–2872.',u:'https://doi.org/10.1519/JSC.0b013e3181e840f3'},
    mitchell12:{a:'Mitchell WK, Williams J, Atherton P, Larvin M, Lund J, Narici M.',t:'Sarcopenia, dynapenia, and the impact of advancing age on human skeletal muscle size and strength; a quantitative review.',j:'Frontiers in Physiology, 2012;3:260.',u:'https://doi.org/10.3389/fphys.2012.00260'},
    iraki19:{a:'Iraki J, Fitschen P, Espinar S, Helms E.',t:'Nutrition recommendations for bodybuilders in the off-season: a narrative review.',j:'Sports, 2019;7(7):154.',u:'https://doi.org/10.3390/sports7070154'},
    morton18:{a:'Morton RW, Murphy KT, McKellar SR, et al.',t:'A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults.',j:'British Journal of Sports Medicine, 2018;52(6):376–384.',u:'https://doi.org/10.1136/bjsports-2017-097608'},
    jager17:{a:'Jäger R, Kerksick CM, Campbell BI, et al.',t:'International Society of Sports Nutrition position stand: protein and exercise.',j:'Journal of the International Society of Sports Nutrition, 2017;14:20.',u:'https://doi.org/10.1186/s12970-017-0177-8'},
    garthe11:{a:'Garthe I, Raastad T, Refsnes PE, Koivisto A, Sundgot-Borgen J.',t:'Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes.',j:'International Journal of Sport Nutrition and Exercise Metabolism, 2011;21(2):97–104.',u:'https://doi.org/10.1123/ijsnem.21.2.97'},
    longland16:{a:'Longland TM, Oikawa SY, Mitchell CJ, Devries MC, Phillips SM.',t:'Higher compared with lower dietary protein during an energy deficit combined with intense exercise promotes greater lean mass gain and fat mass loss: a randomized trial.',j:'American Journal of Clinical Nutrition, 2016;103(3):738–746.',u:'https://doi.org/10.3945/ajcn.115.119339'},
    mifflin90:{a:'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.',t:'A new predictive equation for resting energy expenditure in healthy individuals.',j:'American Journal of Clinical Nutrition, 1990;51(2):241–247.',u:'https://doi.org/10.1093/ajcn/51.2.241'},
    schoenfeld17v:{a:'Schoenfeld BJ, Ogborn D, Krieger JW.',t:'Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis.',j:'Journal of Sports Sciences, 2017;35(11):1073–1082.',u:'https://doi.org/10.1080/02640414.2016.1210197'},
    schoenfeld19f:{a:'Schoenfeld BJ, Grgic J, Krieger J.',t:'How many times per week should a muscle be trained to maximize muscle hypertrophy? A systematic review and meta-analysis of studies examining the effects of resistance training frequency.',j:'Journal of Sports Sciences, 2019;37(11):1286–1295.',u:'https://doi.org/10.1080/02640414.2018.1555906'},
    schoenfeld13t:{a:'Schoenfeld BJ, Aragon AA, Krieger JW.',t:'The effect of protein timing on muscle strength and hypertrophy: a meta-analysis.',j:'Journal of the International Society of Sports Nutrition, 2013;10:53.',u:'https://doi.org/10.1186/1550-2783-10-53'},
    lamon21:{a:'Lamon S, Morabito A, Arentson-Lantz E, et al.',t:'The effect of acute sleep deprivation on skeletal muscle protein synthesis and the hormonal environment.',j:'Physiological Reports, 2021;9(1):e14660.',u:'https://doi.org/10.14814/phy2.14660'},
    q_arnold:{a:'Arnold Schwarzenegger.',t:'Six Rules of Success (University of Southern California commencement address, 2009)',j:'Full transcript. The first sentence is from Rule 3 (Don’t be afraid to fail), the second from Rule 5 (Work your butt off).',u:'https://singjupost.com/dr-arnold-schwarzeneggers-6-rules-of-success-full-speech-transcript/'},
    q_haney:{a:'Rock Lockridge, Muscle & Strength.',t:'Lee Haney’s Top 10 Tips For Building Quality Muscle Mass',j:'Article, 2015 (updated 2020). Both lines are Haney’s own words, printed under “9. Mental attitude”.',u:'https://www.muscleandstrength.com/articles/lee-haney-top-10-muscle-building-tips'},
    q_heath:{a:'Sportskeeda.',t:'Phil Heath advocates for a strong mindset in gym training: “Forge an unshakeable mind”',j:'Article quoting Heath’s Instagram post and its caption (the article carries no date).',u:'https://www.sportskeeda.com/bodybuilding/news-phil-heath-advocates-strong-mindset-gym-training-forge-unshakeable-mind'},
    q_cutler:{a:'Doug Murray, Fitness Volt.',t:'4x Mr. Olympia Jay Cutler Busts the Biggest Misconception Around Pro Bodybuilding',j:'Article of 11 August 2026 quoting his JayCutlerTV YouTube video of 10 August 2026.',u:'https://fitnessvolt.com/jay-cutler-busts-misconception-around-bodybuilding/'},
    q_cbum:{a:'Belinda Evans, Fitness Volt.',t:'Chris Bumstead Talks “Structured Routines” & Self-Improvement Goals For 2024 Season',j:'Article of 5 January 2024 quoting his YouTube video. The two sentences are separate passages from it.',u:'https://fitnessvolt.com/chris-bumstead-2024-improvement-goals/'},
    q_dino:{a:'Doug Murray, Fitness Volt.',t:'Ramon Queiroz Issues Statement After Making History as the New 2025 Classic Physique Olympia',j:'Article of 13 October 2025 quoting his Instagram post of 12 October 2025. The “…” after “I requested” is in the post itself.',u:'https://fitnessvolt.com/?p=294018'},
    ph_cbum:{a:'Gymshark, 2021.',t:'Photo: “Chris Bumstead on Gymshark.jpg”',j:'CC BY 3.0, Wikimedia Commons (credit required). Cropped, background removed, a stray graphic line retouched, recoloured to navy.',u:'https://commons.wikimedia.org/wiki/File:Chris_Bumstead_on_Gymshark.jpg'},
    ph_dino:{a:'FotografoWallacyFerrari, 2025.',t:'Photo: “Ramon Dino shows his Mr. Olympia trophy with a sign with his photo (2025).jpg”',j:'CC BY 4.0, Wikimedia Commons (credit required). Cropped, background removed, recoloured to navy.',u:'https://commons.wikimedia.org/wiki/File:Ramon_Dino_shows_his_Mr._Olympia_trophy_with_a_sign_with_his_photo_(2025).jpg'},
    ph_arnold:{a:'Madison Square Garden Center (via RMY Auctions), 1974.',t:'Photo: “Arnold Schwarzenegger 1974.jpg”',j:'Public domain, Wikimedia Commons. Cropped, background removed, recoloured to navy.',u:'https://commons.wikimedia.org/wiki/File:Arnold_Schwarzenegger_1974.jpg'},
    ph_haney:{a:'Staff Sgt. Tracy J. Smith, Georgia National Guard, 2014.',t:'Photo: “Lee Haney 2014 2.jpg”',j:'Public domain (U.S. government work), Wikimedia Commons. Cropped, background removed, face contrast reduced so features show, recoloured to navy.',u:'https://commons.wikimedia.org/wiki/File:Lee_Haney_2014_2.jpg'},
    ph_heath:{a:'Entilzha, 2012.',t:'Photo: “Phil Heath.JPG”',j:'CC0 public-domain dedication, Wikimedia Commons. Cropped, background removed, face contrast reduced so features show, recoloured to navy.',u:'https://commons.wikimedia.org/wiki/File:Phil_Heath.JPG'},
    ph_cutler:{a:'Author not listed.',t:'Photo: “Jay Cutler at Muscle Beach 2007.jpg”',j:'Listed as public domain on Wikimedia Commons. Cropped, background removed, recoloured to navy.',u:'https://commons.wikimedia.org/wiki/File:Jay_Cutler_at_Muscle_Beach_2007.jpg'},
    psilander19:{a:'Psilander N, Eftestøl E, Cumming KT, et al.',t:'Effects of training, detraining, and retraining on strength, hypertrophy, and myonuclear number in human skeletal muscle.',j:'Journal of Applied Physiology, 2019;126(6):1636–1645.',u:'https://duo.uio.no/handle/10852/78161'},
    murphy22:{a:'Murphy C, Koehler K.',t:'Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression.',j:'Scandinavian Journal of Medicine & Science in Sports, 2022;32(1):125–137.',u:'https://doi.org/10.1111/sms.14075'},
    slater19:{a:'Slater GJ, Dieter BP, Marsh DJ, Helms ER, Shaw G, Iraki J.',t:'Is an energy surplus required to maximize skeletal muscle hypertrophy associated with resistance training?',j:'Frontiers in Nutrition, 2019;6:131.',u:'https://doi.org/10.3389/fnut.2019.00131'},
    roberts18:{a:'Roberts MD, Haun CT, Mobley CB, et al.',t:'Physiological differences between low versus high skeletal muscle hypertrophic responders to resistance exercise training: current perspectives and future research directions.',j:'Frontiers in Physiology, 2018;9:834.',u:'https://doi.org/10.3389/fphys.2018.00834'},
    moore09:{a:'Moore DR, Robinson MJ, Fry JL, et al.',t:'Ingested protein dose response of muscle and albumin protein synthesis after resistance exercise in young men.',j:'American Journal of Clinical Nutrition, 2009;89(1):161–168.',u:'https://doi.org/10.3945/ajcn.2008.26401'},
    macnaughton16:{a:'Macnaughton LS, et al.',t:'The response of muscle protein synthesis following whole-body resistance exercise is greater following 40 g than 20 g of ingested whey protein.',j:'Physiological Reports, 2016;4(15):e12893.',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4985555/'},
    trommelen23:{a:'Trommelen J, van Lieshout GAA, Nyakayiru J, et al.',t:'The anabolic response to protein ingestion during recovery from exercise has no upper limit in magnitude and duration in vivo in humans.',j:'Cell Reports Medicine, 2023;4(12):101324.',u:'https://doi.org/10.1016/j.xcrm.2023.101324'},
    helms14:{a:'Helms ER, Aragon AA, Fitschen PJ.',t:'Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation.',j:'Journal of the International Society of Sports Nutrition, 2014;11:20.',u:'https://doi.org/10.1186/1550-2783-11-20'},
    hector18:{a:'Hector AJ, Phillips SM.',t:'Protein recommendations for weight loss in elite athletes: a focus on body composition and performance.',j:'International Journal of Sport Nutrition and Exercise Metabolism, 2018;28(2):170–177.',u:'https://doi.org/10.1123/ijsnem.2017-0273'},
    iom05:{a:'Institute of Medicine.',t:'Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.',j:'Washington, DC: The National Academies Press, 2005. Its recommended dietary allowance for protein in adults is 0.8 g/kg per day.',u:'https://doi.org/10.17226/10490'},
    kreider17:{a:'Kreider RB, Kalman DS, Antonio J, et al.',t:'International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine.',j:'Journal of the International Society of Sports Nutrition, 2017;14:18.',u:'https://doi.org/10.1186/s12970-017-0173-z'},    guest21:{a:'Guest NS, VanDusseldorp TA, Nelson MT, et al.',t:'International Society of Sports Nutrition position stand: caffeine and exercise performance.',j:'Journal of the International Society of Sports Nutrition, 2021;18:1.',u:'https://doi.org/10.1186/s12970-020-00383-4'},
    trexler15:{a:'Trexler ET, Smith-Ryan AE, Stout JR, et al.',t:'International Society of Sports Nutrition position stand: beta-alanine.',j:'Journal of the International Society of Sports Nutrition, 2015;12:30.',u:'https://doi.org/10.1186/s12970-015-0090-y'},
    gonzalez20:{a:'Gonzalez AM, Trexler ET.',t:'Effects of citrulline supplementation on exercise performance in humans: a review of the current literature.',j:'Journal of Strength and Conditioning Research, 2020;34(5):1480–1495.',u:'https://doi.org/10.1519/JSC.0000000000003426'},
    gonzalez23:{a:'Gonzalez AM, Yang Y, Mangine GT, Pinzone AG, Ghigiarelli JJ, Sell KM.',t:'Acute effect of L-citrulline supplementation on resistance exercise performance and muscle oxygenation in recreationally resistance trained men and women.',j:'Journal of Functional Morphology and Kinesiology, 2023;8(3):88. A single 8 g dose did not improve isometric force, muscle endurance or muscle oxygenation.',u:'https://doi.org/10.3390/jfmk8030088'},
    marcus17:{a:'Marcus L, Soileau J, Judge LW, Bellar D.',t:'Evaluation of the effects of two doses of alpha glycerylphosphorylcholine on physical and psychomotor performance.',j:'Journal of the International Society of Sports Nutrition, 2017;14:39. 48 men; the 250 mg dose improved counter-movement jump velocity and power, with no group differences in most other tests.',u:'https://doi.org/10.1186/s12970-017-0196-5'},
    giesbrecht10:{a:'Giesbrecht T, Rycroft JA, Rowson MJ, De Bruin EA.',t:'The combination of L-theanine and caffeine improves cognitive performance and increases subjective alertness.',j:'Nutritional Neuroscience, 2010;13(6):283–290. 97 mg L-theanine with 40 mg caffeine improved task-switching accuracy and alertness versus placebo; no effect on visual search, choice reaction time or mental rotation.'},
    jongkees15:{a:'Jongkees BJ, Hommel B, Kühn S, Colzato LS.',t:'Effect of tyrosine supplementation on clinical and healthy populations under stress or cognitive demands: a review.',j:'Journal of Psychiatric Research, 2015.'}
  };
  var resCard=$('#resCard'),resList=$('#resList'),resFrom=null;
  function openRes(ids,hit,from){
    resList.innerHTML='';
    ids.forEach(function(id){
      var r=SRCS[id];if(!r)return;
      var li=document.createElement('li'),a=document.createElement('a'),sp=document.createElement('span');
      if(r.u){a.href=r.u;a.target='_blank';a.rel='noopener noreferrer';}
      a.textContent=r.t;
      sp.textContent=r.a+' '+r.j;
      li.appendChild(a);li.appendChild(sp);if(id===hit)li.className='hit';
      resList.appendChild(li);
    });
    resFrom=from||null;resOpen=true;resCard.classList.add('open');
    var h=resList.querySelector('.hit');if(h&&h.scrollIntoView)h.scrollIntoView({block:'nearest'});
    $('#resClose').focus();
  }
  function closeRes(){
    if(!resOpen)return;resOpen=!!window.__pwOpen;resCard.classList.remove('open');
    if(resFrom&&resFrom.focus)resFrom.focus();resFrom=null;
  }
  $('#resClose').addEventListener('click',closeRes);
  resCard.addEventListener('click',function(e){if(e.target===resCard)closeRes();});
  window.addEventListener('keydown',function(e){if(e.key==='Escape')closeRes();});
  function pgIds(el){var pg=el.closest('.pg')||el.closest('.mc');var v=pg&&pg.getAttribute('data-res');return v?v.split(','):[];}
  function citeInit(root){$$('a.cite',root||document).forEach(function(a){a.setAttribute('role','button');a.tabIndex=0;});}
  citeInit();
  document.addEventListener('click',function(e){
    var c=e.target.closest&&e.target.closest('a.cite');
    if(c){e.preventDefault();openRes(pgIds(c),c.getAttribute('data-r'),c);return;}
    var b=e.target.closest&&e.target.closest('.srcb');
    if(b){e.preventDefault();openRes(pgIds(b),null,b);}
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;
    var c=e.target;if(c&&c.matches&&c.matches('a.cite')){e.preventDefault();openRes(pgIds(c),c.getAttribute('data-r'),c);}
  });

  /* ---------------- animated numbers ---------------- */
  function fmtNum(el,v){
    var dec=+el.getAttribute('data-dec')||0,to=+el.getAttribute('data-to');
    var t=dec?v.toFixed(dec):(to>=1000?fmtInt(v):String(Math.round(v)));
    return (el.getAttribute('data-pre')||'')+t+(el.getAttribute('data-suf')||'');
  }
  function runCounters(root){
    $$('[data-to]',root).forEach(function(el,n){
      var to=+el.getAttribute('data-to'),tok=(el._tok=(el._tok||0)+1),t0=performance.now()+80*n,dur=1200;
      if(reduce){el.textContent=fmtNum(el,to);return;}
      el.textContent=fmtNum(el,0);
      (function step(now){
        if(el._tok!==tok)return;
        var f=clamp((now-t0)/dur,0,1),e=1-Math.pow(1-f,3);
        el.textContent=fmtNum(el,to*e);
        if(f<1)requestAnimationFrame(step);
      })(performance.now());
    });
  }
  function resetCounters(root){$$('[data-to]',root).forEach(function(el){el._tok=(el._tok||0)+1;el.textContent=fmtNum(el,0);});}

  /* ---------------- pages ---------------- */
  /* Every card is a header plus a scrolling area (.pgs) that holds its pages; only the page on screen takes space. A page may have a small card of its own (.mc, data-pg = page number from 0)
     for a big infographic; that card is shown only while its page is on screen. */
  var cards=[],allCards=[];
  function pgEls(pg){var o=[pg];if(pg._mini)o.push(pg._mini);if(pg._leg)o.push(pg._leg);return o;}
  function miniShow(pg,on){if(pg._mini)pg._mini.classList.toggle('show',on);if(pg._leg)pg._leg.classList.toggle('show',on);}
  function setGo(pg,on){pgEls(pg).forEach(function(e){e.classList.toggle('go',on);});}
  function pageSwitch(S,i){
    i=clamp(i,0,S.n-1);if(i===S.i)return;
    var old=S.pgs[S.i],pg=S.pgs[i];
    S.card.setAttribute('data-dir',i>S.i?'n':'p');
    old.classList.remove('on');setGo(old,false);resetCounters(old);miniShow(old,false);
    var oi=S.i;S.i=i;pg.classList.add('on');miniShow(pg,true);S.card.parentNode.classList.toggle('has-mini',!!pg._mini);S.card.parentNode.classList.toggle('tall',!!(pg._leg||pg.hasAttribute('data-tall')));
    S.box.scrollTop=0;
    updPager(S);fitCard(S);
    if(S.card._car)S.card._car.go(i,i>oi?1:-1);
    flipPage(S,pg);
    requestAnimationFrame(function(){if(S.live){setGo(pg,true);runCounters(pg);pageEnter(pg);}});
  }
  function updPager(S){
    if(!S.paged)return;
    $('.pgn',S.card).innerHTML='<b>'+(S.i+1)+'</b> / '+S.n;
    $('.pgn',S.card).setAttribute('aria-label','Page '+(S.i+1)+' of '+S.n);
    $('.prev',S.card).disabled=S.i===0;$('.next',S.card).disabled=S.i===S.n-1;
  }
  function flipPage(S,pg){
    if(reduce)return;
    layoutChars(S.s);
    var list=chars[S.s][S.k].filter(function(c){return pg.contains(c.el);}),seed=S.s*31+S.k*7;
    list.forEach(function(c){c.l=-9;});
    setChars(list,0,seed);
    var t0=performance.now(),dur=900;
    (function step(now){
      var pb=clamp((now-t0)/dur,0,1);setChars(list,pb,seed);
      if(pb<1)requestAnimationFrame(step);
    })(t0);
  }

  /* ---- fitting a card to the screen ----
     A card is as tall as its page. If the page is taller than the screen allows, the scrolling area gets a height that ends in the middle of a line of text that runs across the card
     (the cut line is drawn there) and snap points are put at the same height at every scroll position, so the line always cuts through a text line, never between two. */
  function textLines(S,pg){
    var box=S.box,br=box.getBoundingClientRect(),base=br.top-box.scrollTop,rects=[],w=pg.offsetWidth||1;
    function add(r,el){if(r.width>1&&r.height>2)rects.push({t:r.top-base,b:r.bottom-base,l:r.left,r:r.right,pr:!!(el&&el.closest('p,li,blockquote')&&!el.closest('.stat,.trio'))});}
    [].forEach.call(pg.querySelectorAll('.wd'),function(e){add(e.getBoundingClientRect(),e);});
    var tw=document.createTreeWalker(pg,NodeFilter.SHOW_TEXT,null),n,rg=document.createRange();
    while((n=tw.nextNode())){
      if(!/\S/.test(n.nodeValue))continue;
      var pe=n.parentElement;if(!pe||pe.closest('.wd,svg,select,option,script,style,textarea'))continue;
      rg.selectNodeContents(n);[].forEach.call(rg.getClientRects(),function(r){add(r,pe);});
    }
    rects.sort(function(a,b){return a.t-b.t;});
    var lines=[];
    rects.forEach(function(r){
      var L=lines[lines.length-1];
      if(L&&Math.abs((r.t+r.b)/2-(L.t+L.b)/2)<Math.min(r.b-r.t,L.b-L.t)*.45){L.t=Math.min(L.t,r.t);L.b=Math.max(L.b,r.b);L.l=Math.min(L.l,r.l);L.r=Math.max(L.r,r.r);L.pr=L.pr&&r.pr;}
      else lines.push({t:r.t,b:r.b,l:r.l,r:r.r,pr:r.pr});
    });
    lines.forEach(function(L){L.mid=(L.t+L.b)/2;L.full=(L.r-L.l)>=w*.75;L.prose=L.full&&L.pr;});
    return lines;
  }
  function fitCard(S){
    var card=S.card,box=S.box,pg=S.pgs[S.i],st=stages[S.s],panel=card.parentNode,pn=panelEls[S.s];
    if(!card.offsetWidth)return;
    var keep=pn.style.transform,y0=box.scrollTop;pn.style.transform='none';
    [].forEach.call(box.querySelectorAll('.sn'),function(e){box.removeChild(e);});
    box.style.height='';box.classList.remove('snap');
    var cs=getComputedStyle(st),avail=st.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),pcs=getComputedStyle(panel);
    if(/px$/.test(pcs.maxHeight))avail=Math.min(avail,parseFloat(pcs.maxHeight));
    var gap=parseFloat(pcs.rowGap)||0;
    if(!panel.classList.contains('multi')){
      [].forEach.call(panel.children,function(c){if(c!==card&&c.offsetHeight)avail-=c.offsetHeight+gap;});
    }else if(pcs.flexDirection==='column'){      // phones: the two product cards are stacked and share the height; a card that needs less leaves its room to the other
      var half=(avail-gap)/2,sib=null;[].forEach.call(panel.children,function(c){if(c!==card&&c._st)sib=c._st;});
      var sibNat=sib?(sib.card.offsetHeight-sib.box.offsetHeight+sib.pgs[sib.i].offsetHeight):half;
      avail=Math.max(half,avail-gap-Math.min(sibNat,half));
    }
    var natural=pg.offsetHeight,room=avail-(card.offsetHeight-box.offsetHeight),H=0,snaps=null;
    S.scroll=false;
    if(natural>room+.5&&room>40){
      var lines=textLines(S,pg),tiers=[lines.filter(function(L){return L.prose;}),lines.filter(function(L){return L.full;}),lines];   // best: a full line of a paragraph or list; then any full-width line; then any line
      for(var t=0;t<3&&!H;t++){
        var best=0;tiers[t].forEach(function(L){if(L.mid<=room&&L.mid>best)best=L.mid;});
        if(best>=room*.55){H=best;snaps=tiers[t];}
      }
      if(!H){H=Math.floor(room);}
      box.style.height=H+'px';S.scroll=true;
      var mx=natural-H;
      if(snaps){
        var pos=[0,mx];snaps.forEach(function(L){var q=L.mid-H;if(q>1&&q<mx-1)pos.push(Math.round(q*10)/10);});
        pos.sort(function(a,b){return a-b;});
        var kp=[];pos.forEach(function(q){
          if(kp.length&&q-kp[kp.length-1]<10){if(q===mx)kp[kp.length-1]=q;return;}
          kp.push(q);
        });
        kp.forEach(function(q){var m=document.createElement('i');m.className='sn';m.style.top=q+'px';box.appendChild(m);});
        box.classList.add('snap');
      }
    }
    pn.style.transform=keep;
    box.scrollTop=Math.min(y0,Math.max(0,box.scrollHeight-box.clientHeight));
    updCut(S);
  }
  function updCut(S){S.card.classList.toggle('cut',!!S.scroll&&S.box.scrollTop<S.box.scrollHeight-S.box.clientHeight-1);}
  var fitQ=0,fitSet={};
  function schedFit(S){
    fitSet[S.s+'_'+S.k]=S;
    if(fitQ)return;
    fitQ=requestAnimationFrame(function(){fitQ=0;var f=fitSet;fitSet={};Object.keys(f).forEach(function(k){fitCard(f[k]);});});
  }
  function fitAll(){allCards.forEach(fitCard);}
  var fitRO=window.ResizeObserver?new ResizeObserver(function(es){es.forEach(function(e){var S=e.target._S;if(S)schedFit(S);});}):null;

  $$('.sec').forEach(function(card){
    var pgs=$$('.pg',card),box=$('.pgs',card),st=card.closest('.stage'),s=stages.indexOf(st),k=blocks[s].indexOf(box);
    var minis=$$('.mc',card.parentNode);
    var S={card:card,pgs:pgs,n:pgs.length,i:0,s:s,k:k,box:box,live:false,paged:pgs.length>1,scroll:false,minis:minis};
    card._st=S;allCards.push(S);
    minis.forEach(function(m){var n=+m.getAttribute('data-pg');if(pgs[n]){if(m.classList.contains('legend'))pgs[n]._leg=m;else pgs[n]._mini=m;m._S=S;}});
    miniShow(pgs[0],true);
    box.addEventListener('scroll',function(){updCut(S);},{passive:true});
    if(fitRO){pgs.forEach(function(p){p._S=S;fitRO.observe(p);});minis.forEach(function(m){m._S=S;fitRO.observe(m);});}
    if(!S.paged)return;
    cards.push(S);updPager(S);
    S.navs=$$('.nav',card);
    function used(){S.navs.forEach(function(b){b.classList.remove('hint');});}      // the arrows nudge until they are first pressed
    $('.prev',card).addEventListener('click',function(){used();pageSwitch(S,S.i-1);});
    $('.next',card).addEventListener('click',function(){used();pageSwitch(S,S.i+1);});
  });
  fitAll();window.addEventListener('resize',fitAll);
  window.addEventListener('load',fitAll);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitAll);
  /* called by the frame loop when a stage's card is fully in (on) and when it has fully gone (off) */
  function onStageLive(s,on){
    cards.forEach(function(S){
      if(S.s!==s)return;
      S.live=!!on;
      var pg=S.pgs[S.i];
      if(on){setGo(pg,true);runCounters(pg);pageEnter(pg);}
      else{S.pgs.forEach(function(p){setGo(p,false);resetCounters(p);});S.navs.forEach(function(b){b.classList.add('hint');});}
    });
  }
  /* the stage is on its way out (its card is less than half in) */
  function onStageLeave(s){if(s===1)resetBody();}
  /* pages with their own motion hook into this */
  var enterHooks=[];
  function pageEnter(pg){enterHooks.forEach(function(h){h(pg);});}

  /* body: region highlight. Particles keep their muscle region through every pose, so a lit muscle can be followed as the figure moves. */
  var BODY={
    1:['Trapezius','Raises, pulls back and rotates the shoulder blade. It is the diamond across the neck, shoulders and mid-back.'],
    2:['Deltoid','Three heads raise the arm to the front, side and back.'],
    3:['Biceps brachii','Bends the elbow and turns the forearm palm up. It is the peak you see in a double biceps pose.'],
    4:['Forearm flexors and extensors','Close the hand, bend the wrist and drive grip strength.'],
    5:['Pectorals','Pull the arm across the body and push it forward. The chest is the base of every press.'],
    6:['Rectus abdominis','Bends the spine forward and braces the trunk. The blocks are tendon bands, not separate muscles.'],
    7:['Quadriceps','Four muscles that straighten the knee. They are the largest muscle group in the front of the body.'],
    8:['Gastrocnemius and soleus','Point the foot and push off the ground. The soleus works hard even when you stand.']
  };
  var bodyInfo=$('#bodyInfo');
  toggleGroup($('#chipsBody'),'data-reg',function(v){
    setRegion(v);
    if(v===0)setInfo(bodyInfo,'Select a muscle','It lights up on the figure.');
    else setInfo(bodyInfo,BODY[v][0],BODY[v][1]);
  });
  /* leaving the stage clears the selection: nothing stays lit */
  function resetBody(){
    $$('#chipsBody button').forEach(function(b){b.setAttribute('aria-pressed','false');});
    setInfo(bodyInfo,'Select a muscle','It lights up on the figure.');
    setRegion(0);
  }

  /* sarcomere diagram */
  var contract=$('#contract'),contractOut=$('#contractOut'),sarcSvg=$('#sarcSvg'),fireOn=false;
  function drawSarc(s){
    var L=2.5-.7*s,px=112,cx=180,zl=cx-L/2*px,zr=cx+L/2*px,out='';
    var actY=[14,44,74,104,134],myoY=[29,59,89,119];
    out+='<line class="ml" x1="180" y1="4" x2="180" y2="144"/>';
    actY.forEach(function(y){
      out+='<line class="aa" x1="'+zl.toFixed(1)+'" y1="'+y+'" x2="'+(zl+px).toFixed(1)+'" y2="'+y+'"/>';
      out+='<line class="aa" x1="'+(zr-px).toFixed(1)+'" y1="'+y+'" x2="'+zr.toFixed(1)+'" y2="'+y+'"/>';
    });
    myoY.forEach(function(y){out+='<line class="mm" x1="'+(cx-89.6)+'" y1="'+y+'" x2="'+(cx+89.6)+'" y2="'+y+'"/>';});
    out+='<line class="zd" x1="'+zl.toFixed(1)+'" y1="4" x2="'+zl.toFixed(1)+'" y2="144"/><line class="zd" x1="'+zr.toFixed(1)+'" y1="4" x2="'+zr.toFixed(1)+'" y2="144"/>';
    sarcSvg.innerHTML=out;
  }
  function sarc(v){
    var s=v/100,L=2.5-.7*s;
    contractOut.textContent=Math.round(v)+'%';
    $('#rdL').textContent=L.toFixed(2)+' µm';
    $('#rdI').textContent=Math.max(0,L-1.6).toFixed(2)+' µm';
    $('#rdH').textContent=Math.max(0,L-2.0).toFixed(2)+' µm';
    setSlider(contract);drawSarc(s);
  }
  contract.addEventListener('input',function(){fireOn=false;sarc(+contract.value);});
  $('#fire').addEventListener('click',function(){
    if(fireOn)return;fireOn=true;var st=performance.now(),dur=1700;
    (function step(now){
      if(!fireOn)return;
      var f=(now-st)/dur;if(f>=1){contract.value=0;sarc(0);fireOn=false;return;}
      var v=f<.4?sstep(0,.4,f):1-sstep(.55,1,f);
      contract.value=Math.round(v*100);sarc(v*100);requestAnimationFrame(step);
    })(st);
  });
  sarc(0);

  /* grow or shrink: fiber cross-section diagram */
  var hexSvg=$('#hexSvg'),cells=[];
  (function(){
    var out='';
    for(var q=-3;q<=3;q++)for(var rr=-3;rr<=3;rr++){
      if(Math.abs(q+rr)>3)continue;
      cells.push({x:q+rr/2,y:rr*Math.sqrt(3)/2,a:[(q*7+rr*3)%6,(q*5+rr*11)%6+1.2,(q*3+rr*7)%6+2.4]});
    }
    cells.forEach(function(c,n){
      out+='<circle class="fb" id="fb'+n+'" cx="'+c.x.toFixed(3)+'" cy="'+c.y.toFixed(3)+'" r=".4"/>';
      c.a.forEach(function(a,k){out+='<circle class="nu" id="nu'+n+'_'+k+'" cx="'+c.x.toFixed(3)+'" cy="'+c.y.toFixed(3)+'" r=".045"/>';});
    });
    hexSvg.innerHTML=out;
  })();
  function drawHex(net){
    var rad=.38*(1+.3*net),w=(net+1)/2;
    var r=Math.round(64+(255-64)*w),g=Math.round(102+(116-102)*w),b=Math.round(204+(71-204)*w);
    var fill='rgba('+r+','+g+','+b+',.3)',stroke='rgb('+r+','+g+','+b+')';
    var th=[-9,.15,.5];
    cells.forEach(function(c,n){
      var fb=document.getElementById('fb'+n);
      fb.setAttribute('r',rad.toFixed(3));fb.setAttribute('fill',fill);fb.setAttribute('stroke',stroke);
      c.a.forEach(function(a,k){
        var nu=document.getElementById('nu'+n+'_'+k);
        nu.setAttribute('cx',(c.x+Math.cos(a)*rad*.86).toFixed(3));
        nu.setAttribute('cy',(c.y+Math.sin(a)*rad*.86).toFixed(3));
        nu.setAttribute('opacity',net>=th[k]?'1':'0');
      });
    });
  }
  var inT=$('#inTrain'),inP=$('#inProt'),inE=$('#inEn');
  var lab3=function(v,a,b,c){return v<34?a:(v<67?b:c);};
  var tier3=function(v){return v<34?0:(v<67?1:2);};

  /* Text that changes with a widget does not just swap: the new sentence is decoded letter by letter, the same random-letter flip the page text uses (about half a second).
     Only text nodes are touched while it runs, so links inside the sentence keep working. */
  function citeA(id,label){return '<a class="cite" data-r="'+id+'">'+label+'</a>';}
  function swapHTML(el,html){
    if(el._h===html)return;var first=el._h===undefined;el._h=html;
    var tk=el._tk=(el._tk||0)+1;
    el.innerHTML=html;citeInit(el);
    if(reduce||first||!el.offsetParent)return;
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),nodes=[],n,tot=0;
    while((n=w.nextNode())){if(/\S/.test(n.nodeValue)){nodes.push({n:n,t:n.nodeValue,s:[]});tot+=n.nodeValue.length;}}
    var dur=Math.min(900,420+tot*2.4),t0=performance.now(),k=0,FL=3,FT=48;
    nodes.forEach(function(o){for(var i=0;i<o.t.length;i++)o.s[i]=(k++/Math.max(1,tot))*dur*.62+Math.random()*70;});
    var UPc='ABCDEFGHIJKLMNOPQRSTUVWXYZ',LOc='abcdefghijklmnopqrstuvwxyz',DGc='0123456789';
    function rnd(c){return /[A-Z]/.test(c)?UPc.charAt(Math.random()*26|0):(/[a-z]/.test(c)?LOc.charAt(Math.random()*26|0):DGc.charAt(Math.random()*10|0));}
    (function step(now){
      if(el._tk!==tk)return;
      var e0=now-t0,live=false;
      nodes.forEach(function(o){
        var out='';
        for(var i=0;i<o.t.length;i++){
          var c=o.t.charAt(i);
          if(!/[A-Za-z0-9]/.test(c)){out+=c;continue;}
          var e=e0-o.s[i];
          if(e>=FL*FT){out+=c;}else{live=true;out+=rnd(c);}
        }
        if(o.n.nodeValue!==out)o.n.nodeValue=out;
      });
      if(live)requestAnimationFrame(step);
      else nodes.forEach(function(o){o.n.nodeValue=o.t;});
    })(t0);
  }

  /* Grow or shrink. The sentence under the sliders is chosen from published findings: the lead says which way the balance tips, and the second sentence is the research behind the weakest of the three
     inputs (or, when all three are strong, behind the one with a downside). Every claim is in the sources list of the card. */
  var GT=[
    'Stop training and size fades: after 10 weeks of leg training and then 20 weeks off, muscle size was back to baseline while strength stayed higher ('+citeA('psilander19','Psilander et al., 2019')+').',
    'More weekly sets have gone with more growth: across 15 studies each extra weekly set was linked to about 0.37% more muscle gain ('+citeA('schoenfeld17v','Schoenfeld et al., 2017')+').',
    'Hard training with many weekly sets has gone furthest: the same analysis found a graded dose-response, though only two of its studies used trained lifters ('+citeA('schoenfeld17v','Schoenfeld et al., 2017')+').'
  ];
  var GP=[
    'Low protein holds growth back: across 49 trials, adding protein increased the fat-free mass gained from training ('+citeA('morton18','Morton et al., 2018')+').',
    'Protein in the 1.4 to 2.0 g/kg range is enough for most exercising people ('+citeA('jager17','Jäger et al., 2017')+').',
    'Past about 1.6 g/kg a day, extra protein added no further fat-free mass in pooled trials ('+citeA('morton18','Morton et al., 2018')+').'
  ];
  var GE=[
    'A calorie deficit cuts the lean mass gained from training, though strength still rises. A deficit of 500 kcal a day or less did not appear to reduce it ('+citeA('murphy22','Murphy and Koehler, 2022')+').',
    'Muscle can be built without a surplus, most likely in people new to lifting or with more body fat. Whether trained lifters need one is not settled ('+citeA('slater19','Slater et al., 2019')+').',
    'A surplus of 10 to 20% is the usual range. In elite athletes, a surplus of about 500 kcal added more fat than eating freely, with no clear extra lean mass ('+citeA('iraki19','Iraki et al., 2019')+').'
  ];
  var GL={grow:['All three inputs favor growth. Fibers thicken, and extra dots show in the sketch.','Synthesis is ahead of breakdown. Fibers thicken, but one input holds the rate back.'],
          hold:['Enough signal to keep what you have, not enough to add.'],
          shrink:['Breakdown edges ahead. Fibers thin slowly.','Breakdown is winning. Fibers thin out.']};
  function growUpd(){
    var tr=inT.value/100,pr=inP.value/100,en=inE.value/100;
    $('#outTrain').textContent=lab3(inT.value,'None','Moderate','Hard');
    $('#outProt').textContent=lab3(inP.value,'Low','Adequate','High');
    $('#outEn').textContent=lab3(inE.value,'Deficit','Maintenance','Surplus');
    [inT,inP,inE].forEach(setSlider);
    var def=Math.max(0,.5-en)*2,sur=Math.max(0,en-.5)*2;
    var ef=clamp(.75+.25*sur-.35*def,.3,1);
    var gain=tr*(.45+.55*pr)*ef;
    var loss=(1-pr)*.2+def*.45*(1-.55*pr)+(1-tr)*.08;
    var net=clamp((gain-loss)*1.5,-1,1);
    var st=net>.2?'grow':(net<-.2?'shrink':'hold');
    $('#verdict').setAttribute('data-state',st);
    $('#vWord').textContent=st==='grow'?'Growing':(st==='shrink'?'Shrinking':'Holding');
    var t=[tier3(inT.value),tier3(inP.value),tier3(inE.value)],weak=0,k;
    for(k=1;k<3;k++)if(t[k]<t[weak])weak=k;
    var lead,ev;
    if(st==='grow'){var allHi=t[0]===2&&t[1]===2&&t[2]===2;lead=GL.grow[allHi||net>.6&&t[weak]>0?0:1];if(allHi)weak=2;}
    else if(st==='shrink')lead=GL.shrink[net<-.6?1:0];
    else lead=GL.hold[0];
    ev=[GT,GP,GE][weak][t[weak]];
    swapHTML($('#vText'),lead+' '+ev);
    drawHex(net);
  }
  [inT,inP,inE].forEach(function(el){el.addEventListener('input',growUpd);});
  growUpd();
  /* the verdict box keeps the height of its longest possible text, so the cards do not jump while a slider is dragged */
  function reserveV(){
    var sp=$('#vText'),box=sp.parentNode,v=$('#verdict');
    if(!v.offsetParent||!box.offsetWidth)return;
    if(innerWidth<=560){box.style.minHeight='';return;}
    var probe=box.cloneNode(true),ps=probe.querySelector('#vText'),mx=0,i,j,leads=[].concat(GL.grow,GL.hold,GL.shrink),evs=[].concat(GT,GP,GE);
    ps.removeAttribute('id');probe.removeAttribute('id');
    probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;min-height:0;width:'+box.getBoundingClientRect().width+'px';
    box.style.minHeight='';v.appendChild(probe);
    for(i=0;i<leads.length;i++)for(j=0;j<evs.length;j++){ps.innerHTML=leads[i]+' '+evs[j];if(probe.offsetHeight>mx)mx=probe.offsetHeight;}
    v.removeChild(probe);box.style.minHeight=Math.ceil(mx)+'px';
  }
  enterHooks.push(function(pg){if(pg._mini&&pg._mini.contains($('#verdict')))requestAnimationFrame(reserveV);});
  window.addEventListener('resize',function(){requestAnimationFrame(reserveV);});

  /* ---------------- nutrition: your numbers ---------------- */
  var cSex=$('#cSex'),cAge=$('#cAge'),cAct=$('#cAct'),cH=$('#cH'),cW=$('#cW'),gSlide=$('#gSlide'),units=1,calcLive=false;
  var RING=2*Math.PI*36;
  function arc(id,from,len){
    var el=$(id);el.setAttribute('stroke-dasharray',(len*RING).toFixed(2)+' '+(RING-len*RING+.01).toFixed(2));
    el.setAttribute('stroke-dashoffset',(-from*RING).toFixed(2));
  }
  var r10=function(n){return Math.round(n/10)*10;};
  /* goal zones on the slider: 0 to 24 lean, 25 to 75 maintenance, 76 to 100 grow (the page-two variants are data-goal 3, 2, 1) */
  var ZNAME={1:'Grow',2:'Maintenance',3:'Lean'};
  function zoneOf(v){return v<25?3:(v>75?1:2);}
  function showZone(z){$$('#goalPg .gv').forEach(function(g){g.hidden=(+g.getAttribute('data-goal')!==z);});$('#goalPg').setAttribute('data-res',($('#goalPg .gv:not([hidden])')||{getAttribute:function(){return '';}}).getAttribute('data-res'));}

  /* The numbers under the lines on the goal page. The ranges above the lines are what the research gives; these boxes hold the numbers the plan is calculated from. Out-of-range or empty
     entries are flagged and the plan keeps the last valid number. */
  var NI={sur:$('#inSur'),rate:$('#inRate'),pG:$('#inProtG'),pM:$('#inProtM'),meal:$('#inMeal'),loss:$('#inLoss'),pL:$('#inProtL')};
  var NLIM={sur:[0,40],rate:[0,1.5],pG:[.2,4],pM:[.2,4],meal:[5,150],loss:[.1,2],pL:[.2,4]};
  var NV={},NBAD={};
  function readNI(k){
    var el=NI[k],v=parseFloat(String(el.value).replace(',','.')),lim=NLIM[k],ok=isFinite(v)&&v>=lim[0]&&v<=lim[1];
    el.setAttribute('aria-invalid',ok?'false':'true');el.classList.toggle('bad',!ok);NBAD[k]=!ok;
    if(ok)NV[k]=v;return ok;
  }
  Object.keys(NI).forEach(function(k){
    readNI(k);
    NI[k].addEventListener('input',function(){readNI(k);calc();});
    NI[k].addEventListener('blur',function(){if(NBAD[k]){NI[k].value=NV[k];readNI(k);calc();}});
    NI[k].addEventListener('keydown',function(e){e.stopPropagation();});
  });
  var fmtN=function(v){return String(+v.toFixed(2));};
  var fmtP=function(v){var t=fmtN(v);return t.indexOf('.')<0?t+'.0':t;};
  var ZR={1:[1.6,2.2,'iraki19','Iraki et al., 2019'],2:[1.4,2.0,'jager17','Jäger et al., 2017'],3:[1.6,2.4,'hector18','Hector and Phillips, 2018']};
  function mass(kgv){return units===2?(kgv*2.20462).toFixed(1)+' lb':kgv.toFixed(1)+' kg';}
  function badLine(zKeys){
    for(var i=0;i<zKeys.length;i++){var k=zKeys[i];if(NBAD[k])return 'Enter a number from '+NLIM[k][0]+' to '+NLIM[k][1]+' in the box you are editing. The plan keeps your last good number, '+fmtN(NV[k])+'. ';}
    return '';
  }
  /* protein per kg of body weight, against the range for the goal */
  function protSent(p,z){
    var R=ZR[z],lo=R[0].toFixed(1),hi=R[1].toFixed(1),c=citeA(R[2],R[3]),ps=fmtP(p),rd=citeA('iom05','IOM, 2005');
    if(p<.8)return ps+' g/kg is below the 0.8 g/kg a day recommended allowance for healthy adults ('+rd+') and under the '+lo+' to '+hi+' g/kg given for this goal ('+c+').';
    if(p<R[0])return ps+' g/kg is above the 0.8 g/kg adult allowance ('+rd+') but under the '+lo+' to '+hi+' g/kg given for this goal ('+c+'). '+(z===3
      ?'In one trial with a large energy deficit and hard training, 2.4 g/kg gave more lean mass and more fat loss than 1.2 g/kg ('+citeA('longland16','Longland et al., 2016')+').'
      :'In pooled trials, gains from protein leveled off at about 1.6 g/kg a day, so there may still be benefit to gain below that ('+citeA('morton18','Morton et al., 2018')+').');
    if(p<=R[1])return ps+' g/kg is inside the '+lo+' to '+hi+' g/kg range '+(z===2?'the International Society of Sports Nutrition gives as enough for most exercising people':(z===1?'suggested for bodybuilders in a surplus':'advised for athletes losing weight, well above the 0.8 g/kg allowance'))+' ('+c+').';
    return ps+' g/kg is above the '+lo+' to '+hi+' g/kg range ('+c+'). In pooled trials, intakes above about 1.6 g/kg gave no further fat-free mass ('+citeA('morton18','Morton et al., 2018')+'). In the plan the extra protein takes calories from carbohydrate.'
      +(z===3&&p>2.4?' Lean athletes in a deficit have been advised 2.3 to 3.1 g per kg of lean mass ('+citeA('helms14','Helms et al., 2014')+'). At 12% body fat that is about 2.0 to 2.7 g per kg of body weight.':'');
  }
  function mealSent(m,pg){
    var o,c1=citeA('jager17','Jäger et al., 2017');
    if(m<20)o=fmtN(m)+' g a meal is under the 20 to 40 g (about 0.25 g/kg) in the ISSN position stand ('+c1+'). In young men, protein synthesis after leg training rose with the dose up to 20 g ('+citeA('moore09','Moore et al., 2009')+').';
    else if(m<=40)o=fmtN(m)+' g a meal is inside the 20 to 40 g range ('+c1+'). In young men, 20 g gave the biggest rise in synthesis after leg training in one study ('+citeA('moore09','Moore et al., 2009')+'), and 40 g gave a bigger rise than 20 g after whole-body training in another ('+citeA('macnaughton16','Macnaughton et al., 2016')+').';
    else o=fmtN(m)+' g a meal is above the usual 20 to 40 g. Larger doses have kept raising the response: 100 g gave a bigger and longer synthesis response than 25 g, lasting over 12 hours ('+citeA('trommelen23','Trommelen et al., 2023')+').';
    if(pg>0){
      var n=pg/m,nn=Math.max(1,Math.round(n));
      o+=' At '+fmtN(m)+' g a meal, '+fmtInt(pg)+' g a day is about '+nn+(nn===1?' meal.':' meals.');
      if(n>6.5)o+=' That is more than the 3 to 6 meals suggested for bodybuilders ('+citeA('iraki19','Iraki et al., 2019')+'), so bigger doses would be easier.';
      else if(n<2.5)o+=' That is fewer than the 3 to 6 meals suggested for bodybuilders ('+citeA('iraki19','Iraki et al., 2019')+'), so smaller doses would spread it out.';
    }
    return o;
  }
  function surSent(sv,maint){
    var o,ci=citeA('iraki19','Iraki et al., 2019'),kc=maint>0?' That is about '+fmtInt(r10(maint*sv/100))+' kcal a day above maintenance.':'';
    if(sv<1)return 'No surplus means eating at maintenance. Muscle can still be built that way, most likely in people new to lifting or with more body fat ('+citeA('slater19','Slater et al., 2019')+').';
    if(sv<10)o=fmtN(sv)+'% is under the 10 to 20% surplus given for bodybuilders ('+ci+'). A smaller surplus is a fair start: Slater et al. advise starting conservatively and adjusting by body composition and strength ('+citeA('slater19','Slater et al., 2019')+').';
    else if(sv<=20)o=fmtN(sv)+'% is inside the 10 to 20% surplus suggested for bodybuilders in the off-season ('+ci+').';
    else o=fmtN(sv)+'% is above the 10 to 20% surplus range. In elite athletes, a surplus of about 500 kcal produced more fat gain (1.1 kg against 0.2 kg) than eating freely, and the lean-mass difference was not significant. The review suggests a smaller surplus for trained athletes ('+ci+').';
    return o+kc;
  }
  function rateSent(r,kg){
    var ci=citeA('iraki19','Iraki et al., 2019'),w=kg>0?' At your weight that is about '+mass(kg*r/100)+' a week.':'';
    if(r<.25)return fmtN(r)+'% a week is slower than the 0.25 to 0.5% given for novice and intermediate lifters. The same review advises advanced lifters to be more conservative ('+ci+').'+w;
    if(r<=.5)return fmtN(r)+'% a week is inside the 0.25 to 0.5% range for novice and intermediate lifters ('+ci+').'+w;
    return fmtN(r)+'% a week is faster than the 0.25 to 0.5% range for novice and intermediate lifters. The same review calls a gain of 2 kg a month possibly excessive for advanced lifters ('+ci+').'+w;
  }
  function lossSent(l,kg,capped){
    var ch=citeA('helms14','Helms et al., 2014'),cg=citeA('garthe11','Garthe et al., 2011'),w=kg>0?' At your weight that is about '+mass(kg*l/100)+' a week.':'',o;
    if(l<.5)o=fmtN(l)+'% a week is slower than the 0.5 to 1% suggested for keeping muscle ('+ch+'). Slower loss takes longer, and the studies cited here did not test rates this low.';
    else if(l<=1)o=fmtN(l)+'% a week is inside the 0.5 to 1% range ('+ch+'). In elite athletes, losing 0.7% a week raised lean mass and cut more fat than 1.4% a week ('+cg+').';
    else o=fmtN(l)+'% a week is faster than 0.5 to 1%. Faster loss raises the risk of losing lean mass, more so as you get leaner ('+ch+'). In elite athletes, the 1.4% a week group showed no significant lean-mass change and lost less fat than the 0.7% group ('+cg+').';
    o+=w;
    if(capped)o+=' Calories are not set lower than 25% under maintenance here, so the real loss would be slower than this.';
    return o;
  }
  function calc(){
    var imp=units===2,w=+cW.value,h=+cH.value,a=+cAge.value,v=+gSlide.value;
    setSlider(gSlide);
    var z=zoneOf(v);
    $$('#gMarks button').forEach(function(b){b.classList.toggle('on',+b.getAttribute('data-goal')===z);});
    $('#gName').textContent=ZNAME[z];
    showZone(z);
    var kg=imp?w*0.45359237:w,cm=imp?h*2.54:h;
    var okBody=kg>30&&cm>100&&a>=14;
    var maint=okBody?(10*kg+6.25*cm-5*a+(cSex.value==='m'?5:-161))*(+cAct.value):0;
    var ptxt={1:'',2:'',3:''};
    /* the text under each goal's numbers (all three are kept current; only the one on screen is seen) */
    ptxt[1]=badLine(['sur','rate','pG'])+surSent(NV.sur,maint)+' '+rateSent(NV.rate,okBody?kg:0)+' '+protSent(NV.pG,1);
    ptxt[2]=badLine(['pM','meal'])+protSent(NV.pM,2)+' '+mealSent(NV.meal,okBody?NV.pM*kg:0);
    var wk=okBody?kg*NV.loss/100*7700/7:0,leanRaw=maint-wk,leanCap=maint*.75,capped=okBody&&leanRaw<leanCap;
    ptxt[3]=badLine(['loss','pL'])+lossSent(NV.loss,okBody?kg:0,capped)+' '+protSent(NV.pL,3);
    if(!okBody){
      ['#gKcal','#kLean','#kMaint','#kGrow','#rKcal','#rP','#rC','#rF'].forEach(function(id){$(id).textContent='—';});
      $('#gNote').textContent='Enter your age, height and weight to see your numbers.';
      $('#rKcalNote').textContent='Enter your age, height and weight';
      arc('#rgP',0,0);arc('#rgC',0,0);arc('#rgF',0,0);
      swapHTML($('#yG'),ptxt[1]);swapHTML($('#yM'),ptxt[2]);swapHTML($('#yL'),ptxt[3]);
      return;
    }
    var lean=Math.max(leanRaw,leanCap),grow=maint*(1+NV.sur/100);
    var kc=v<=50?lean+(maint-lean)*(v/50):maint+(grow-maint)*((v-50)/50);
    $('#kLean').textContent=fmtInt(r10(lean));$('#kMaint').textContent=fmtInt(r10(maint));$('#kGrow').textContent=fmtInt(r10(grow));
    $('#gKcal').textContent=fmtInt(r10(kc));
    $('#gNote').textContent='Rough estimate from the Mifflin–St Jeor equation and your activity level, rounded to the nearest 10. Adjust by your weekly weight trend.';
    /* page two: the same number as macros, with the protein number you chose and the range for the goal */
    var pMid=z===1?NV.pG:(z===2?NV.pM:NV.pL),pLo=ZR[z][0],pHi=ZR[z][1];
    var pg=pMid*kg,fg=.8*kg,cg=Math.max(0,(kc-pg*4-fg*9)/4),tot=pg*4+fg*9+cg*4;
    if(cg<=0){var extra=' At these numbers protein and fat already use all the calories, so carbohydrate is zero. Lower one of them.';ptxt[z]+=extra;}
    else if(z===1&&cg/kg<3)ptxt[1]+=' Carbohydrate comes out at '+fmtN(cg/kg)+' g/kg, under the 3 to 5 g/kg minimum given for training ('+citeA('iraki19','Iraki et al., 2019')+').';
    swapHTML($('#yG'),ptxt[1]);swapHTML($('#yM'),ptxt[2]);swapHTML($('#yL'),ptxt[3]);
    $('#rKcal').textContent=fmtInt(r10(kc));
    $('#rKcalNote').textContent=(z===1?'kcal per day, '+fmtN(NV.sur)+'% above maintenance':(z===2?'kcal per day, about maintenance':'kcal per day, a deficit of about '+fmtN(NV.loss)+'% of body weight a week'))+'. Maintenance is about '+fmtInt(r10(maint))+'.';
    $('#rP').textContent=fmtInt(pg)+' g · range '+fmtInt(pLo*kg)+' to '+fmtInt(pHi*kg)+' g';
    $('#rC').textContent=fmtInt(cg)+' g';
    $('#rF').textContent=fmtInt(fg)+' g · about 0.8 g/kg';
    var zn=z===1?'Target gain about '+mass(kg*NV.rate/100)+' a week. ':(z===2?'At '+fmtN(NV.meal)+' g a meal that is about '+Math.max(1,Math.round(pg/NV.meal))+' meals. ':'Expected loss about '+mass(kg*NV.loss/100)+' a week'+(capped?' or less (calories are floored at 25% under maintenance)':'')+'. ');
    $('#rNote').textContent=zn+'Estimate from the Mifflin–St Jeor equation. Adjust by your weekly weight trend.';
    var pS=pg*4/tot,cS=cg*4/tot;
    if(calcLive){arc('#rgP',0,pS);arc('#rgC',pS,cS);arc('#rgF',pS+cS,1-pS-cS);}
  }
  [cSex,cAge,cAct,cH,cW,gSlide].forEach(function(el){el.addEventListener('input',calc);el.addEventListener('change',calc);});
  $('#gMarks').addEventListener('click',function(ev){
    var b=ev.target.closest('button');if(!b)return;
    gSlide.value=b.getAttribute('data-v');calc();
  });
  $('#segUnits').addEventListener('click',function(ev){
    var b=ev.target.closest('button');if(!b)return;
    var u=+b.getAttribute('data-u');
    $$('#segUnits button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
    if(u===units)return;
    var w=+cW.value,h=+cH.value;
    if(u===2){cW.value=Math.round(w/0.45359237);cH.value=Math.round(h/2.54);$('#lbW').textContent='Weight (lb)';$('#lbH').textContent='Height (in)';cH.min=40;cH.max=100;cW.min=66;cW.max=550;}
    else{cW.value=Math.round(w*0.45359237);cH.value=Math.round(h*2.54);$('#lbW').textContent='Weight (kg)';$('#lbH').textContent='Height (cm)';cH.min=100;cH.max=250;cW.min=30;cW.max=250;}
    units=u;calc();
  });
  calc();
  enterHooks.push(function(pg){
    if(!$('#rKcal',pg._mini||pg))return;
    calcLive=false;arc('#rgP',0,0);arc('#rgC',0,0);arc('#rgF',0,0);
    requestAnimationFrame(function(){calcLive=true;calc();});
  });

  /* ---------------- training plan ---------------- */
  var PLAN=[
    {d:'Mon',n:'Upper A',l:[['Incline barbell press',3,'6–10','Chest'],['Chest-supported row',3,'8–12','Back'],['Seated dumbbell shoulder press',3,'8–12','Shoulders'],['Lat pulldown',3,'10–12','Back'],['Cable crossover',2,'12–15','Chest'],['Cable lateral raise',3,'12–20','Shoulders'],['Overhead cable triceps extension',3,'10–15','Triceps'],['Incline dumbbell curl',3,'10–15','Biceps']]},
    {d:'Tue',n:'Lower A',l:[['Back squat',3,'6–10','Quads'],['Romanian deadlift',3,'8–12','Hamstrings'],['Leg press',2,'10–15','Quads'],['Seated leg curl',3,'10–15','Hamstrings'],['Standing calf raise',3,'8–15','Calves'],['Cable crunch',3,'10–15','Abs']]},
    {d:'Wed',n:'Rest',r:1},
    {d:'Thu',n:'Upper B',l:[['Weighted pull-up or pulldown',3,'6–10','Back'],['Flat dumbbell press',3,'8–12','Chest'],['Cable row',3,'10–12','Back'],['Machine chest fly',2,'12–15','Chest'],['Rear-delt fly',3,'12–20','Shoulders'],['Cable pushdown',3,'10–15','Triceps'],['Preacher curl',3,'10–15','Biceps']]},
    {d:'Fri',n:'Lower B',l:[['Hack squat',3,'6–10','Quads'],['Lying leg curl',3,'8–12','Hamstrings'],['Hip thrust',3,'8–12','Glutes'],['Leg extension',3,'12–15','Quads'],['Seated calf raise',3,'10–20','Calves'],['Hanging leg raise',3,'10–15','Abs']]},
    {d:'Sat',n:'Rest',r:1},
    {d:'Sun',n:'Rest',r:1}
  ];
  var MUS=['Chest','Back','Shoulders','Quads','Hamstrings','Triceps','Biceps','Calves','Abs','Glutes'],MCOL=['var(--ember)','var(--blue)','var(--heat2)','var(--mint)','var(--mint)','var(--heat3)','var(--heat3)','var(--blue)','var(--ember)','var(--heat2)'];
  var planDays=$('#planDays'),planLifts=$('#planLifts'),planSets=$('#planSets');
  (function(){
    var tot={};MUS.forEach(function(m){tot[m]=0;});
    PLAN.forEach(function(d){(d.l||[]).forEach(function(x){tot[x[3]]+=x[1];});});
    var max=Math.max.apply(null,MUS.map(function(m){return tot[m];})),h='';
    MUS.slice().sort(function(a,b){return tot[b]-tot[a];}).forEach(function(m,n){
      var i=MUS.indexOf(m);
      h+='<div class="hb" data-m="'+m+'"><span>'+m+'</span><div class="t"><i style="--w:'+(tot[m]/max*100).toFixed(1)+'%;--c:'+MCOL[i]+';--d:'+(n*.05).toFixed(2)+'s"></i></div><output>'+tot[m]+'</output></div>';
    });
    planSets.innerHTML=h;
    planDays.innerHTML=PLAN.map(function(d,i){return '<button type="button" class="'+(d.r?'rest':'')+'" data-i="'+i+'" aria-pressed="'+(i===0?'true':'false')+'">'+d.d+'<small>'+(d.r?'Rest':d.n.replace(' ',' '))+'</small></button>';}).join('');
  })();
  function showDay(i){
    var d=PLAN[i],mus={};
    $$('#planDays button').forEach(function(b){b.setAttribute('aria-pressed',+b.getAttribute('data-i')===i?'true':'false');});
    if(d.r){planLifts.innerHTML='<li><span>Rest day. Walk, stretch and eat well.</span><span></span></li>';}
    else planLifts.innerHTML=d.l.map(function(x){mus[x[3]]=1;return '<li><span>'+x[0]+'</span><span>'+x[1]+' × '+x[2]+'</span></li>';}).join('');
    $$('#planSets .hb').forEach(function(r){r.classList.toggle('dim',!(d.r||mus[r.getAttribute('data-m')]));});
  }
  planDays.addEventListener('click',function(e){var b=e.target.closest('button');if(b)showDay(+b.getAttribute('data-i'));});
  showDay(0);

  /* frequency graphic: twelve weekly sets split over one, two or three sessions */
  $$('.freq .fr').forEach(function(row){
    var ss=$$('.ss > div',row),per=12/ss.length,k=0;
    ss.forEach(function(d){for(var j=0;j<per;j++){var i=document.createElement('i');i.style.setProperty('--k',k++);d.appendChild(i);}});
  });

  /* free PDF guide. The file is embedded in the page (PDF_B64). Inside Claude's viewer the download goes through the downloads capability, which asks the viewer to confirm;
     anywhere else a normal browser download is used. */
  var PDF_NAME='MuscleDNA-research-guide.pdf';
  function pdfBytes(){var bin=atob(PDF_B64),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
  $('#pdfBtn').addEventListener('click',function(){
    var msg=$('#pdfMsg'),btn=$('#pdfBtn');msg.textContent='';
    if(typeof PDF_B64==='undefined'||!PDF_B64){msg.textContent='The guide is not available to download yet.';return;}
    btn.disabled=true;
    function done(t){msg.textContent=t;btn.disabled=false;}
    function viaBrowser(){
      try{
        var url=URL.createObjectURL(new Blob([pdfBytes()],{type:'application/pdf'})),a=document.createElement('a');
        a.href=url;a.download=PDF_NAME;document.body.appendChild(a);a.click();a.parentNode.removeChild(a);
        setTimeout(function(){URL.revokeObjectURL(url);},4000);
        done('The download has been started.');
      }catch(e){done('The download is not available here.');}
    }
    var cl=window.claude&&window.claude.use?window.claude.use('downloads'):null;
    if(!cl||!cl.then){viaBrowser();return;}
    cl.then(function(dl){
      if(!dl){viaBrowser();return;}
      var u8=pdfBytes();
      return dl.save({filename:PDF_NAME,data:u8.buffer}).then(function(r){
        done(r&&r.status==='saved'?'Saved. Look for the file in your downloads.':'Done.');
      },function(err){
        var c=err&&err.code;
        done(c==='declined'?'Download cancelled.':(c==='rate_limited'?'One moment, then try again.':'The download is not available here.'));
      });
    },function(){viaBrowser();});
  });

  /* sample download and the contact form: neither is wired to a service yet, and the page says so rather than pretending */
  $('#sampleBtn').addEventListener('click',function(){$('#sampleMsg').textContent='The free sample is not available to download yet.';});
  $$('a[data-aff]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();});});
  var cf=$('#contactForm');
  cf.addEventListener('submit',function(e){
    e.preventDefault();
    var n=$('#fName').value.trim(),m=$('#fMail').value.trim(),t=$('#fMsg').value.trim(),out=$('#formMsg');
    if(!n){out.textContent='Please enter your name.';$('#fName').focus();return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)){out.textContent='Please enter a valid email address.';$('#fMail').focus();return;}
    if(t.length<3){out.textContent='Please write a short message.';$('#fMsg').focus();return;}
    out.textContent='Thanks, '+n+'. Message delivery is not switched on yet, so this message was not sent.';
  });
  if(window.__TUNE){window.__TUNE.lines=function(s,i){var S=allCards.filter(function(x){return x.s===s;})[0];return textLines(S,S.pgs[i]).map(function(L){return [Math.round(L.t),Math.round(L.b),Math.round(L.l),Math.round(L.r),L.full?1:0,L.prose?1:0];});};window.__TUNE.page=function(s,i){cards.forEach(function(S){if(S.s===s)pageSwitch(S,i);});};window.__TUNE.pages=function(){return cards.map(function(S){return [S.s,S.i,S.n,S.live];});};}   // test hooks only
