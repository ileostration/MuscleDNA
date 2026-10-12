
  /* ---------------- dropdowns ----------------
     Every <select> keeps working underneath (value, change event) but is shown as a button that opens a branded list: a card with a single nook at the top, 75% glass, and a blue to cyan glow.
     The list sits below the button. It is only drawn above the button (nook at the bottom) when there is no room below. */
  var ddOpen=null;
  function ddPath(w,h,i,d,up){
    var r=10,x0=i,y0=i,x1=w-i,y1=h-i,cx=w/2,a=Math.min(30,w/2-d-r-2);
    var top=up?'L'+(x1-r)+' '+y0:'L'+(cx-a-d)+' '+y0+'L'+(cx-a)+' '+(y0+d)+'L'+(cx+a)+' '+(y0+d)+'L'+(cx+a+d)+' '+y0+'L'+(x1-r)+' '+y0;
    var bot=up?'L'+(cx+a+d)+' '+y1+'L'+(cx+a)+' '+(y1-d)+'L'+(cx-a)+' '+(y1-d)+'L'+(cx-a-d)+' '+y1+'L'+(x0+r)+' '+y1:'L'+(x0+r)+' '+y1;
    return 'M'+x0+' '+(y0+r)+'Q'+x0+' '+y0+' '+(x0+r)+' '+y0+top+'Q'+x1+' '+y0+' '+x1+' '+(y0+r)+'L'+x1+' '+(y1-r)+'Q'+x1+' '+y1+' '+(x1-r)+' '+y1+bot+'Q'+x0+' '+y1+' '+x0+' '+(y1-r)+'Z';
  }
  function ddClose(focusBtn){
    if(!ddOpen)return;var o=ddOpen;ddOpen=null;
    o.btn.setAttribute('aria-expanded','false');o.btn.removeAttribute('aria-controls');o.btn.removeAttribute('aria-activedescendant');
    o.pop.classList.remove('in');
    var pop=o.pop;setTimeout(function(){if(pop.parentNode)pop.parentNode.removeChild(pop);},reduce?0:140);
    if(focusBtn)o.btn.focus({preventScroll:true});
  }
  function ddBuild(sel,opt){
    /* opt (optional): {btn: an existing button to use instead of making one, right: align the list to the button's right edge, minw, maxh, blurOnPick} - used by the page-number menu in the header */
    var lab=sel.closest('label'),uid='dd'+Math.random().toString(36).slice(2,7),btn,lt;
    if(opt&&opt.btn){
      btn=opt.btn;lt=btn.getAttribute('aria-label')||'';
      sel.classList.add('dd-native');sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');document.body.appendChild(sel);
    }else{
      var wrap=document.createElement('div');btn=document.createElement('button');
      wrap.className='dd';btn.type='button';btn.className='dd-btn';btn.setAttribute('aria-haspopup','listbox');btn.setAttribute('aria-expanded','false');
      btn.innerHTML='<span class="dd-v"></span><svg class="dd-ch" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5"/></svg>';
      lt=lab&&lab.firstChild&&lab.firstChild.nodeType===3?lab.firstChild.nodeValue.trim():'';
      if(lt)btn.setAttribute('aria-label',lt);
      sel.classList.add('dd-native');sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');
      sel.parentNode.insertBefore(wrap,sel);wrap.appendChild(sel);wrap.appendChild(btn);
    }
    function label(){var o=sel.options[sel.selectedIndex],v=$('.dd-v',btn);if(v)v.textContent=o?o.text:'';}
    label();
    sel.addEventListener('change',label);
    sel.addEventListener('focus',function(){btn.focus({preventScroll:true});});
    function open(){
      if(ddOpen)ddClose(false);
      var pop=document.createElement('div'),inner=document.createElement('div'),svg=document.createElementNS(SVGNS,'svg'),po=document.createElementNS(SVGNS,'path'),pi=document.createElementNS(SVGNS,'path');
      pop.className='dd-pop';pop.id=uid;inner.className='dd-list';inner.setAttribute('role','listbox');inner.setAttribute('aria-label',lt||'Options');
      svg.setAttribute('class','frame');svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');po.setAttribute('class','o');pi.setAttribute('class','i');svg.appendChild(pi);svg.appendChild(po);
      var idx=sel.selectedIndex,items=[];
      [].forEach.call(sel.options,function(o,k){
        var it=document.createElement('div');it.className='dd-opt';it.setAttribute('role','option');it.id=uid+'-'+k;var dn=o.getAttribute('data-n');
        if(dn){var ni=document.createElement('i'),ns=document.createElement('span');ni.className='dd-n';ni.textContent=dn;ns.textContent=o.text;it.appendChild(ni);it.appendChild(ns);}else it.textContent=o.text;
        it.setAttribute('aria-selected',k===sel.selectedIndex?'true':'false');
        it.addEventListener('pointerenter',function(){setAct(k);});
        it.addEventListener('click',function(e){e.stopPropagation();pick(k);});
        inner.appendChild(it);items.push(it);
      });
      var gl=document.createElementNS(SVGNS,'svg'),gd=document.createElementNS(SVGNS,'defs'),lg=document.createElementNS(SVGNS,'linearGradient'),gp=document.createElementNS(SVGNS,'path'),gid=uid+'g';
      gl.setAttribute('class','dd-glow');gl.setAttribute('aria-hidden','true');lg.setAttribute('id',gid);lg.setAttribute('x1','0');lg.setAttribute('y1','1');lg.setAttribute('x2','1');lg.setAttribute('y2','0');
      [['0','#3770fb'],['1','#00f4fb']].forEach(function(s){var st=document.createElementNS(SVGNS,'stop');st.setAttribute('offset',s[0]);st.setAttribute('stop-color',s[1]);lg.appendChild(st);});
      gd.appendChild(lg);gl.appendChild(gd);gp.setAttribute('fill','url(#'+gid+')');gp.setAttribute('stroke','url(#'+gid+')');gp.setAttribute('stroke-width','10');gl.appendChild(gp);
      pop.appendChild(gl);pop.appendChild(svg);pop.appendChild(inner);document.body.appendChild(pop);
      var r=btn.getBoundingClientRect(),vh=innerHeight,nook=parseFloat(getComputedStyle(pop).getPropertyValue('--dnook'))||14;
      pop.style.width='max-content';var nat=pop.offsetWidth,pw=Math.min(Math.max(r.width,nat,(opt&&opt.minw)||0),innerWidth-16);pop.style.width=pw+'px';
      var want=inner.scrollHeight+nook+8+14,below=vh-r.bottom-14,above=r.top-14,up=want>below&&above>below;
      var room=Math.max(120,up?above:below);pop.style.maxHeight=Math.min(want,room,(opt&&opt.maxh)||340)+'px';
      var h=pop.offsetHeight,w=pop.offsetWidth,left=Math.max(8,Math.min(innerWidth-w-8,opt&&opt.right?r.right-w:r.left));
      pop.style.left=left+'px';pop.style.top=(up?r.top-6-h:r.bottom+6)+'px';pop.classList.toggle('up',up);
      svg.setAttribute('viewBox','0 0 '+w+' '+h);po.setAttribute('d',ddPath(w,h,.5,nook,up));pi.setAttribute('d',ddPath(w,h,5.5,nook,up));
      gl.setAttribute('width',w+80);gl.setAttribute('height',h+80);gl.setAttribute('viewBox','-40 -40 '+(w+80)+' '+(h+80));gp.setAttribute('d',ddPath(w,h,2,nook,up));
      pop.style.setProperty('--clip',"path('"+ddPath(w,h,0,nook,up)+"')");
      requestAnimationFrame(function(){pop.classList.add('in');});
      btn.setAttribute('aria-expanded','true');btn.setAttribute('aria-controls',uid);
      var act=-1;
      function setAct(k){
        if(k<0||k>=items.length)return;act=k;
        items.forEach(function(it,q){it.classList.toggle('act',q===k);});
        btn.setAttribute('aria-activedescendant',items[k].id);
        var it=items[k],a=it.offsetTop,b=a+it.offsetHeight;
        if(a<inner.scrollTop)inner.scrollTop=a-4;else if(b>inner.scrollTop+inner.clientHeight)inner.scrollTop=b-inner.clientHeight+4;
      }
      function pick(k){
        if(sel.selectedIndex!==k){sel.selectedIndex=k;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));}
        label();if(opt&&opt.blurOnPick){ddClose(false);btn.blur();}else ddClose(true);
      }
      var typed='',typedT=0;
      function key(e){
        var k=e.key;
        if(k==='ArrowDown'){setAct(Math.min(items.length-1,act+1));}
        else if(k==='ArrowUp'){setAct(Math.max(0,act-1));}
        else if(k==='Home'){setAct(0);}
        else if(k==='End'){setAct(items.length-1);}
        else if(k==='Enter'||k===' '){if(act>=0)pick(act);}
        else if(k==='Escape'){ddClose(true);}
        else if(k==='Tab'){ddClose(false);return;}
        else if(k.length===1&&!e.ctrlKey&&!e.metaKey){
          var n=performance.now();typed=n-typedT>700?k.toLowerCase():typed+k.toLowerCase();typedT=n;
          for(var q=0;q<items.length;q++){var t=items[(act+(typed.length>1?0:1)+q+items.length)%items.length];if(t.textContent.toLowerCase().indexOf(typed)===0){setAct(items.indexOf(t));break;}}
        }else return;
        e.preventDefault();e.stopPropagation();
      }
      ddOpen={btn:btn,pop:pop,key:key};
      setAct(idx<0?0:idx);
      pop.addEventListener('wheel',function(e){e.stopPropagation();},{passive:true});
      pop.addEventListener('touchmove',function(e){e.stopPropagation();},{passive:true});
      pop.addEventListener('pointerdown',function(e){e.stopPropagation();});
    }
    btn.addEventListener('click',function(e){e.stopPropagation();if(ddOpen&&ddOpen.btn===btn)ddClose(false);else open();});
    btn.addEventListener('keydown',function(e){
      if(ddOpen&&ddOpen.btn===btn){ddOpen.key(e);return;}
      if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open();}
    });
    return label;
  }
  document.addEventListener('pointerdown',function(e){if(ddOpen&&!ddOpen.btn.contains(e.target))ddClose(false);},true);
  ['wheel','resize','blur'].forEach(function(ev){window.addEventListener(ev,function(e){if(ddOpen&&!(e.target&&e.target.closest&&e.target.closest('.dd-pop')))ddClose(false);},{passive:true});});
  window.addEventListener('touchmove',function(e){if(ddOpen&&!(e.target&&e.target.closest&&e.target.closest('.dd-pop')))ddClose(false);},{passive:true});
  $$('select').forEach(function(s){ddBuild(s);});
  /* The page number in the header opens the same list: section number and title, the current section marked; picking one jumps there. */
  hudSel=document.createElement('select');hudSel.id='hudSel';
  names.forEach(function(nm,k){var o=document.createElement('option');o.value=k;o.textContent=nm;o.setAttribute('data-n',nums[k]||pad2(k+1));hudSel.appendChild(o);});
  hudSel.selectedIndex=Math.max(0,hudIdx);
  ddBuild(hudSel,{btn:$('#hudBtn'),right:true,minw:248,maxh:460,blurOnPick:true});
  hudSel.addEventListener('change',function(){gotoStage(+hudSel.value);});

  /* ---------------- product racks ----------------
     One rack per partner card. The active product sits in the middle and in front; at most one neighbour shows on each side, behind it and in shadow.
     Supplements are four simple 3D models (one canvas) that turn with the cursor and spin when the product changes. The hoodie is five cut-out images (colour variants). */
  function easeOut(t){t=t<0?0:(t>1?1:t);return 1-Math.pow(1-t,3);}
  function rackNav(rack,S,show){
    var l=document.createElement('button'),r=document.createElement('button');
    l.type=r.type='button';l.className='nbhit l';r.className='nbhit r';l.tabIndex=r.tabIndex=-1;l.setAttribute('aria-label','Previous product');r.setAttribute('aria-label','Next product');
    l.addEventListener('click',function(){pageSwitch(S,S.i-1);});r.addEventListener('click',function(){pageSwitch(S,S.i+1);});
    rack.appendChild(l);rack.appendChild(r);
    return function(idx,n,on){l.style.display=on&&idx>0?'block':'none';r.style.display=on&&idx<n-1?'block':'none';};
  }

  /* --- hoodies --- */
  function hoodRack(card,rack,S){
    var names=['white','yellow','blue','navy','red'],wrap=document.createElement('div'),imgs=[],idx=0,W=0,H=0,AR=640/699;
    wrap.className='hoods';rack.appendChild(wrap);
    names.forEach(function(n){var im=document.createElement('img');im.alt='';im.draggable=false;im.src=HOOD_IMGS[n];wrap.appendChild(im);imgs.push(im);});
    var navSet=rackNav(rack,S);rackSwipe(rack,S);
    function layout(){
      W=rack.clientWidth;H=rack.clientHeight;if(!W||!H)return;
      var Ha=H*.97,Wa=Ha*AR,sN=.8,w=Wa*sN,showNb=W>=Wa+2*(w/3)+8,Ax=(W-Wa)/2,Ar=Ax+Wa;
      imgs.forEach(function(im,j){
        var d=j-idx,x,y,s,op=1,z,cls;
        im.style.width=Wa+'px';im.style.height=Ha+'px';
        if(d===0){x=Ax;y=(H-Ha)/2;s=1;z=3;cls='act';}
        else{
          var side=d<0?-1:1,near=Math.abs(d)===1,sc=near?sN:.66;z=near?2:1;cls='nb';
          var ww=Wa*sc;s=sc;y=(H-Ha*sc)/2+H*.02;
          x=side<0?Ax-ww/3:Ar-2*ww/3;
          if(!near||!showNb){op=0;x=side<0?Ax+Wa*.05:Ar-ww-Wa*.05;}
        }
        im.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) scale('+s+')';im.style.opacity=op;im.style.zIndex=z;
        im.className=cls;
      });
      rack.classList.toggle('has-nb',showNb);navSet(idx,imgs.length,showNb);
    }
    if(window.ResizeObserver)new ResizeObserver(layout).observe(rack);
    layout();
    return {go:function(i){idx=i;layout();},layout:layout};
  }

  /* --- swipe: sideways drag on a rack goes to the previous or next product; up and down is left to the page (touch-action:pan-y) --- */
  function rackSwipe(rack,S,live,done){
    var id=null,x0=0,y0=0,axis=0,dx=0;
    function end(go){
      if(id===null)return;id=null;window.__rackH=false;
      var was=axis;axis=0;if(done)done();
      if(was===1&&go&&Math.abs(dx)>34)pageSwitch(S,S.i+(dx<0?1:-1));
      dx=0;
    }
    rack.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(e.target.closest&&e.target.closest('button,a'))return;
      id=e.pointerId;x0=e.clientX;y0=e.clientY;axis=0;dx=0;
    });
    rack.addEventListener('pointermove',function(e){
      if(e.pointerId!==id)return;
      dx=e.clientX-x0;var dy=e.clientY-y0;
      if(!axis&&Math.hypot(dx,dy)>8){axis=Math.abs(dx)>Math.abs(dy)*1.1?1:2;if(axis===1){window.__rackH=true;try{rack.setPointerCapture(id);}catch(_){}}}
      if(axis===1&&live)live(dx);
    });
    rack.addEventListener('pointerup',function(e){if(e.pointerId===id)end(true);});
    rack.addEventListener('pointercancel',function(e){if(e.pointerId===id)end(false);});
  }

  /* --- supplements: black jars in a studio setting, one per flavour label (four uploaded designs). The chosen jar stands in front with the others beside it, smaller and darker;
     click a neighbour, swipe or drag sideways to step through the flavours. The chosen jar turns as it comes forward and the light takes the flavour's colour. --- */
  /* studio reflections shared by the rack and the detail card: a dark room with a few soft boxes, baked once into an environment map so the black plastic shows real highlights */
  function studioEnv(R){
    var es=new THREE.Scene(),dark=new THREE.Mesh(new THREE.SphereGeometry(20,24,16),new THREE.MeshBasicMaterial({color:0x04060c,side:THREE.BackSide}));es.add(dark);
    function box(w,h,x,y,z,c){var m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m);}
    box(9,6,0,10,2,new THREE.Color(5,5,5.4));box(2.2,12,-9,2,3,new THREE.Color(1.2,3.6,5));box(2.2,12,9,2,-2,new THREE.Color(4.2,3.6,3.2));
    box(7,2.4,0,-1,9,new THREE.Color(2.4,2.6,3));box(3,10,-6,3,-9,new THREE.Color(2,2.6,4.4));
    var pm=new THREE.PMREMGenerator(R),t=pm.fromScene(es,.03).texture;pm.dispose();return t;
  }
  function supRack(card,rack,S){
    if(!window.THREE||!window.SUP_LABELS)return null;
    var cv=document.createElement('canvas'),R;
    try{R=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){R=null;}
    if(!R){rack.classList.add('no-gl');return null;}
    rack.appendChild(cv);
    R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));R.outputEncoding=THREE.sRGBEncoding;R.setClearColor(0x000000,0);
    var scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,2,.1,60);
    var FL=[[255,84,60],[255,166,40],[240,70,130],[170,226,60]];          // flavour colours: pizza, chicken, mango guava, pineapple pear
    var cur=FL[0].slice(),curI=0;
    /* studio reflections: a dark room with a few soft boxes, baked once into an environment map so the black plastic shows real highlights */
    try{scene.environment=studioEnv(R);}catch(e){}
    scene.add(new THREE.AmbientLight(0x8da4ff,.12));
    var key=new THREE.DirectionalLight(0xffffff,1.5);key.position.set(-2.6,3.4,4.4);scene.add(key);
    var rimA=new THREE.DirectionalLight(0x00f4fb,1.0);rimA.position.set(-4,1.2,-3);scene.add(rimA);
    var rimB=new THREE.DirectionalLight(0xffffff,1.3);rimB.position.set(4,1.8,-3);scene.add(rimB);
    var under=new THREE.PointLight(0xffffff,0,9);under.position.set(0,-1.2,1.4);scene.add(under);

    /* jars: lathe bodies. Body radius 1; the lid is slightly narrower, never wider. One jar per flavour; the chosen one stands in front and the others stand beside it, a little smaller and darker (like the hoodies). */
    function lathe(pts,mat,seg){return new THREE.Mesh(new THREE.LatheGeometry(pts.map(function(p){return new THREE.Vector2(p[0],p[1]);}),seg||72),mat);}
    var body=[[0,-1.25],[.86,-1.25],[.94,-1.235],[.985,-1.19],[1,-1.12],[1,.8],[.992,.835],[.97,.86],[.95,.86],[0,.86]];
    var lid=[[0,.86],[.95,.86],[.97,.875],[.97,.9],[.955,.915],[.97,.93],[.97,1.18],[.955,1.245],[.92,1.275],[.86,1.292],[.78,1.298],[0,1.298]];
    var LH=.9*Math.PI*2*1.004/3,LT=.9*Math.PI*2;
    var bodyG=new THREE.LatheGeometry(body.map(function(p){return new THREE.Vector2(p[0],p[1]);}),72),lidG=new THREE.LatheGeometry(lid.map(function(p){return new THREE.Vector2(p[0],p[1]);}),72);
    var ringG=new THREE.TorusGeometry(.972,.006,8,72),labG=new THREE.CylinderGeometry(1.004,1.004,LH,96,1,true,-LT/2,LT);
    var rig=new THREE.Group(),jars=[],dirty=true;
    FL.forEach(function(_,j){
      var black=new THREE.MeshStandardMaterial({color:0x050507,roughness:.36,metalness:.1,envMapIntensity:.75});
      var lidM=new THREE.MeshStandardMaterial({color:0x040406,roughness:.32,metalness:.12,envMapIntensity:.9});
      var labM=new THREE.MeshStandardMaterial({roughness:.42,metalness:0,emissive:0xffffff,emissiveIntensity:.5,envMapIntensity:.55});
      var jar=new THREE.Group();
      jar.add(new THREE.Mesh(bodyG,black));jar.add(new THREE.Mesh(lidG,lidM));
      var g1=new THREE.Mesh(ringG,lidM);g1.rotation.x=Math.PI/2;g1.position.y=.99;jar.add(g1);      // a fine groove ring near the base of the lid
      var lab=new THREE.Mesh(labG,labM);lab.position.y=-.175;jar.add(lab);
      var tilt=new THREE.Group(),spinG=new THREE.Group(),place=new THREE.Group();
      spinG.add(jar);tilt.add(spinG);place.add(tilt);rig.add(place);
      tilt.rotation.set(.1,0,-.17);
      var o={place:place,tilt:tilt,spin:spinG,labM:labM,black:black,lidM:lidM,x:0,s:1,dim:1,ry:0,ph:j*1.3};
      jars.push(o);
      var im=new Image();im.onload=function(){var t=new THREE.Texture(im);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy());t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;labM.map=t;labM.emissiveMap=t;labM.needsUpdate=true;dirty=true;};
      im.src=SUP_LABELS[j];
    });
    var tint=new THREE.PointLight(0xffffff,1.6,7);tint.position.set(0,-1.2,1.8);scene.add(tint);
    scene.add(rig);

    var idx=0,W=0,H=0,mx=0,my=0,tmx=0,tmy=0,lastT=performance.now(),sp0=0,spDir=1,drag=0,dragT=0,frame=0,showNb=true,first=true;
    var NB_X=1.35,NB_S=.8,NB_Z=-.95;   // distance, size and depth of the neighbouring jars (they stand a little behind the chosen one, partly hidden by it, like the hoodies)
    var navSet=rackNav(rack,S);
    function size(){
      W=rack.clientWidth;H=rack.clientHeight;if(!W||!H)return;
      R.setSize(W,H,false);var a=W/H;cam.aspect=a;
      showNb=a>=.9;rack.classList.toggle('has-nb',showNb);navSet(idx,jars.length,showNb);
      var t=Math.tan(Math.PI/12),halfW=Math.min((NB_X+NB_S)*.87+.1,1.75),need=Math.max(1.72/t,(halfW/a)/t);          // fit the whole jar with room to spare (its tilt and its bobbing take the base lower than the plain height); the neighbours' width as far as it goes (in a narrow rack they peek out from behind the chosen jar)
      cam.position.set(0,.3,need*1.04);cam.lookAt(0,-.5,0);cam.updateProjectionMatrix();dirty=true;
    }
    if(window.ResizeObserver)new ResizeObserver(size).observe(rack);size();
    window.addEventListener('pointermove',function(e){tmx=Math.max(-1,Math.min(1,(e.clientX/innerWidth-.5)*2));tmy=Math.max(-1,Math.min(1,(e.clientY/innerHeight-.5)*2));},{passive:true});
    rackSwipe(rack,S,function(dx){dragT=Math.max(-1.6,Math.min(1.6,dx/90));dirty=true;},function(){dragT=0;dirty=true;});
    function setCol(c){
      var hex=(Math.round(c[0])<<16)|(Math.round(c[1])<<8)|Math.round(c[2]);
      tint.color.setHex(hex);rimB.color.setHex(hex);
      rack.style.setProperty('--fl',Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2]));
    }
    setCol(cur);
    function tick(now){
      requestAnimationFrame(tick);
      var dt=Math.min(.05,(now-lastT)/1000);lastT=now;
      if(!S.live&&frame>30&&!sp0&&!dirty)return;
      frame++;dirty=false;
      var kc=1-Math.exp(-dt*5),kd=1-Math.exp(-dt*9),kk=1-Math.exp(-dt*4),kp=first?1:1-Math.exp(-dt*6.5);first=false;
      mx+=(tmx-mx)*kc;my+=(tmy-my)*kc;drag+=(dragT-drag)*kd;
      var tg=FL[idx];
      if(Math.abs(cur[0]-tg[0])+Math.abs(cur[1]-tg[1])+Math.abs(cur[2]-tg[2])>.6){for(var q=0;q<3;q++)cur[q]+=(tg[q]-cur[q])*kk;setCol(cur);dirty=true;}
      var sp=0;
      if(sp0){var u=(now-sp0)/1150;if(u>=1){sp0=0;}else{sp=(1-easeOut(u))*spDir*Math.PI*2;}dirty=true;}
      var moving=false;
      jars.forEach(function(o,j){
        var d=j-idx,ad=Math.abs(d),act=d===0,near=ad===1&&showNb;
        var tx=act?0:(d<0?-1:1)*(near?NB_X:NB_X+1.1),ts=act?1:(near?NB_S:.35),td=act?1:(near?.34:0),try_=act?0:-Math.sign(d)*.5;
        o.x+=(tx-o.x)*kp;o.s+=(ts-o.s)*kp;o.dim+=(td-o.dim)*kp;o.ry+=(try_-o.ry)*kp;
        if(Math.abs(tx-o.x)+Math.abs(ts-o.s)+Math.abs(td-o.dim)>.004)moving=true;
        var vis=o.s>.4&&(act||near||o.dim>.02);o.place.visible=vis;
        o.place.position.set(o.x,-.38+Math.sin(now/1100+o.ph)*.06*(.4+.6*o.dim),act?0:NB_Z*Math.min(1,Math.abs(o.x)/NB_X));
        o.place.scale.setScalar(o.s);
        var sh=Math.max(0,Math.min(1,(o.dim-.34)/.66)),br=.025+.975*sh;     // a jar standing beside the chosen one sits in deep shadow (the chosen one is in the spotlight): its label is almost black and only a thin rim of reflected light keeps its outline
        o.labM.color.setScalar(br);o.labM.emissiveIntensity=.5*br;o.black.envMapIntensity=.75*br+.11*(1-sh);o.lidM.envMapIntensity=.9*br+.11*(1-sh);
        o.spin.rotation.y=act?sp+mx*.55+drag*.7+Math.sin(now/2600)*.08+o.ry:o.ry+mx*.2;
        o.tilt.rotation.x=.1+my*.08;o.tilt.rotation.z=-.17+Math.sin(now/1900+o.ph)*.02;
        o.place.renderOrder=act?2:1;
      });
      if(moving)dirty=true;
      R.render(scene,cam);
    }
    requestAnimationFrame(tick);
    return {go:function(i,dir){if(i===idx)return;idx=i;sp0=performance.now();spDir=dir>=0?1:-1;navSet(idx,jars.length,showNb);dirty=true;},layout:size};
  }


  /* ---------------- background texture ----------------
     A soft mottled blue, like velvet or stucco: warped fractal noise for the large cloudy patches and a fine speckle on top, painted once to a full-window canvas (redrawn on resize).
     It is generated for the exact window size, never a picture, so it has no edge, corner or repeat. Kept very dim and added to the page with a screen blend, so the figure's highlights keep their contrast. */
  (function bgTexture(){
    var c=document.getElementById('tex');if(!c||!c.getContext)return;
    var ctx=c.getContext('2d'),tm=0,c2=document.getElementById('tex2');
    if(!c2){c2=document.createElement('canvas');c2.id='tex2';c2.setAttribute('aria-hidden','true');c.parentNode.insertBefore(c2,c.nextSibling);}
    var LIFT=[16,46,104];           // the brightest the texture ever adds (r,g,b) at full strength; the layers are shown at 11-14% opacity (CSS), so the real addition is a faint few levels
    var P=new Uint8Array(512);
    (function(){var i,a=20261009,p=[];for(i=0;i<256;i++)p[i]=i;function r(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
      for(i=255;i>0;i--){var j=(r()*(i+1))|0,t=p[i];p[i]=p[j];p[j]=t;}for(i=0;i<512;i++)P[i]=p[i&255];})();
    function gr(h,x,y){h&=3;return h===0?x+y:h===1?y-x:h===2?x-y:-x-y;}
    function pn(x,y){
      var X=Math.floor(x),Y=Math.floor(y);x-=X;y-=Y;X&=255;Y&=255;
      var u=x*x*x*(x*(x*6-15)+10),v=y*y*y*(y*(y*6-15)+10),a=P[P[X]+Y],b=P[P[X+1]+Y],c2=P[P[X]+Y+1],d=P[P[X+1]+Y+1];
      var l1=gr(a,x,y)+u*(gr(b,x-1,y)-gr(a,x,y)),l2=gr(c2,x,y-1)+u*(gr(d,x-1,y-1)-gr(c2,x,y-1));
      return l1+v*(l2-l1);
    }
    function fbm(x,y,o){var s=0,a=.5,f=1;for(var i=0;i<o;i++){s+=a*pn(x*f+i*17.3,y*f-i*9.1);a*=.56;f*=2.03;}return s*1.6;}
    function draw(){
      var W=innerWidth,H=innerHeight,res=Math.min(1,Math.sqrt(2.4e6/(W*H))),cw=Math.max(8,Math.round(W*res)),ch=Math.max(8,Math.round(H*res));
      c.width=cw;c.height=ch;
      /* the large patches, computed on a coarse grid (cells of 3 px) and read back with bilinear smoothing */
      var CS=3,gw=Math.ceil(cw/CS)+2,gh=Math.ceil(ch/CS)+2,T=new Float32Array(gw*gh),sc=2.6/ch*CS,x,y;
      for(y=0;y<gh;y++)for(x=0;x<gw;x++){
        var nx=x*sc,ny=y*sc,q1=fbm(nx*.8+3.1,ny*.8+7.7,2),q2=fbm(nx*.8+11.3,ny*.8+1.9,2);
        var v=fbm(nx*3.8+q1*.5,ny*3.8+q2*.5,6);
        var bias=.12*((x/gw)-.5)-.14*((y/gh)-.5);          // a little lighter towards the upper right, as in the reference
        var t=.52+.5*v+bias;t=t<0?0:t>1?1:t;T[y*gw+x]=t*t*(3-2*t);
      }
      var img=ctx.createImageData(cw,ch),d=img.data,hs=2166136261,k=0;
      for(y=0;y<ch;y++){
        var gy=y/CS,y0=Math.floor(gy),fy=gy-y0;
        for(x=0;x<cw;x++,k+=4){
          var gx=x/CS,x0=Math.floor(gx),fx=gx-x0,o=y0*gw+x0;
          var t2=(T[o]*(1-fx)+T[o+1]*fx)*(1-fy)+(T[o+gw]*(1-fx)+T[o+gw+1]*fx)*fy;
          hs=Math.imul(x,374761393)^Math.imul(y,668265263)^20261009;hs=Math.imul(hs^hs>>>15,2246822519);hs=Math.imul(hs^hs>>>13,3266489917);hs^=hs>>>16;
          var g=((hs>>>0)/4294967296);                       // fine speckle, stronger in the lighter patches
          var l=(.1+.9*t2)*(.1+.9*t2)*(.6+.8*g)+.05*(g-.5);l=l<0?0:l;
          d[k]=LIFT[0]*l;d[k+1]=LIFT[1]*l;d[k+2]=LIFT[2]*l;d[k+3]=255;
        }
      }
      ctx.putImageData(img,0,0);
      c2.width=cw;c2.height=ch;c2.getContext('2d').drawImage(c,0,0);   // second layer: the same cloud, mirrored and drifting the other way by CSS, so the two slide over each other like fog
    }
    draw();
    window.addEventListener('resize',function(){clearTimeout(tm);tm=setTimeout(draw,160);});
  })();
  $$('.rack').forEach(function(rack){
    var card=rack.closest('.sec'),S=card&&card._st;if(!S)return;
    var car=rack.getAttribute('data-rack')==='hood'?hoodRack(card,rack,S):supRack(card,rack,S);
    card._car=car;
  });
