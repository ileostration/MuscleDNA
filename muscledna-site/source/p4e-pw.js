  /* ---------------- pre-workout detail card ----------------
     Click (or tap) the chosen jar and a framed card opens with that jar in the middle. Scrolling the card turns the jar; four blocks of text fade in beside it, one after the other:
     1 the flavour and its pitch (left), 2 the key ingredients while the Supplement Facts panel on the label is lit (right), 3 the Supplement Facts chart (right), 4 why this supplement (left).
     Left and right arrows change flavour, the Close button, the Escape key and a click outside the card close it. On a phone it is a full page: the jar stays pinned at the top and the text scrolls up beneath it.
     The facts are the ones printed on the four jar labels. */
  (function pwDetail(){
    var pw=$('#pw'),pc=$('#pwCard'),supCard=$('#s5 .sec.sup'),rack=supCard&&$('.rack[data-rack="sup"]',supCard);
    if(!pw||!pc||!rack||!supCard._st||!supCard._car)return;
    var S=supCard._st,scr=$('#pwScroll'),track=$('#pwTrack'),stage=$('#pwStage'),cvbox=$('#pwCv'),phs=$$('.pwph',stage),dots=$('#pwDots'),cue=$('#pwCue');
    var prevB=$('#pwPrev'),nextB=$('#pwNext'),pgn=$('#pwPgn'),closeB=$('#pwClose');
    var mq=window.matchMedia('(max-width:600px),(max-height:540px) and (max-width:950px)'),reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SCROLLS=2.6;                                  // how far the card scrolls, in card heights
    var TAU=Math.PI*2,LT=.9*TAU,LH=.9*TAU*1.004/3;    // the label wraps 90% of the jar (same numbers as the rack)

    /* ---- what the text says ---- */
    var ING={
      cit:{n:'Citrulline malate',h:'Pump',d:'Studied for blood flow and training performance. The evidence is mixed: some trials help, and a 2023 trial of 8 g did not.'},
      ba:{n:'Beta-alanine',h:'Endurance',d:'Builds muscle carnosine, which buffers acid in hard sets. The ISSN range is 4–6 g a day, so a scoop counts toward it. Any tingling is a known, harmless effect.'},
      caf:{n:'Caffeine',h:'Energy',d:'The ISSN supports 3–6 mg per kg of body weight about an hour before training. A scoop is inside that range for most adults of 60–100 kg. New to caffeine? Start with half a scoop.'},
      agpc:{n:'Alpha-GPC (50%)',h:'Focus',d:'A choline source. In a small 2017 trial of 48 men, 250 mg improved jump power; most other tests showed no difference. The evidence is limited.'},
      tyr:{n:'L-tyrosine',h:'Focus',d:'The amino acid the body uses to make dopamine and noradrenaline. A 2015 review links it to better thinking under stress or heavy mental demand.'},
      thea:{n:'L-theanine',h:'Calm focus',d:'An amino acid from tea. Paired with caffeine (97 mg and 40 mg), one trial found better task-switching accuracy and alertness.'}
    };
    var AST1='AstraGin® (Panax notoginseng [root] &amp; Astragalus membranaceus [root])';
    var FD=[
      {name:'Pepperoni Pizza',tag:'Pre-workout that tastes like pizza night.',col:'255,84,60',
       pitch:'Pizza night, minus the pizza. Energy, focus and pump† in one scoop, with 600 mg of Alpha-GPC for the focus side.',
       keys:[['cit','6 g'],['ba','3.2 g'],['caf','300 mg'],['agpc','600 mg']],
       facts:[['L-Citrulline Malate (2:1)','6000 mg'],['Beta-Alanine','3200 mg'],['Betaine Anhydrous','2500 mg'],['L-Tyrosine','1000 mg'],['Alpha-GPC (50%)','600 mg'],['Caffeine Anhydrous','300 mg'],['Theobromine','200 mg'],[AST1,'50 mg']],
       badges:['No artificial colors','Gluten free','Third-party tested'],pan:[1180,1490],inf:.148,src:['guest21','trexler15','gonzalez20','gonzalez23','marcus17']},
      {name:'Fried Chicken',tag:'Yes, it tastes like fried chicken.',col:'255,166,40',
       pitch:'Yes, really. Energy, focus and pump† in one scoop, with 350 mg of caffeine and 1.5 g of L-tyrosine.',
       keys:[['cit','6 g'],['ba','3.2 g'],['caf','350 mg'],['tyr','1.5 g']],
       facts:[['L-Citrulline Malate (2:1)','6000 mg'],['Beta-Alanine','3200 mg'],['Betaine Anhydrous','2500 mg'],['L-Tyrosine','1500 mg'],['Caffeine Anhydrous','350 mg'],['Alpha-GPC (50%)','300 mg'],['Theobromine','200 mg'],['Huperzine A (1%)','100 mcg']],
       badges:['No artificial colors','Gluten free','Third-party tested'],pan:[1190,1490],inf:.15,src:['guest21','trexler15','gonzalez20','gonzalez23','jongkees15']},
      {name:'Mango Guava Passionfruit',tag:'Mango, guava and passionfruit.',col:'240,70,130',
       pitch:'The tropical one. Energy, focus and pump† in one scoop, with 200 mg of L-theanine alongside 350 mg of caffeine.',
       keys:[['cit','6 g'],['ba','3.2 g'],['caf','350 mg'],['thea','200 mg']],
       facts:[['L-Citrulline Malate (2:1)','6000 mg'],['Beta-Alanine','3200 mg'],['Betaine Anhydrous','2500 mg'],['Taurine','1000 mg'],['Caffeine Anhydrous','350 mg'],['Alpha-GPC (50%)','300 mg'],['L-Theanine','200 mg'],['AstraGin® (Astragalus &amp; Panax notoginseng)','50 mg']],
       badges:['No artificial dyes','Gluten free','Dairy free','Soy free'],pan:[1155,1480],inf:.125,src:['guest21','trexler15','gonzalez20','gonzalez23','giesbrecht10']},
      {name:'Pineapple Apple Pear',tag:'Crisp pineapple, apple and pear.',col:'170,226,60',
       pitch:'The fresh one. Energy, focus and pump† in one scoop, with 200 mg of L-theanine alongside 300 mg of caffeine.',
       keys:[['cit','6 g'],['ba','3.2 g'],['caf','300 mg'],['thea','200 mg']],
       facts:[['L-Citrulline Malate (2:1)','6000 mg'],['Beta-Alanine','3200 mg'],['Betaine Anhydrous','2500 mg'],['Taurine','1000 mg'],['Caffeine Anhydrous','300 mg'],['Alpha-GPC (50%)','300 mg'],['L-Theanine','200 mg'],['AstraGin® (Astragalus membranaceus &amp; Panax notoginseng Extracts)','50 mg']],
       allergen:'Manufactured in a facility that also processes milk, soy, egg, tree nuts, peanuts, fish and shellfish.',
       badges:['No artificial colors','Gluten free','Third-party tested'],pan:[1185,1500],inf:.15,src:['guest21','trexler15','gonzalez20','gonzalez23','giesbrecht10']}
    ];
    var WHY=[
      ['Every dose is on the label','Each active is listed with its amount. No proprietary blend hides the numbers.'],
      ['Set against the research','Caffeine inside the ISSN range of 3–6 mg per kg of body weight, and a beta-alanine dose that counts toward the 4–6 g a day it recommends.'],
      ['One base, four flavours','Every flavour carries 6 g citrulline malate, 3.2 g beta-alanine and 2.5 g betaine a scoop. The extras change with the flavour.'],
      ['Part of the plan','The MuscleDNA plan is a 12-week hypertrophy program built around the variables research links to growth. This is the scoop before the session.']
    ];
    var STEPS=['Flavour','Key ingredients','Supplement facts','Why this supplement'];
    function factsHTML(f){
      var h='<div class="fx"><b class="fxh">Supplement Facts</b><p>Serving size: 1 scoop (14 g)<br>Servings per container: 30</p><div class="fxr hd"><span></span><span>Amount per serving</span><span>%DV</span></div>';
      f.facts.forEach(function(r){h+='<div class="fxr"><span>'+r[0]+'</span><span>'+r[1]+'</span><span>**</span></div>';});
      h+='</div><p class="fxn">** Daily Value (DV) not established.</p><p class="fxn"><b>Other ingredients:</b> Natural and artificial flavors, citric acid, silicon dioxide, sucralose, acesulfame potassium.</p>';
      if(f.allergen)h+='<p class="fxn">'+f.allergen+'</p>';
      return h;
    }
    function fill(j){
      var f=FD[j];
      pc.style.setProperty('--fl',f.col);
      $('#pwKick').textContent='MuscleDNA Pre-Workout';
      $('#pwTitle').textContent=f.name;$('#pwTag').textContent=f.tag;$('#pwPitch').textContent=f.pitch;
      $('#pwKeys').innerHTML=f.keys.map(function(k){var g=ING[k[0]];return '<li><b>'+g.n+'<em>'+g.h+' · '+k[1]+'</em></b><span>'+g.d+'</span></li>';}).join('');
      $('#pwFacts').innerHTML=factsHTML(f);
      $('#pwWhy').innerHTML=WHY.map(function(w){return '<li><b>'+w[0]+'</b><span>'+w[1]+'</span></li>';}).join('');
      $('#pwBadges').innerHTML=f.badges.map(function(b){return '<i>'+b+'</i>';}).join('');
      pgn.innerHTML='<b>'+(j+1)+'</b> / '+FD.length;pgn.setAttribute('aria-label','Flavour '+(j+1)+' of '+FD.length);
      prevB.disabled=j===0;nextB.disabled=j===FD.length-1;
    }

    /* ---- the 3D jar ---- */
    var R=null,scene,cam,rig,spin,labM,hlM,hlMesh,tint,rimB,texs=[],cvW=0,cvH=0,DC=0,HW=1;   // DC: how far the jar slides to either side (fraction of the width); HW: half the visible width at the jar
    function getTex(j,cb){
      if(texs[j]){cb(texs[j]);return;}
      var im=new Image();im.onload=function(){var t=new THREE.Texture(im);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy());t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;texs[j]=t;cb(t);};
      im.src=SUP_LABELS[j];
    }
    function rrect(x,px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath();}
    function build(){
      if(R)return true;
      if(!window.THREE||!window.SUP_LABELS)return false;
      var cv=document.createElement('canvas');
      try{R=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){R=null;return false;}
      cvbox.appendChild(cv);
      R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));R.outputEncoding=THREE.sRGBEncoding;R.setClearColor(0x000000,0);
      scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(30,1,.1,60);
      try{scene.environment=studioEnv(R);}catch(e){}
      scene.add(new THREE.AmbientLight(0x8da4ff,.14));
      var key=new THREE.DirectionalLight(0xffffff,1.55);key.position.set(-2.6,3.4,4.4);scene.add(key);
      var rimA=new THREE.DirectionalLight(0x00f4fb,1.0);rimA.position.set(-4,1.2,-3);scene.add(rimA);
      rimB=new THREE.DirectionalLight(0xffffff,1.3);rimB.position.set(4,1.8,-3);scene.add(rimB);
      tint=new THREE.PointLight(0xffffff,1.6,7);tint.position.set(0,-1.2,1.8);scene.add(tint);
      var body=[[0,-1.25],[.86,-1.25],[.94,-1.235],[.985,-1.19],[1,-1.12],[1,.8],[.992,.835],[.97,.86],[.95,.86],[0,.86]];
      var lid=[[0,.86],[.95,.86],[.97,.875],[.97,.9],[.955,.915],[.97,.93],[.97,1.18],[.955,1.245],[.92,1.275],[.86,1.292],[.78,1.298],[0,1.298]];
      function V(a){return a.map(function(p){return new THREE.Vector2(p[0],p[1]);});}
      var black=new THREE.MeshStandardMaterial({color:0x050507,roughness:.36,metalness:.1,envMapIntensity:.8});
      var lidM=new THREE.MeshStandardMaterial({color:0x040406,roughness:.32,metalness:.12,envMapIntensity:.95});
      labM=new THREE.MeshStandardMaterial({roughness:.42,metalness:0,emissive:0xffffff,emissiveIntensity:.5,envMapIntensity:.55});
      var jar=new THREE.Group();
      jar.add(new THREE.Mesh(new THREE.LatheGeometry(V(body),96),black));jar.add(new THREE.Mesh(new THREE.LatheGeometry(V(lid),96),lidM));
      var ring=new THREE.Mesh(new THREE.TorusGeometry(.972,.006,8,96),lidM);ring.rotation.x=Math.PI/2;ring.position.y=.99;jar.add(ring);
      var lab=new THREE.Mesh(new THREE.CylinderGeometry(1.004,1.004,LH,128,1,true,-LT/2,LT),labM);lab.position.y=-.175;jar.add(lab);
      /* the glow that marks the Supplement Facts panel on the label */
      hlM=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.FrontSide});
      hlMesh=new THREE.Mesh(new THREE.BufferGeometry(),hlM);jar.add(hlMesh);
      spin=new THREE.Group();spin.add(jar);
      rig=new THREE.Group();rig.add(spin);rig.position.y=-.02;rig.rotation.x=.06;scene.add(rig);
      return true;
    }
    function setHL(j){
      var f=FD[j],u0=f.pan[0]/1536,u1=f.pan[1]/1536,y0=48/512,y1=298/512;
      var th0=u0*LT-LT/2,thL=(u1-u0)*LT,hh=(y1-y0)*LH,yc=-.175+LH/2-((y0+y1)/2)*LH;
      hlMesh.geometry.dispose();hlMesh.geometry=new THREE.CylinderGeometry(1.012,1.012,hh,48,1,true,th0,thL);hlMesh.position.y=yc;
      var w=thL*1.012,cw=512,ch=Math.max(64,Math.round(cw*hh/w)),c=document.createElement('canvas');c.width=cw;c.height=ch;
      var x=c.getContext('2d');
      x.fillStyle='rgba(255,225,77,.13)';rrect(x,7,7,cw-14,ch-14,16);x.fill();
      x.strokeStyle='#ffe14d';x.lineWidth=6;x.shadowColor='#ffe14d';x.shadowBlur=26;rrect(x,7,7,cw-14,ch-14,16);x.stroke();x.stroke();
      if(hlM.map)hlM.map.dispose();
      var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;hlM.map=t;hlM.needsUpdate=true;
    }
    var KF=[0,-1,-1,-4];                              // jar turn at the four stops (radians): front, Supplement Facts panel to the front, still there (a little further), the "Built on the evidence" panel to the front
    function setFlavour(j,quick){
      var f=FD[j],c=f.col.split(',').map(Number),hex=(c[0]<<16)|(c[1]<<8)|c[2];
      tint.color.setHex(hex);rimB.color.setHex(hex);
      var thf=((f.pan[0]+f.pan[1])/2/1536-.5)*LT,thi=(f.inf-.5)*LT;
      KF=[0,-thf,-thf-.14,-thi-TAU];
      setHL(j);
      getTex(j,function(t){labM.map=t;labM.emissiveMap=t;labM.needsUpdate=true;});
    }
    function fit(){
      /* Card (tablet and up): the jar is about a third of the width and slides to the side opposite the text, so the text gets about 40% of the width.
         Phone page: the jar is centred and pinned at the top. */
      var a=cvW/cvH,t=Math.tan(Math.PI/12),jf=a>=1.45?.34:.4,need;
      if(mq.matches){DC=0;need=Math.max(1.85/t,1.5/(t*a));}
      else{DC=a>=1.45?.17:.2;need=Math.max(1.85/t,1.1/(jf*t*a));stage.style.setProperty('--tw',(Math.min(.43,.5+DC-jf/2-.04)*100).toFixed(1)+'%');}
      cam.aspect=a;cam.position.set(0,.34,need*1.03);cam.lookAt(0,-.02,0);cam.updateProjectionMatrix();
      HW=need*1.03*t*a;
    }

    /* ---- scroll position to "where we are in the story": 0 = flavour, 1 = key ingredients, 2 = facts, 3 = why. In between, the jar turns. ---- */
    function sm(t){t=t<0?0:(t>1?1:t);return t*t*(3-2*t);}
    function targetPos(){
      if(!mq.matches){var m=scr.scrollHeight-scr.clientHeight;return m>2?clamp(scr.scrollTop/m,0,1)*3:0;}
      var sr=scr.getBoundingClientRect(),cb=cvbox.getBoundingClientRect(),zone=(cb.bottom+sr.bottom)/2,cs=phs.map(function(e){var r=e.getBoundingClientRect();return (r.top+r.bottom)/2;});
      if(zone<=cs[0])return 0;if(zone>=cs[3])return 3;
      for(var k=0;k<3;k++)if(zone<cs[k+1])return k+(zone-cs[k])/(cs[k+1]-cs[k]);
      return 3;
    }
    function rot(pos){var k=Math.min(2,Math.floor(pos)),f=pos-k,e=f<.25?0:(f>.75?1:sm((f-.25)/.5));return KF[k]+(KF[k+1]-KF[k])*e;}
    var SX=[1,-1,-1,1];                                // which side the jar stands on at each stop: right while the text is on the left, left while it is on the right
    function side(pos){var k=Math.min(2,Math.floor(pos)),f=pos-k,e=f<.25?0:(f>.75?1:sm((f-.25)/.5));return SX[k]+(SX[k+1]-SX[k])*e;}
    function vis(pos,k){var d=Math.abs(pos-k);return d<=.2?1:(d>=.42?0:sm(1-(d-.2)/.22));}

    var open=false,idx=0,lastFocus=null,raf=0,pos=0,last=0,spinT=-1e9,spinDir=1,swapTm=0;
    function frame(now){
      if(!open)return;raf=requestAnimationFrame(frame);
      var dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
      var mob=mq.matches,tp=targetPos();
      pos=reduce?tp:pos+(tp-pos)*(1-Math.exp(-dt*9));if(Math.abs(tp-pos)<.0005)pos=tp;
      var hl=sm((pos-.55)/.4)*(1-sm((pos-2.35)/.3));
      var su=(now-spinT)/1000/1.1,sx=su>=1?0:(1-easeOut(su))*TAU*spinDir;
      spin.rotation.y=rot(pos)+sx+(reduce?0:Math.sin(now/2600)*.04);
      var zs=1+.1*hl;rig.scale.setScalar(zs);rig.position.x=mob?0:side(pos)*DC*2*HW;
      labM.color.setScalar(1-.5*hl);hlM.opacity=hl*(.8+.2*Math.sin(now/520));
      phs.forEach(function(el,k){
        var o,tx=0,sd=el.classList.contains('l')?-1:1;
        if(mob){o=clamp(1.25-Math.abs(pos-k)*1.5,.2,1);el.style.visibility='';el.style.transform='';el.style.pointerEvents='';}
        else{o=vis(pos,k);tx=(1-o)*sd*22;el.style.visibility=o<.02?'hidden':'visible';el.style.transform='translate3d('+tx.toFixed(1)+'px,-50%,0)';el.style.pointerEvents=o>.6?'auto':'none';}
        el.style.opacity=o.toFixed(3);
      });
      cue.style.opacity=pos<.12?1:0;
      var on=Math.round(pos);[].forEach.call(dots.children,function(b,k){b.classList.toggle('on',k===on);});
      R.render(scene,cam);
    }

    /* ---- layout ---- */
    function layout(){
      var sh=scr.clientHeight;if(!sh)return;
      stage.style.setProperty('--sh',sh+'px');
      track.style.height=mq.matches?'':Math.round(sh*(1+SCROLLS))+'px';
      if(R){var w=cvbox.clientWidth,h=cvbox.clientHeight;if(w&&h){cvW=w;cvH=h;R.setSize(w,h,false);fit();}}
    }
    if(window.ResizeObserver){var ro=new ResizeObserver(function(){if(open)layout();});ro.observe(scr);ro.observe(cvbox);}
    window.addEventListener('resize',function(){if(open)layout();});

    /* ---- the card's frame (same outline as the other cards) ---- */
    (function(){
      var svg=document.createElementNS(SVGNS,'svg'),po=document.createElementNS(SVGNS,'path'),pi=document.createElementNS(SVGNS,'path');
      svg.setAttribute('class','frame');svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');
      po.setAttribute('class','o');pi.setAttribute('class','i');svg.appendChild(pi);svg.appendChild(po);
      pc.insertBefore(svg,pc.firstChild);pc._frame={svg:svg,o:po,i:pi,w:0,h:0,d:-1};pc.classList.add('shaped');
      if(shapeRO)shapeRO.observe(pc);
    })();
    STEPS.forEach(function(n,k){
      var b=document.createElement('button');b.type='button';b.setAttribute('aria-label',n);b.title=n;
      b.addEventListener('click',function(){var m=scr.scrollHeight-scr.clientHeight;scr.scrollTo({top:k/3*m,behavior:reduce?'auto':'smooth'});});
      dots.appendChild(b);
    });

    /* ---- open, close, change flavour ---- */
    function openPW(i,from){
      if(open)return;if(!build())return;
      idx=clamp(i,0,FD.length-1);lastFocus=from||rack;
      open=true;window.__pwOpen=true;resOpen=true;
      pw.classList.add('open');pw.setAttribute('aria-hidden','false');
      fill(idx);setFlavour(idx);layout();
      scr.scrollTop=0;pos=0;spinT=-1e9;
      shapeCard(pc);
      try{scr.focus({preventScroll:true});}catch(e){}
      last=performance.now();raf=requestAnimationFrame(frame);
    }
    function closePW(){
      if(!open)return;
      open=false;window.__pwOpen=false;resOpen=resCard.classList.contains('open');
      cancelAnimationFrame(raf);pw.classList.remove('open');pw.setAttribute('aria-hidden','true');
      if(S.i!==idx)pageSwitch(S,idx);
      if(lastFocus&&lastFocus.focus)try{lastFocus.focus({preventScroll:true});}catch(e){}
    }
    function go(d){
      var ni=idx+d;if(!open||ni<0||ni>=FD.length)return;
      idx=ni;pageSwitch(S,idx);
      stage.classList.add('swap');clearTimeout(swapTm);
      swapTm=setTimeout(function(){fill(idx);setFlavour(idx);scr.scrollTop=0;pos=0;requestAnimationFrame(function(){stage.classList.remove('swap');});},170);
      spinT=performance.now();spinDir=d;
    }
    prevB.addEventListener('click',function(){go(-1);});nextB.addEventListener('click',function(){go(1);});
    closeB.addEventListener('click',closePW);
    var bd=false;
    pw.addEventListener('pointerdown',function(e){bd=e.target===pw;});
    pw.addEventListener('click',function(e){if(e.target===pw&&bd)closePW();bd=false;});
    $$('[data-pwsrc]',pw).forEach(function(b){b.addEventListener('click',function(){openRes(FD[idx].src,null,b);});});
    window.addEventListener('keydown',function(e){
      if(!open||resCard.classList.contains('open'))return;
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePW();return;}
      if(e.key==='ArrowLeft'){e.preventDefault();go(-1);return;}
      if(e.key==='ArrowRight'){e.preventDefault();go(1);return;}
      if(e.key==='Tab'){
        var f=$$('button,a[href],[tabindex="0"]',pw).filter(function(n){return !n.disabled&&n.offsetParent!==null&&getComputedStyle(n).visibility!=='hidden';});
        if(!f.length)return;
        var a=document.activeElement,i=f.indexOf(a);
        if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus();}
        else if(!e.shiftKey&&(i===-1||i===f.length-1)){e.preventDefault();f[0].focus();}
      }
    },true);

    /* ---- the way in: click or tap the chosen jar (the side buttons and swiping still change flavour) ---- */
    rack.classList.add('can-open');rack.tabIndex=0;rack.setAttribute('role','button');
    rack.setAttribute('aria-label','Open the pre-workout details card. The side buttons or a swipe change flavour.');
    var d0=null;
    rack.addEventListener('pointerdown',function(e){d0={x:e.clientX,y:e.clientY};});
    rack.addEventListener('click',function(e){
      if(e.target.closest&&e.target.closest('.nbhit'))return;
      if(d0&&Math.hypot(e.clientX-d0.x,e.clientY-d0.y)>8)return;
      openPW(S.i,rack);
    });
    rack.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target===rack){e.preventDefault();openPW(S.i,rack);}});
    if(window.__TUNE)window.__pwTest={open:function(i){openPW(i==null?S.i:i,rack);},close:closePW,go:go,pos:function(){return pos;}};   // test hook, only present in the test harness
  })();
