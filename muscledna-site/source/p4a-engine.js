(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small=Math.min(innerWidth,innerHeight)<700||innerWidth<760;
  var N=(window.__TUNE&&__TUNE.n)||(small?100000:160000),NFGF=(window.__TUNE&&__TUNE.nf)||(small?.8:.64),NFG=Math.round(N*NFGF);   // small screens: more particles, and more of them on the figure, so the highlights stay defined
  var RESP_LO=480,RESP_HI=1100;                        // window width: <=480 (phones) the whole figure head to toe; >=1100 the desktop framing; in between the framing blends continuously
  var MOBILE_VIEW=innerWidth<=RESP_LO;                 // decided once (used only for the density window of the figure samples)
  var NPOSE=(typeof SRC_POSES!=='undefined')?SRC_POSES.length:0;
  var T=buildTargets(N);                       // T[0] wave. T[1..NPOSE] poses, T[NPOSE+1] DNA, filled in once the images are cut up
  var K=NPOSE+2;
  var STAGES=K-1;
  var ORD=[NPOSE+1];for(var o0=1;o0<=NPOSE;o0++)ORD.push(o0);   // order of the loop: DNA first, then the nine poses, then back to DNA (indices into T)
  var mod=function(a,n){return ((a%n)+n)%n;};
  var AR=2/3;                                  // every pose frame is 2:3
  var i0;for(i0=1;i0<K;i0++)T[i0]=T[0];        // placeholders: the living wave stays on screen while the poses are prepared
  var RES=[];                                  // RES[a]: per-particle residual of pose a -> a+1 after the keypoint warp
  var REG=null;                                // particle -> muscle region id

  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};
  var sstep=function(a,b,v){var t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
  var pad2=function(n){return n<10?'0'+n:''+n;};

  /* ---------------- renderer ---------------- */
  var canvas=$('#gl'),renderer=null;
  try{renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:false,alpha:false,powerPreference:'high-performance'});}catch(e){renderer=null;}
  if(!renderer)document.documentElement.classList.add('no-gl');

  var stages=$$('.stage');
  var sides=stages.map(function(s){return s.getAttribute('data-side')||'c';});
  var names=stages.map(function(s){return s.getAttribute('data-name');});
  var nums=stages.map(function(s){var n=s.querySelector('.num');return n?n.textContent.trim():'';});
  var views=[];
  /* cursor field: R value, G rim, B heat phase (0 fresh .. 1 cooled), A heat presence */
  var FH=160,FW=284,fA=null,fB=null,hTA=null,hTB=null,hSA=null,hSB=null,hKA=null,hKB=null,fData=null,hData=null,fieldTex=null,heatTex=null,nOffX=null,nOffY=null;
  var pt={x:0,y:0,lx:0,ly:0,cx:0,cy:0,has:false,lastMove:0,tv:0,v:0,dirty:false,onFig:false};
  var simAcc=0,stepN=0,fieldLive=0,SIL_W=160,SIL_H=240;
  var curS=1,curR=1,CUR_R0=11,CUR_R1=26,CUR_KEEP=.970,CUR_LOSS=.95,HEAT_LOSS=.93,HEAT_KEEP=.998;
  var curLoss=CUR_LOSS,heatLoss=HEAT_LOSS,gA=null,gB=null,gLive=0;   // curLoss/heatLoss: the ripple's reach, scaled with the size of the figure (see fieldInit)
  /* heat: on contact with the figure the cursor emits gold (one colour); the four contact steps keep their timing but share the colour (then it stops emitting).
     Every emission rides the ripple outwards and, 0.5 s after it was emitted, has faded into the colour the ripple has at that spot. */
  var HEAT_EMIT=.25,HEAT_LIFE=.25,HEAT_FADE0=.08;      // first-contact shimmer: emitted for 0.25 s, each spot fades within 0.25 s, so the whole shimmer is over 0.5 s after contact
  var HC=[1.,.78,.26,  1.,.78,.26,  1.,.78,.26,  1.,.78,.26];     // the contact is one colour, shimmering gold (it used to step through several)
  var ep={t:-1,gap:0,still:0,ox:0,oy:0},simT=0;                        // contact episode: t = seconds since the cursor touched the figure (-1 = not in contact)
  var curFrom=-1,curTo=-1;
  var geo,mat,points,group,camera,scene;
  var tgt=0,sm=0,cur=0;                         // scroll: target, first smoothing stage, second smoothing stage (all in stage units 0..STAGES-1)
  var px=0,py=0,pxT=0,pyT=0,PPU=1;
  var introT=reduce?1:0,introStart=null,imagesReady=false,imgDeadline=performance.now()+25000;
  var MLS_ALPHA=POSE_P.alpha;
  var TUNE=window.__TUNE||{};
  var POSE_PS=TUNE.ps||1.25,MOB_PS=TUNE.mps||.75,MOB_GN=TUNE.mg||6.25;
  var UP_STAGE=7,ARMPIT_V=.30,UP_K=(window.__TUNE&&__TUNE.upk!=null)?__TUNE.upk:.12,upF=0;                   // section 7: top of the screen under the armpit (widest windows); section 8 follows by the same amount
  var FEET_STAGE={6:1},FEET_AT=1.0;                     // section 6: feet at 93% of the window height
  var POSE_PS_V6=.36,POSE_PS_V6M=.36;                 // point-size factors the cursor interaction was tuned with (before the figures were redone)

  function isPose(tg){return !!(tg&&tg.kp);}

  function computeViews(){
    var aspect=innerWidth/innerHeight;
    var halfH=12*Math.tan(22.5*Math.PI/180),halfW=halfH*aspect;
    var mobile=aspect<1.05||innerWidth<=760;
    var vw=2*halfW,vh=2*halfH;
    var ppu=innerHeight/vh;PPU=ppu;
    var pw=1-sstep(RESP_LO,RESP_HI,innerWidth);          // 0 = desktop framing .. 1 = phone framing
    var rsum=0,rcnt=0,G0=Math.pow(1.8/POSE_PS,2);   // the dots are smaller than the build the colours were tuned on: the light they carry is raised to match
    views=T.map(function(tg,k){
      if(tg.home==='bottom')return {x:0,y:mobile?-halfH*.2:-2.3,s:mobile?Math.max(.55,Math.min(1,aspect*1.4)):1,rot:0,p:1,pr:1,pb:1};
      if(isPose(tg)){
        /* Two framings are computed and blended by window width, so the figure zooms continuously (no jump at any width):
           PHONE (width <= RESP_LO): the whole figure, head to toe, 64% of the screen height, in the top part of the screen.
           DESKTOP (width >= RESP_HI): the frame measured on the 1920x1080 reference screenshots. tg.lay = [image centre x, y (reference px), image height (reference px), rotation deg].
           The whole 1920x1080 composition is scaled to the window WIDTH (c = width/1920), so the figure zooms out as the window narrows and in as it widens,
           and is exactly the reference at 1920x1080. In tall windows the zoom-out stops at 0.7 of the height-fit scale; the frame is then wider than the window and stays pinned to the figure's side.
           The head keeps the reference's relative height; extra window height reveals more of the body below. */
        var lay=tg.lay,cw=Math.max(innerWidth/1920,.7*innerHeight/1080),hpx=lay[2]*cw,sd=sides[k];
        var ox=sd==='r'?innerWidth-1920*cw:(sd==='l'?0:(innerWidth-1920*cw)/2);
        var headRef=(lay[1]-lay[2]/2)+tg.kp[0][1]*lay[2];
        var X=ox+lay[0]*cw,Y=innerHeight*headRef/1080+(lay[1]-headRef)*cw;
        if(FEET_STAGE[k]){   // this section: the figure is placed so its feet sit near the bottom of the screen (at every window size)
          var feetRef=(lay[1]-lay[2]/2)+Math.max(tg.kp[13][1],tg.kp[14][1])*lay[2];
          Y=FEET_AT*innerHeight+(lay[1]-feetRef)*cw;
        }
        var pD=POSE_PS*Math.sqrt(hpx*hpx*AR/N),hpm=innerHeight*.64,pP=MOB_PS*Math.sqrt(hpm*hpm*AR/N);
        var rD=Math.min(1,POSE_PS_V6*Math.sqrt(N/160000)/POSE_PS),rP=Math.min(1,POSE_PS_V6M*Math.sqrt(N/160000)/MOB_PS);   // cursor-touched dots keep the pixel size of the earlier build
        var q=pw,hB=hpx+(hpm-hpx)*q;
        var Xb=X+(innerWidth/2-X)*q,Yb=Y+(.38*innerHeight-Y)*q;
        /* Wide desktop framings that were asked for per section (all blended in by window width, so nothing jumps):
           section 6 (07): below ~1250 px wide the feet touch the bottom edge; as the window gets wider the figure slides down until the (screen-right) knee is on the bottom edge.
           section 7 (08): at the widest the figure moves up until the top edge sits just under the armpit; section 8 (09) moves up by the same fraction of the figure. */
        var wk=sstep(1250,1750,innerWidth);
        if(FEET_STAGE[k]){
          var fkp=Math.max(tg.kp[13][1],tg.kp[14][1]),kkp=tg.kp[12][1],fb=sstep(640,900,innerWidth);
          var feetNow=Yb+(fkp-.5)*hB,anchor=fkp+(kkp-fkp)*wk,tgtY=feetNow+(innerHeight*FEET_AT-feetNow)*fb;
          Yb=tgtY-(anchor-.5)*hB;
        }
        if(k===UP_STAGE){var Yt=(.5-ARMPIT_V)*hB;upF=(Yb-Yt)/hB;Yb+=(Yt-Yb)*wk*UP_K;}   // UP_K: how much of the full armpit shift stage 08 keeps; the rest of it is moved back down so the back shows (section 9 still follows the full amount)
        else if(k===UP_STAGE+1)Yb-=upF*hB*wk;
        rsum+=hB/lay[2];rcnt++;
        return {x:(Xb-innerWidth/2)/ppu,y:-(Yb-innerHeight/2)/ppu,s:hB/ppu,rot:-lay[3]*Math.PI/180*(1-q),gn:G0+(MOB_GN-G0)*q,gb:G0+(1-G0)*q,p:pD+(pP-pD)*q,
          pr:rD+(rP-rD)*q,pb:(rD+(rP-rD)*q)/.6};
      }
      if(tg.img){
        /* DNA: a full 16:9 frame. Height always fills the screen. Wide windows: centred (identical to the reference screenshot at 1920x1080).
           Narrow / portrait windows slide the frame to the helix; the two are blended continuously by window width and aspect. */
        var im=tg.img,ar=im.ar,s2=Math.max(vh,vw/ar),W=s2*ar,x,y,sy2=Math.max(0,(s2-vh)/2);
        var fxw=(im.fx-.5)*W,off=clamp(-fxw,-(W-vw)/2,(W-vw)/2),yy=clamp((im.fy-.5)*s2,-sy2,sy2);
        var wd=Math.max(pw,1-sstep(.95,1.5,aspect));
        return {x:off*wd,y:yy*wd,s:s2*(im.k||1),rot:0,gn:1+(.6-1)*wd,p:.64*Math.sqrt(s2*s2*ar*ppu*ppu/N),pr:1,pb:1};
      }
      return {x:0,y:0,s:1,rot:0,p:1,pr:1,pb:1};
    });
    curS=rcnt?clamp(rsum/rcnt,.3,1.5):1;curR=rcnt?clamp(rsum/rcnt,.12,1.5):1;      // cursor radius follows the size of the figure (1 at the 1920x1080 reference)
  }

  var glowEl=document.getElementById('glow'),glowX=-1;
  function glowTick(){
    if(!glowEl)return;
    var i0=mod(Math.floor(cur+1e-6),STAGES),i1=mod(i0+1,STAGES),f=sstep(.1,.9,cur-Math.floor(cur+1e-6));
    function xs(k){return sides[k]==='r'?72:28;}
    var g=innerWidth/innerHeight<1.05?50:xs(i0)+(xs(i1)-xs(i0))*f;
    if(Math.abs(g-glowX)>.15){glowX=g;glowEl.style.setProperty('--gx',g.toFixed(2)+'%');}
  }
  var ZERO_N=new Float32Array(N),ZERO_2=new Float32Array(N*2),FGFLAG=new Float32Array(N);
  for(var q0=0;q0<NFG;q0++)FGFLAG[q0]=1;
  function copyInto(attr,src){attr.array.set(src);attr.needsUpdate=true;}
  function bind(from,to,force){
    if(!renderer)return;
    var mls=isPose(T[from])&&isPose(T[to])&&to===from+1;
    if(force||from!==curFrom){copyInto(geo.attributes.position,T[from].pos);copyInto(geo.attributes.cFrom,T[from].col);copyInto(geo.attributes.sFrom,T[from].size);copyInto(geo.attributes.kFrom,T[from].spr||ZERO_N);}
    if(force||to!==curTo){copyInto(geo.attributes.aTo,T[to].pos);copyInto(geo.attributes.cTo,T[to].col);copyInto(geo.attributes.sTo,T[to].size);copyInto(geo.attributes.kTo,T[to].spr||ZERO_N);}
    copyInto(geo.attributes.aRes,mls&&RES[from-1]?RES[from-1]:ZERO_2);
    var u=mat.uniforms;
    u.uMls.value=mls?1:0;
    if(mls){for(var k=0;k<15;k++){u.uKa.value[k].set(T[from].kpW[k][0],T[from].kpW[k][1]);u.uKb.value[k].set(T[to].kpW[k][0],T[to].kpW[k][1]);}}
    curFrom=from;curTo=to;
  }

  if(renderer){
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setClearColor(0x000000,1);
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,100);
    camera.position.set(0,0,12);
    group=new THREE.Group();group.rotation.order='ZYX';scene.add(group);
    geo=new THREE.BufferGeometry();
    var rnd=new Float32Array(N);for(var i=0;i<N;i++)rnd[i]=Math.random();
    geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));
    geo.setAttribute('aTo',new THREE.BufferAttribute(new Float32Array(N*3),3));
    geo.setAttribute('cFrom',new THREE.BufferAttribute(new Float32Array(N*3),3));
    geo.setAttribute('cTo',new THREE.BufferAttribute(new Float32Array(N*3),3));
    geo.setAttribute('sFrom',new THREE.BufferAttribute(new Float32Array(N),1));
    geo.setAttribute('sTo',new THREE.BufferAttribute(new Float32Array(N),1));
    geo.setAttribute('aRand',new THREE.BufferAttribute(rnd,1));
    geo.setAttribute('kFrom',new THREE.BufferAttribute(new Float32Array(N),1));
    geo.setAttribute('kTo',new THREE.BufferAttribute(new Float32Array(N),1));
    geo.setAttribute('aFg',new THREE.BufferAttribute(FGFLAG,1));
    geo.setAttribute('aRes',new THREE.BufferAttribute(new Float32Array(N*2),2));
    fieldInit();
    var kaA=[],kbA=[];for(var kk=0;kk<15;kk++){kaA.push(new THREE.Vector2());kbA.push(new THREE.Vector2());}
    mat=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
      uniforms:{uCmpF:{value:0},uCmpT:{value:0},uSc:{value:1},uMix:{value:0},uTime:{value:0},uPx:{value:renderer.getPixelRatio()},uPsz:{value:1},uAmpFrom:{value:1},uAmpTo:{value:0},uTurb:{value:reduce?0:1.6},uJit:{value:.006},uSt:{value:.5},uFocus:{value:12},uAspect:{value:innerWidth/innerHeight},uField:{value:fieldTex},uHeat:{value:heatTex},uRs:{value:new THREE.Vector2(1,1)},uTexel:{value:new THREE.Vector2(1/FW,1/FH)},uFieldOn:{value:0},uSwF:{value:0},uSwT:{value:0},uAxF:{value:0},uAxT:{value:0},uMls:{value:0},uGain:{value:1},uGB:{value:1},uFade:{value:0},uPoseF:{value:0},uPoseT:{value:0},uAlpha:{value:MLS_ALPHA},uKa:{value:kaA},uKb:{value:kbA}},
      vertexShader:[
        'attribute vec3 aTo;attribute vec3 cFrom;attribute vec3 cTo;attribute float sFrom;attribute float sTo;attribute float aRand;attribute float kFrom;attribute float kTo;attribute float aFg;attribute vec2 aRes;',
        'uniform float uMix,uTime,uPx,uPsz,uAmpFrom,uAmpTo,uTurb,uJit,uSt,uFocus,uAspect,uFieldOn,uSwF,uSwT,uAxF,uAxT,uMls,uAlpha,uPoseF,uPoseT,uGain,uGB,uFade,uCmpF,uCmpT,uSc;',
        'uniform vec2 uKa[15];uniform vec2 uKb[15];',
        'vec3 spinAbout(vec3 q,float y0,float a){float cy=q.y-y0;float c=cos(a),s=sin(a);return vec3(q.x,y0+cy*c-q.z*s,cy*s+q.z*c);}',
        /* similarity moving least squares: drags every body particle along with the nearest body points (hands stay on hands, feet on feet) */
        'vec2 mlsWarp(vec2 v,float e){',
        '  float sw=0.;vec2 pc=vec2(0.);vec2 qc=vec2(0.);',
        '  for(int k=0;k<15;k++){vec2 d=v-uKa[k];float w=1./pow(dot(d,d)+.0004,uAlpha);sw+=w;pc+=w*uKa[k];qc+=w*mix(uKa[k],uKb[k],e);}',
        '  pc/=sw;qc/=sw;',
        '  float cr=0.;float ci=0.;float mu=0.;',
        '  for(int k=0;k<15;k++){vec2 d=v-uKa[k];float w=1./pow(dot(d,d)+.0004,uAlpha);vec2 p=uKa[k]-pc;vec2 q=mix(uKa[k],uKb[k],e)-qc;cr+=w*(p.x*q.x+p.y*q.y);ci+=w*(p.x*q.y-p.y*q.x);mu+=w*dot(p,p);}',
        '  cr/=mu;ci/=mu;vec2 u=v-pc;',
        '  return qc+vec2(cr*u.x-ci*u.y,cr*u.y+ci*u.x);',
        '}',
        'uniform sampler2D uField;uniform sampler2D uHeat;uniform vec2 uTexel;uniform vec2 uRs;',
        'varying vec3 vCol;varying float vSoft;',
        'float waveY(vec2 q,float t){return sin(q.x*.42+t*.55)*.8+sin(q.x*.9-q.y*.55+t*.8)*.42+cos(q.y*.75+t*.45)*.32;}',
        'void main(){',
        '  vec3 pf=position;vec3 pt=aTo;float wf=0.;float wt=0.;',
        /* the DNA frame is a flat picture: a particle that is pushed towards or away from the camera by its relief keeps the screen position it has in the picture */
        '  if(uCmpF>.5)pf.xy*=(12.-pf.z*uSc)/12.;',
        '  if(uCmpT>.5)pt.xy*=(12.-pt.z*uSc)/12.;',
        '  if(uAmpFrom>0.){wf=waveY(pf.xz,uTime)*uAmpFrom;pf.y+=wf;}',
        '  if(uAmpTo>0.){wt=waveY(pt.xz,uTime)*uAmpTo;pt.y+=wt;}',
        '  if(kFrom>.5)pf=spinAbout(pf,uAxF,uSwF);',
        '  if(kTo>.5)pt=spinAbout(pt,uAxT,uSwT);',
        '  float m=clamp(uMix*(1.+uSt)-aRand*uSt,0.,1.);m=m*m*(3.-2.*m);',
        '  vec3 p;',
        '  if(uMls>.5&&aFg>.5){vec2 w1=mlsWarp(pf.xy,clamp(uMix,0.,1.));p=vec3(w1+aRes*m,mix(pf.z,pt.z,m));}',
        '  else p=mix(pf,pt,m);',
        '  float arc=sin(m*3.14159265);',
        '  vec3 n=vec3(sin(aRand*43.+uTime*.7+p.y*.6),sin(aRand*71.+uTime*.6+p.z*.6),cos(aRand*57.+uTime*.8+p.x*.6));',
        '  p+=n*arc*uTurb;',
        '  p+=uJit*vec3(sin(uTime*.9+aRand*31.),cos(uTime*.8+aRand*17.),sin(uTime*.7+aRand*23.));',
        '  vec3 c=mix(cFrom,cTo,m);',
        '  c*=(aFg>.5?uGain:uGB);',
        '  c*=1.+.35*clamp(mix(wf,wt,m),-1.,1.4);',
        '  vec4 mv=modelViewMatrix*vec4(p,1.);',
        '  float dist=-mv.z;',
        '  gl_Position=projectionMatrix*mv;',
        '  float glow=0.;vec3 gcol=vec3(.45,.75,1.);float kz=0.;float sp=0.;',
        '  if(uFieldOn>.5){',
        '    vec2 uv=gl_Position.xy/gl_Position.w*.5+.5;',
        /* figure particles read the figure's own field (blue/alpha channels, fed only while the pointer is on the figure); background particles read the full one (red/green) */
        '    vec4 fc=texture2D(uField,uv);',
        '    vec4 sel=aFg>.5?vec4(0.,0.,1.,0.):vec4(1.,0.,0.,0.);',
        '    float v=dot(fc,sel);float rim=((aFg>.5?fc.a:fc.g)-.5)*2.;',
        '    vec2 e=uTexel*2.;',
        '    float fl=dot(texture2D(uField,uv-vec2(e.x,0.)),sel);float fr=dot(texture2D(uField,uv+vec2(e.x,0.)),sel);',
        '    float ft=dot(texture2D(uField,uv+vec2(0.,e.y)),sel);float fb=dot(texture2D(uField,uv-vec2(0.,e.y)),sel);',
        '    vec2 g=vec2(fr-fl,ft-fb);',
        '    float ang=aRand*6.2831853+uTime*.55;',
        '    vec2 jit=vec2(cos(ang),sin(ang));',
        '    vec2 off=-g*.08+jit*(v*.03+max(rim,0.)*.05);',
        '    gl_Position.xy+=vec2(off.x,off.y)*gl_Position.w*(aFg>.5?1.:.5);',
        '    glow=v*.8+max(rim,0.)*1.6;',
        '    if(aFg<.5)glow=min(glow,.8)*.5;',
        '    float bgk=aFg<.5?mix(uPoseF,uPoseT,m):0.;',
        '    vec4 hv=texture2D(uHeat,uv);',
        '    float cov=smoothstep(.02,.4,hv.a)*(1.-bgk);',
        '    vec3 hc=hv.rgb*1.2/max(hv.a,.02);',
        /* shimmering gold: a slow metallic shimmer on every touched particle and, only on a few (about 7%), a brief bright glint that also swells the dot */
        '    float shim=.86+.14*sin(aRand*91.7+uTime*(2.2+aRand*3.1));',
        '    float tw=pow(max(0.,sin(uTime*(5.+aRand*7.)+aRand*173.)),36.)*step(.93,fract(aRand*37.7));',
        '    hc=hc*shim+vec3(1.,.94,.66)*tw*2.6;',
        '    sp=tw*cov;',
        '    c=mix(c,hc,cov);gcol=mix(gcol,hc,cov);',
        '    kz=clamp(max(max(v*8.,max(rim,0.)*3.),cov),0.,1.);',
        '    if(aFg>.5)c*=mix(1.,1./uRs.x,kz*(1.-cov));',   /* dots shrunk to the old cursor size give back part of the light they lost */
        '  }',
        '  float s=mix(sFrom,sTo,m);',
        '  gl_PointSize=s*uPx*uPsz*mix(1.,aFg>.5?uRs.x:1.,kz)*(11./dist)*(1.+arc*(uMls>.5?.12:.5))*(1.+glow*(aFg>.5?1.:.5))*(1.+sp*1.4);',
        '  vSoft=clamp((uFocus-dist)/9.,0.,1.)+clamp((dist-uFocus-8.)/12.,0.,.5);',
        '  vCol=(c*(1.-.25*arc)+gcol*glow*.7)*uFade;',
        '}'
      ].join('\n'),
      fragmentShader:[
        'varying vec3 vCol;varying float vSoft;',
        'void main(){',
        '  vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;',
        '  float sharp=smoothstep(.5,.36,d);float soft=smoothstep(.5,0.,d)*.55;',
        '  float a=mix(sharp,soft,clamp(vSoft,0.,1.))*.9;',
        '  gl_FragColor=vec4(vCol,a);',
        '}'
      ].join('\n')
    });
    points=new THREE.Points(geo,mat);points.frustumCulled=false;group.add(points);
  }

  function resize(){
    computeViews();
    if(renderer){
      renderer.setSize(innerWidth,innerHeight,false);
      camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
      mat.uniforms.uAspect.value=innerWidth/innerHeight;
      fieldInit();mat.uniforms.uField.value=fieldTex;mat.uniforms.uHeat.value=heatTex;mat.uniforms.uTexel.value.set(1/FW,1/FH);
    }
  }

  /* ---------------- cursor field ----------------
     A small wave-like simulation the pointer paints into (the same idea as igloo.inc's ice blocks).
     - a line splat along the pointer path, radius driven by pointer speed
     - every other step each cell takes its brightest neighbour (x LOSS), so a disturbance widens and weakens as it spreads
     - everything decays; the per-step change is kept as a "rim" for the leading edge
     Two extra channels carry heat: a phase (0 where the pointer just touched, creeping to 1 over ~2.5 s) and a presence that spreads with the ripple.
     The particle shader turns the phase into red -> orange -> yellow -> white -> back to the particle's own blue. */
  function fieldInit(){
    /* The field grid follows the size of the figure: a cell is 6.75 px on the 1920x1080 reference and shrinks with the figure on smaller windows (finer grid, capped for speed),
       and the ripple's reach is scaled to the same fraction of the figure, so the touched area keeps its proportion to the body at every size. */
    var cellW=6.75*Math.max(.25,Math.min(1.25,curR));
    FH=Math.max(110,Math.min(300,Math.round(innerHeight/cellW)));
    FW=Math.max(24,Math.min(360,Math.round(FH*innerWidth/innerHeight)));
    var cell=innerHeight/FH,m=Math.max(.25,Math.min(1.6,(55*6.75*curR/cell)/55));
    var K2=CUR_KEEP*CUR_KEEP;
    curLoss=Math.max(.5,Math.min(.9995,Math.pow(CUR_LOSS*K2,1/m)/K2));heatLoss=Math.max(.5,Math.min(.9995,Math.pow(HEAT_LOSS,1/m)));
    var n=FW*FH;
    fA=new Float32Array(n);fB=new Float32Array(n);gA=new Float32Array(n);gB=new Float32Array(n);gLive=0;
    hTA=new Float32Array(n);hTB=new Float32Array(n);hSA=new Float32Array(n);hSB=new Float32Array(n);hKA=new Uint8Array(n);hKB=new Uint8Array(n);
    fData=new Uint8Array(n*4);hData=new Uint8Array(n*4);
    nOffX=new Int8Array(n);nOffY=new Int8Array(n);
    for(var y=0;y<FH;y++)for(var x=0;x<FW;x++){
      var n1=Math.sin(x*.37+y*.21)+Math.sin(x*.13-y*.29+1.7)*.8+Math.sin((x+y)*.11+4.1)*.6;
      var n2=Math.sin(x*.19-y*.33+2.3)+Math.sin(x*.41+y*.17+.4)*.8+Math.sin((x-y)*.09+3.3)*.6;
      nOffX[y*FW+x]=n1>.9?1:(n1<-.9?-1:0);nOffY[y*FW+x]=n2>.9?1:(n2<-.9?-1:0);
    }
    for(var i=0;i<n;i++){fData[i*4+1]=128;fData[i*4+3]=128;}
    if(THREE.DataTexture){
      fieldTex=new THREE.DataTexture(fData,FW,FH,THREE.RGBAFormat);
      fieldTex.minFilter=THREE.LinearFilter;fieldTex.magFilter=THREE.LinearFilter;fieldTex.generateMipmaps=false;fieldTex.needsUpdate=true;
      heatTex=new THREE.DataTexture(hData,FW,FH,THREE.RGBAFormat);
      heatTex.minFilter=THREE.LinearFilter;heatTex.magFilter=THREE.LinearFilter;heatTex.generateMipmaps=false;heatTex.needsUpdate=true;
    }
    pt.has=false;fieldLive=0;ep.t=-1;ep.gap=0;ep.still=0;
  }
  function onMove(e){
    pxT=(e.clientX/innerWidth-.5)*2;pyT=(e.clientY/innerHeight-.5)*2;
    if(reduce||!renderer)return;
    pt.cx=e.clientX;pt.cy=e.clientY;
    pt.x=e.clientX/innerWidth*FW;pt.y=(1-e.clientY/innerHeight)*FH;
    if(!pt.has){pt.has=true;pt.lx=pt.x;pt.ly=pt.y;}
    pt.dirty=true;
  }
  /* Is the pointer on the figure? The silhouette (cut-out mask) of the pose on screen is looked up through the current position, scale and tilt of the figure.
     The wave and the DNA frame have no silhouette: the whole frame counts. */
  function onFigure(tg){
    if(!tg||!tg.sil)return true;
    var wx=(pt.cx-innerWidth/2)/PPU-group.position.x,wy=-(pt.cy-innerHeight/2)/PPU-group.position.y;
    var rz=group.rotation.z,c=Math.cos(rz),s=Math.sin(rz),sc=group.scale.x||1;
    var u=((wx*c+wy*s)/sc)/AR+.5,v=.5-((-wx*s+wy*c)/sc);
    if(u<0||u>=1||v<0||v>=1)return false;
    return tg.sil[((v*SIL_H)|0)*SIL_W+((u*SIL_W)|0)]===1;
  }
  function fieldStep(){
    simT+=1/66;
    var now=simT;
    var e=Math.hypot(pt.x-pt.lx,pt.y-pt.ly)/FH,t=now-pt.lastMove;
    if(e>0)pt.lastMove=now;
    if(!pt.has||t>.15||e>.3){pt.lx=pt.x;pt.ly=pt.y;pt.tv=0;e=0;}
    pt.tv+=e*6;pt.tv*=.88;pt.tv=clamp(pt.tv,0,1);
    var po=1-Math.pow(1-pt.tv,4);pt.v+=(po-pt.v)*.1;
    var radPx=(CUR_R0+(CUR_R1-CUR_R0)*sstep(.05,.8,pt.v))*curS,rad=radPx*FH/innerHeight;
    /* contact episode: starts when the moving cursor touches the figure, ends when it leaves it (0.12 s grace) or rests (0.35 s) */
    var moving=pt.v>.03||e>.0004;
    if(!pt.onFig){ep.gap+=1/66;if(ep.gap>.12)ep.t=-1;}else ep.gap=0;
    if(moving)ep.still=0;else ep.still+=1/66;
    if(ep.t>=0&&ep.still>.35)ep.t=-1;
    if(ep.t<0){if(pt.onFig&&moving){ep.t=0;ep.ox=pt.x;ep.oy=pt.y;}}
    else{
      ep.t+=1/66;
      /* a finished sequence starts again once the cursor has travelled to a new part of the figure */
      if(ep.t>=HEAT_EMIT&&Math.hypot(pt.x-ep.ox,pt.y-ep.oy)>.18*FH){ep.t=0;ep.ox=pt.x;ep.oy=pt.y;}
    }
    var layer=(ep.t>=0&&ep.t<HEAT_EMIT)?0:-1;
    var mx=0,gmx=0,i,x,y;
    var spread=(stepN++&1)===0,i2,gOn=gLive>.0005||(pt.onFig&&pt.v>.03&&rad>.5);
    for(y=0;y<FH;y++){
      for(x=0;x<FW;x++){
        i2=y*FW+x;
        var sx=x+nOffX[i2],sy=y+nOffY[i2];
        if(sx<0)sx=0;else if(sx>=FW)sx=FW-1;if(sy<0)sy=0;else if(sy>=FH)sy=FH-1;
        var j=sy*FW+sx,v=fA[j],ht=hTA[j],hs=hSA[j],hk=hKA[j];
        if(spread){
          var l=sx>0?fA[j-1]:0,r=sx<FW-1?fA[j+1]:0,b=sy>0?fA[j-FW]:0,tp=sy<FH-1?fA[j+FW]:0;
          var nb=l,nj=j-1;if(r>nb){nb=r;nj=j+1;}if(b>nb){nb=b;nj=j-FW;}if(tp>nb){nb=tp;nj=j+FW;}
          nb*=curLoss;
          if(nb>v){v=nb;ht=hTA[nj];hs=hSA[nj]*heatLoss;hk=hKA[nj];}      // the ripple carries the colour it was emitted with outwards, thinning as it goes
        }
        fB[i2]=v;hTB[i2]=ht;hSB[i2]=hs;hKB[i2]=hk;
        if(gOn){      // the figure's own copy of the field: the same spreading, but only the pointer on the figure feeds it
          var gv=gA[j];
          if(spread){var gl=sx>0?gA[j-1]:0,gr=sx<FW-1?gA[j+1]:0,gb=sy>0?gA[j-FW]:0,gt=sy<FH-1?gA[j+FW]:0,gn=gl;if(gr>gn)gn=gr;if(gb>gn)gn=gb;if(gt>gn)gn=gt;gn*=curLoss;if(gn>gv)gv=gn;}
          gB[i2]=gv;
        }
      }
    }
    var splat=pt.v>.03&&rad>.5,heatOnly=!splat&&layer>=0&&e>0&&rad>.5,fgSplat=splat&&pt.onFig;
    if(splat||heatOnly){
      var ax=pt.lx,ay=pt.ly,bx=pt.x,by=pt.y,dx=bx-ax,dy=by-ay,dd=dx*dx+dy*dy;
      var x0=Math.max(0,Math.floor(Math.min(ax,bx)-rad)),x1=Math.min(FW-1,Math.ceil(Math.max(ax,bx)+rad));
      var y0=Math.max(0,Math.floor(Math.min(ay,by)-rad)),y1=Math.min(FH-1,Math.ceil(Math.max(ay,by)+rad));
      for(y=y0;y<=y1;y++)for(x=x0;x<=x1;x++){
        var h=dd>0?clamp(((x-ax)*dx+(y-ay)*dy)/dd,0,1):0;
        var qx=x-(ax+dx*h),qy=y-(ay+dy*h),q=1-Math.sqrt(qx*qx+qy*qy)/rad;
        if(q>0){
          var k=y*FW+x;if(splat){fB[k]+=q*q;if(fgSplat)gB[k]+=q*q;}
          var hs2=Math.min(1,q*2.4);
          if(layer>=0&&hs2>.05&&(hTB[k]!==now||hs2>hSB[k])){hTB[k]=now;hSB[k]=hs2;hKB[k]=layer;}   // this step's emission: colour = the layer the contact clock is in
        }
      }
    }
    for(i=0;i<FW*FH;i++){
      var nv=fB[i]*CUR_KEEP;if(nv>1)nv=1;if(nv<.002)nv=0;
      var rim=nv-fA[i];
      fB[i]=nv;if(nv>mx)mx=nv;
      var o=i*4;fData[o]=nv*255;
      fData[o+1]=128+clamp(rim*3,-1,1)*127;
      if(gOn){var gn2=gB[i]*CUR_KEEP;if(gn2>1)gn2=1;if(gn2<.002)gn2=0;var grim=gn2-gA[i];gB[i]=gn2;if(gn2>gmx)gmx=gn2;fData[o+2]=gn2*255;fData[o+3]=128+clamp(grim*3,-1,1)*127;}
      else{fData[o+2]=0;fData[o+3]=128;}
      var hS=nv===0?0:hSB[i]*HEAT_KEEP;
      if(hS>.004){
        var age=now-hTB[i];
        if(age>=HEAT_LIFE)hS=0;
        else{
          var f=(age-HEAT_FADE0)/(HEAT_LIFE-HEAT_FADE0);f=f<0?0:(f>1?1:f);
          var w=hS*(1-f*f*(3-2*f)),k3=hKB[i]*3,w2=w*255/1.2;
          hData[o]=HC[k3]*w2;hData[o+1]=HC[k3+1]*w2;hData[o+2]=HC[k3+2]*w2;hData[o+3]=w*255;
          hSB[i]=hS;
          continue;
        }
      }
      hSB[i]=0;hData[o]=0;hData[o+1]=0;hData[o+2]=0;hData[o+3]=0;
    }
    var tmp=fA;fA=fB;fB=tmp;tmp=hTA;hTA=hTB;hTB=tmp;tmp=hSA;hSA=hSB;hSB=tmp;tmp=hKA;hKA=hKB;hKB=tmp;
    pt.lx=pt.x;pt.ly=pt.y;
    tmp=gA;gA=gB;gB=tmp;gLive=gmx;
    fieldLive=mx;
    if(e===0&&pt.v<.01&&mx<.0005)pt.dirty=false;
  }
  function fieldUpdate(dt,tg){
    if(reduce||!renderer||!fieldTex)return;
    if(!pt.dirty&&fieldLive<.0005){simAcc=0;mat.uniforms.uFieldOn.value=0;ep.t=-1;return;}
    pt.onFig=onFigure(tg);
    simAcc=Math.min(simAcc+dt,.05);
    var did=false;
    while(simAcc>=1/66){simAcc-=1/66;fieldStep();did=true;}
    if(did){fieldTex.needsUpdate=true;heatTex.needsUpdate=true;}
    mat.uniforms.uFieldOn.value=(fieldLive>.004||pt.v>.02)?1:0;
  }

  /* ---------------- scroll ----------------
     No snapping and no stage-to-stage tween. Wheel, touch and keys only move a continuous target; two stages of exponential smoothing carry the
     figure to it, so the morph follows the hand and can be stopped anywhere inside a transition. */
  /* Every finished pose + card has a stretch of scroll where nothing moves (a plateau of PLAT stage-units of wheel/touch travel). Input moves a raw scroll position; the
     target stage is a function of it: flat on each plateau, a straight ramp between two plateaus. */
  var PLAT=(window.__TUNE&&__TUNE.plat!=null)?__TUNE.plat:.5,PL=1+PLAT,raw=0,freeJump=false;
  function rawToTgt(r){var s=Math.round(r/PL),a=r-s*PL,m=Math.abs(a)-PLAT/2;return m<=0?s:s+(a<0?-m:m);}
  var WPS=620;                                    // wheel pixels per stage
  var cueGone=false;
  function nudge(d){raw+=d;}
  var resOpen=false,liveS=[];                     // resOpen: the sources card is on screen (stage scrolling pauses while it is)
  function panelOf(el){return el&&el.closest?el.closest('.pgs,.panel,#resCard ol,#pw .pwscroll'):null;}
  function panelCanScroll(el,dy){
    var p=panelOf(el);
    if(!p||p.scrollHeight<=p.clientHeight+2)return false;
    if(dy>0)return p.scrollTop+p.clientHeight<p.scrollHeight-2;
    return p.scrollTop>0;
  }
  window.addEventListener('wheel',function(e){
    if(e.ctrlKey)return;
    var dy=e.deltaMode===1?e.deltaY*33:(e.deltaMode===2?e.deltaY*innerHeight:e.deltaY);
    if(Math.abs(dy)<Math.abs(e.deltaX))return;
    if(resOpen){if(!panelCanScroll(e.target,dy))e.preventDefault();return;}
    if(panelCanScroll(e.target,dy))return;
    e.preventDefault();
    nudge(dy/WPS);
  },{passive:false});
  var tY=0,tOn=false,tV=0,tLast=0,tEl=null;
  window.addEventListener('touchstart',function(e){
    if(e.touches.length!==1){tOn=false;return;}
    tY=e.touches[0].clientY;tOn=true;tV=0;tLast=performance.now();tEl=e.target;
  },{passive:true});
  window.addEventListener('touchmove',function(e){
    if(!tOn||e.touches.length!==1||resOpen||window.__rackH)return;
    var y=e.touches[0].clientY,dy=tY-y,now=performance.now(),dt=Math.max(8,now-tLast)/1000;
    tY=y;tLast=now;
    if(panelCanScroll(tEl,dy))return;
    var d=dy/(innerHeight*.5);
    nudge(d);tV=tV*.7+(d/dt)*.3;
  },{passive:true});
  function touchEnd(){if(!tOn)return;tOn=false;if(performance.now()-tLast<90)nudge(clamp(tV*.16,-1.2,1.2));}
  window.addEventListener('touchend',touchEnd,{passive:true});
  window.addEventListener('touchcancel',touchEnd,{passive:true});
  window.addEventListener('keydown',function(e){
    var t=e.target,tag=t&&t.tagName;
    if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'||resOpen)return;
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    var k=e.key;
    if(k==='ArrowDown'||k==='PageDown'||(k===' '&&tag!=='BUTTON')){e.preventDefault();raw=(e.shiftKey&&k===' '?Math.ceil(raw/PL-1e-3)-1:Math.floor(raw/PL+1e-3)+1)*PL;}
    else if(k==='ArrowUp'||k==='PageUp'){e.preventDefault();raw=(Math.ceil(raw/PL-1e-3)-1)*PL;}
    else if(k==='Home'){e.preventDefault();raw=Math.round(cur/STAGES)*STAGES*PL;freeJump=true;}
    else if(k==='End'){e.preventDefault();raw=(Math.round((cur-(STAGES-1))/STAGES)*STAGES+STAGES-1)*PL;freeJump=true;}
  });

  /* Touching anything interactive on a card brings its stage to the finished (100%) phase: the scroll target jumps to the middle of that stage's plateau. */
  function snapStage(ev){
    var t=ev.target;if(!t||!t.closest||!t.closest('.sec,.mc'))return;
    if(!t.closest('button,a,input,select,textarea,label,[role=button]'))return;
    var s=stages.indexOf(t.closest('.stage'));if(s<0)return;
    var k=s+STAGES*Math.round((cur-s)/STAGES);
    if(Math.abs(cur-k)>.6)return;
    if(Math.abs(raw-k*PL)>.001){raw=k*PL;freeJump=false;}
  }
  document.addEventListener('pointerdown',snapStage,true);
  document.addEventListener('focusin',snapStage,true);
  document.addEventListener('input',snapStage,true);

  /* ---------------- panels: spin in as one shape, the text flips into place as if typed ----------------
     Every letter is its own little flap. A band sweeps across the block (left to right, slightly downward); letters inside the band flip up
     from edge-on, letters ahead of it are still edge-on, letters behind it are set. Pictures and sliders just come up with their block. */
  /* every page with sources gets a Sources link before the text is cut into letters */
  $$('.sec').forEach(function(card){
    $$('.pg',card).forEach(function(pg){
      if(!pg.getAttribute('data-res'))return;
      var p=document.createElement('p'),b=document.createElement('button');p.className='srcrow';b.type='button';b.className='srcb';b.textContent='Sources';p.appendChild(b);pg.appendChild(p);
    });
  });
  var panelEls=stages.map(function(s){return s.querySelector('.panel');});
  var blocks=stages.map(function(s){
    var out=[];
    $$(':scope > .panel > .intro > *, :scope > .panel > .sec > *',s).forEach(function(b){
      if(b.classList.contains('pgs')&&b.children.length===1&&b.firstElementChild.classList.contains('pg')){[].forEach.call(b.firstElementChild.children,function(c){out.push(c);});}   // a card with one page: its paragraphs wipe in one by one
      else out.push(b);
    });
    return out;
  });
  /* ---- card frame, page arrows and page number. Built after `blocks` so they are not part of the letter wipe. ----
     The outline follows the reference card: rounded corners, a chamfered notch at the top and bottom centre and one in the middle of each side. */
  var SVGNS='http://www.w3.org/2000/svg';
  function cardPath(w,h,i,d){
    var r=10,x0=i,y0=i,x1=w-i,y1=h-i,cx=w/2,cy=h/2;
    if(!(d>0))return 'M'+x0+' '+(y0+r)+'Q'+x0+' '+y0+' '+(x0+r)+' '+y0+'L'+(x1-r)+' '+y0+'Q'+x1+' '+y0+' '+x1+' '+(y0+r)+'L'+x1+' '+(y1-r)+'Q'+x1+' '+y1+' '+(x1-r)+' '+y1+'L'+(x0+r)+' '+y1+'Q'+x0+' '+y1+' '+x0+' '+(y1-r)+'Z';
    var a=Math.min(Math.max(26,Math.min(46,w*.075)),w/2-d-r-2),b=Math.min(Math.max(28,Math.min(62,h*.1)),h/2-d-r-2);
    return 'M'+x0+' '+(y0+r)+'Q'+x0+' '+y0+' '+(x0+r)+' '+y0
      +'L'+(cx-a-d)+' '+y0+'L'+(cx-a)+' '+(y0+d)+'L'+(cx+a)+' '+(y0+d)+'L'+(cx+a+d)+' '+y0
      +'L'+(x1-r)+' '+y0+'Q'+x1+' '+y0+' '+x1+' '+(y0+r)
      +'L'+x1+' '+(cy-b-d)+'L'+(x1-d)+' '+(cy-b)+'L'+(x1-d)+' '+(cy+b)+'L'+x1+' '+(cy+b+d)
      +'L'+x1+' '+(y1-r)+'Q'+x1+' '+y1+' '+(x1-r)+' '+y1
      +'L'+(cx+a+d)+' '+y1+'L'+(cx+a)+' '+(y1-d)+'L'+(cx-a)+' '+(y1-d)+'L'+(cx-a-d)+' '+y1
      +'L'+(x0+r)+' '+y1+'Q'+x0+' '+y1+' '+x0+' '+(y1-r)
      +'L'+x0+' '+(cy+b+d)+'L'+(x0+d)+' '+(cy+b)+'L'+(x0+d)+' '+(cy-b)+'L'+x0+' '+(cy-b-d)+'Z';
  }
  /* the legend card: rounded, with a 45 degree nook cut into the upper right corner */
  function cornerPath(w,h,i,d){
    var r=8,x0=i,y0=i,x1=w-i,y1=h-i,k=i*(Math.SQRT2-1),ax=w-d-k,ay=d+k;
    return 'M'+x0+' '+(y0+r)+'Q'+x0+' '+y0+' '+(x0+r)+' '+y0+'L'+ax+' '+y0+'L'+x1+' '+ay+'L'+x1+' '+(y1-r)+'Q'+x1+' '+y1+' '+(x1-r)+' '+y1+'L'+(x0+r)+' '+y1+'Q'+x0+' '+y1+' '+x0+' '+(y1-r)+'Z';
  }
  function shapeCard(card){
    var w=card.offsetWidth,h=card.offsetHeight,f=card._frame;
    if(!f||!w||!h)return;
    var d=parseFloat(getComputedStyle(card).getPropertyValue('--nook'))||0;
    if(f.w===w&&f.h===h&&f.d===d)return;f.w=w;f.h=h;f.d=d;
    f.svg.setAttribute('viewBox','0 0 '+w+' '+h);
    var P=card.classList.contains('legend')?cornerPath:cardPath;
    f.o.setAttribute('d',P(w,h,.5,d));f.i.setAttribute('d',P(w,h,card.classList.contains('legend')?4.5:6.5,d));
    card.style.setProperty('--clip',"path('"+P(w,h,0,d)+"')");
  }
  var shapeRO=window.ResizeObserver?new ResizeObserver(function(es){es.forEach(function(e){shapeCard(e.target);});}):null;
  var NAVL='<svg viewBox="0 0 16 28" aria-hidden="true"><path d="M14 2L3 14L14 26"/><path d="M14 8L8 14L14 20"/></svg>',NAVR='<svg viewBox="0 0 16 28" aria-hidden="true"><path d="M2 2L13 14L2 26"/><path d="M2 8L8 14L2 20"/></svg>';
  $$('.sec,.mc').forEach(function(card){
    var svg=document.createElementNS(SVGNS,'svg'),po=document.createElementNS(SVGNS,'path'),pi=document.createElementNS(SVGNS,'path');
    svg.setAttribute('class','frame');svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');
    po.setAttribute('class','o');pi.setAttribute('class','i');svg.appendChild(pi);svg.appendChild(po);
    card.insertBefore(svg,card.firstChild);card._frame={svg:svg,o:po,i:pi,w:0,h:0,d:-1};
    card.classList.add('shaped');
    if(card.classList.contains('sec')&&$$('.pg',card).length>1){
      /* arrows in the side nooks, page number in the bottom nook */
      var pv=document.createElement('button'),nx=document.createElement('button'),pn=document.createElement('div');
      pv.type='button';pv.className='nav prev hint';pv.setAttribute('aria-label','Previous page');pv.innerHTML=NAVL;
      nx.type='button';nx.className='nav next hint';nx.setAttribute('aria-label','Next page');nx.innerHTML=NAVR;
      pn.className='pgn';pn.setAttribute('role','status');
      card.appendChild(pv);card.appendChild(nx);card.appendChild(pn);
    }
    if(shapeRO)shapeRO.observe(card);shapeCard(card);
  });
  /* hero: a 50% dark strip across the full width behind the text block */
  var strip=$('#s0 .strip'),introEl=$('#s0 .intro');
  function stripLayout(){
    if(!strip||!introEl)return;
    var a=stages[0].getBoundingClientRect(),r=introEl.getBoundingClientRect(),pad=Math.round(Math.min(26,innerHeight*.03));
    strip.style.top=(r.top-a.top-pad)+'px';strip.style.height=(r.height+2*pad)+'px';
  }
  var BAND=.35;                                   // the flipping band is 35% of the block wide
  var FLIPS=3;                                    // every letter flips this many times in the band: random letter, random letter, its own letter
  var UP='ABCDEFGHIJKLMNOPQRSTUVWXYZ',LO='abcdefghijklmnopqrstuvwxyz',DG='0123456789';
  var chars=blocks.map(function(bl){return bl.map(function(){return [];});});      // per stage, per block: [{el,t,l}]
  var media=blocks.map(function(bl){return bl.map(function(b){var m=$$('svg,input,select,textarea,canvas',b);if(b.matches&&b.matches('svg,input,select,textarea,canvas'))m.push(b);return m;});});
  var lastR=stages.map(function(){return -1;}),lastK=blocks.map(function(b){return b.map(function(){return -1;});});
  function skipNode(n,top){
    for(var e=n.parentNode;e&&e!==top.parentNode;e=e.parentNode){
      if(e.nodeType!==1)continue;
      var tg=e.tagName;
      if(e.id||(e.classList&&e.classList.contains('dyn'))||tg==='SVG'||tg==='svg'||tg==='OUTPUT'||tg==='SELECT'||tg==='OPTION'||tg==='TEXTAREA'||tg==='SCRIPT'||tg==='STYLE'||tg==='CANVAS')return true;   // text that widgets rewrite stays plain
    }
    return false;
  }
  function glueEdges(top){                                                       // keep punctuation that touches an inline element (a link, bold word) on the same line as it
    var els=[].slice.call(top.querySelectorAll('a,b,strong,em,i,.dyn'));
    els.forEach(function(el){
      if(el.closest('.nb')||getComputedStyle(el).display!=='inline')return;
      var pv=el.previousSibling,nx=el.nextSibling,st=[],a=el,z=el,m;
      if(pv&&pv.nodeType===3&&(m=/\S+$/.exec(pv.nodeValue))&&m[0].length<pv.nodeValue.length){a=pv.splitText(pv.nodeValue.length-m[0].length);}
      else if(pv&&pv.nodeType===3&&/^\S+$/.test(pv.nodeValue)&&!pv.previousSibling)a=pv;
      if(nx&&nx.nodeType===3&&/^\S/.test(nx.nodeValue)){m=/^\S+/.exec(nx.nodeValue);if(m[0].length<nx.nodeValue.length)nx.splitText(m[0].length);z=nx;}
      if(a===el&&z===el)return;
      var w=document.createElement('span');w.className='nb';el.parentNode.insertBefore(w,a);
      var n=a;while(n){var nn=n.nextSibling;w.appendChild(n);if(n===z)break;n=nn;}
    });
  }
  function wrapBlock(top,out){
    glueEdges(top);
    var w=document.createTreeWalker(top,NodeFilter.SHOW_TEXT,null),list=[],n;
    while((n=w.nextNode()))list.push(n);
    list.forEach(function(node){
      if(!/\S/.test(node.nodeValue)||skipNode(node,top))return;
      var frag=document.createDocumentFragment(),parts=node.nodeValue.split(/(\s+)/),pv=node.previousSibling,nx=node.nextSibling;
      parts.forEach(function(part){
        if(!part)return;
        if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
        var wd=document.createElement('span');wd.className='wd';
        for(var i=0;i<part.length;i++){var c=document.createElement('span');c.className='ch';c.textContent=part.charAt(i);wd.appendChild(c);out.push({el:c,t:0,l:2,ch:part.charAt(i),w:0,ix:-1});}
        frag.appendChild(wd);
      });
      node.parentNode.replaceChild(frag,node);
    });
  }
  function layoutChars(s){
    var pn=panelEls[s],keep=pn.style.transform;pn.style.transform='none';
    if(s===0)stripLayout();
    blocks[s].forEach(function(b,k){
      var list=chars[s][k];if(!list.length)return;
      var br=b.getBoundingClientRect(),bw=Math.max(1,br.width),bh=Math.max(1,br.height),seed=k*7+s*13;
      list.forEach(function(c,i){
        if(c.ix!==-1){c.el.textContent=c.ch;c.el.style.width='';c.ix=-1;}
        var r=c.el.getBoundingClientRect();c.w=r.width;c.l=-9;
        var xr=clamp((r.left+r.width/2-br.left)/bw,0,1),yr=clamp((r.top+r.height/2-br.top)/bh,0,1);
        var jit=(Math.sin((i+seed)*12.9898)*43758.5453%1+1)%1;
        c.t=clamp(.78*xr+.22*yr+(jit-.5)*.07,0,1);
      });
    });
    pn.style.transform=keep;
  }
  if(reduce){stripLayout();window.addEventListener('resize',stripLayout);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(stripLayout);}
  if(!reduce){
    stages.forEach(function(st,s){blocks[s].forEach(function(b,k){wrapBlock(b,chars[s][k]);});layoutChars(s);});
    var relayout=function(){stages.forEach(function(st,s){layoutChars(s);});for(var s=0;s<lastK.length;s++)lastR[s]=-1,lastK[s]=lastK[s].map(function(){return -1;});};
    window.addEventListener('resize',relayout);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(relayout);
    window.addEventListener('load',relayout);
  }
  function rndCh(c,ix,seed){
    var ch=c.ch,pool=UP.indexOf(ch)>=0?UP:(LO.indexOf(ch)>=0?LO:(DG.indexOf(ch)>=0?DG:null));
    if(!pool)return ch;                                                  // punctuation just flips
    var h=(Math.sin((c.t*977+ix*131+seed)*12.9898)*43758.5453%1+1)%1;
    var r=pool.charAt(Math.floor(h*pool.length));
    return r===ch?pool.charAt((pool.indexOf(r)+7)%pool.length):r;
  }
  function setChars(list,pb,seed){
    var i,q;
    for(i=0;i<list.length;i++){
      var c=list[i],l=clamp((pb*(1+BAND)-c.t)/BAND,0,1);
      if(l>=1){
        if(c.l===1)continue;c.l=1;
        if(c.ix!==-1){c.el.textContent=c.ch;c.el.style.width='';c.ix=-1;}
        c.el.style.transform='';c.el.style.opacity='';
      }else if(l<=0){
        if(c.l===0)continue;c.l=0;
        if(c.ix!==-1){c.el.textContent=c.ch;c.el.style.width='';c.ix=-1;}
        c.el.style.opacity='0';c.el.style.transform='perspective(260px) rotateX(-90deg)';
      }else{
        /* inside the band: the letter flips FLIPS times; the first ones show other letters, the last one its own */
        var f=l*FLIPS,ix=Math.min(FLIPS-1,Math.floor(f)),fr=f-ix;
        if(ix!==c.ix){
          if(c.ix===-1){c.el.style.width=c.w.toFixed(2)+'px';}
          c.ix=ix;c.el.textContent=ix===FLIPS-1?c.ch:rndCh(c,ix,seed);
        }
        q=fr*fr*(3-2*fr);
        c.l=l;c.el.style.opacity='1';c.el.style.transform='perspective(260px) rotateX('+(-(1-q)*90).toFixed(1)+'deg)';
      }
    }
  }
  function setBlock(s,k,pb){
    var m=media[s][k],op=pb<=0?0:(pb>=1?1:pb*pb*(3-2*pb));
    for(var i=0;i<m.length;i++){m[i].style.opacity=op>=1?'':String(op.toFixed(3));}
    setChars(chars[s][k],pb,s*31+k*7);
  }
  function panelFrame(s,r){
    var el=stages[s],pn=panelEls[s],bl=blocks[s],n=bl.length;
    if(r<.003){
      if(el.style.visibility!=='hidden'){el.style.visibility='hidden';el.style.opacity='0';el.style.pointerEvents='none';lastR[s]=-1;}
      return;
    }
    if(Math.abs(r-lastR[s])<.0015)return;
    lastR[s]=r;
    el.style.visibility='visible';el.style.opacity='1';
    el.style.pointerEvents=r>.15?'auto':'none';
    pn.style.opacity=String(sstep(0,.25,r).toFixed(3));
    if(s===0&&strip)strip.style.opacity=pn.style.opacity;
    if(reduce){pn.style.transform='none';return;}
    var dir=sides[s]==='l'?-1:1;
    pn.style.transform=r>=.999?'none':'perspective(1500px) rotateY('+((1-sstep(0,.8,r))*84*dir).toFixed(2)+'deg)';
    for(var k=0;k<n;k++){
      var pb=clamp((r-.22-.55*k/n)/.3,0,1);
      if(Math.abs(pb-lastK[s][k])>.002||(pb>=1)!==(lastK[s][k]>=1)||(pb<=0)!==(lastK[s][k]<=0)){lastK[s][k]=pb;setBlock(s,k,pb);}
    }
  }

  if(window.__TUNE){window.__TUNE.ext=function(k){var p=T[k].pos,a=1e9,b=-1e9,c=1e9,d=-1e9,i,n=0,q=[];for(i=0;i<N;i++){var x=p[i*3],y=p[i*3+1];if(x<a)a=x;if(x>b)b=x;if(y<c)c=y;if(y>d)d=y;}return [a,b,c,d,N,ORD.join(','),JSON.stringify(views[k]),T[k].tilt];};window.__TUNE.set=function(v){tgt=sm=cur=v;raw=v*PL;};window.__TUNE.incomplete=function(q){var n=0,t=0;chars[q].forEach(function(l){l.forEach(function(c){t++;if(c.l!==1)n++;});});return [n,t,blocks[q].length];};window.__TUNE.state=function(){return {raw:raw,cur:cur,tgt:tgt,ep:ep.t,onFig:pt.onFig,v:pt.v,live:fieldLive,simT:simT,views:views.slice(1,3)};};}   // test hooks only
  /* ---------------- frame loop ---------------- */
  var last=performance.now(),t0=last;
  var hudNum=$('#hudNum'),hudName=$('#hudName'),cue=$('#cue'),hudIdx=-1;
  var hudSel=null;
  function gotoStage(s){raw=(Math.round((cur-s)/STAGES)*STAGES+s)*PL;freeJump=true;}   // nearest copy of stage s in the endless loop
  function updateHud(q){
    if(q===hudIdx)return;hudIdx=q;if(hudSel)hudSel.selectedIndex=q;
    hudNum.textContent=nums[q]+' / '+pad2(STAGES);hudName.textContent=names[q];
  }
  function frame(now){
    var dt=Math.min(.05,(now-last)/1000);last=now;
    if(!imagesReady&&now>imgDeadline)imagesReady=true;
    if(introStart===null&&imagesReady)introStart=now+250;
    if(!reduce)introT=introStart===null?0:clamp((now-introStart)/2400,0,1);
    /* The raw scroll position may run at most one stage ahead of (or behind) the stage on screen: a hard flick steps through the stages one at a time instead of queueing up,
       and always comes to rest at the start of the next plateau. Home/End jump straight there. */
    if(!reduce&&introT>=1){
      if(freeJump){if(Math.abs(cur-rawToTgt(raw))<.01)freeJump=false;}
      else{
        var nr=Math.round(cur),dN=Math.abs(cur-nr),lo,hi;
        if(dN<=.06){lo=nr-1;hi=nr+1;}else{lo=Math.floor(cur+.01);hi=Math.ceil(cur-.01);}
        raw=clamp(raw,lo*PL+PLAT/2,hi*PL-PLAT/2);
      }
    }
    tgt=rawToTgt(raw);
    if(reduce){sm=tgt;cur=tgt;}
    else{sm+=(tgt-sm)*(1-Math.exp(-dt*8.5));cur+=(sm-cur)*(1-Math.exp(-dt*5.5));if(Math.abs(cur-tgt)<5e-4){cur=tgt;sm=tgt;}}
    glowTick();
    /* the loop: stage s is ORD[s mod 10] (DNA, pose 1..9); scrolling past the last pose comes back to the DNA, and the other way round */
    var ci=Math.floor(cur+1e-6),mx=cur-ci,i=ORD[mod(ci,STAGES)],j=ORD[mod(ci+1,STAGES)];
    mx=sstep(.05,.95,mx);
    if(tgt>=STAGES&&sm>=STAGES&&cur>=STAGES){tgt-=STAGES;sm-=STAGES;cur-=STAGES;raw-=STAGES*PL;}
    else if(tgt<0&&sm<0&&cur<0){tgt+=STAGES;sm+=STAGES;cur+=STAGES;raw+=STAGES*PL;}
    px+=(pxT-px)*(1-Math.exp(-dt*3));py+=(pyT-py)*(1-Math.exp(-dt*3));

    for(var s=0;s<STAGES;s++){
      var d0=Math.abs(cur-s)%STAGES,d=Math.min(d0,STAGES-d0),r=1-sstep(.08,.5,d);
      if(s===0)r*=sstep(.5,.85,introT);
      panelFrame(s,r);
      if(r>.9){if(liveS[s]!==1){liveS[s]=1;onStageLive(s,1);}}
      else{
        if(r<.5&&liveS[s]===1){liveS[s]=2;onStageLeave(s);}      // on its way out
        if(r<.05&&liveS[s]){liveS[s]=0;onStageLive(s,0);}         // gone
      }
    }
    updateHud(mod(Math.round(cur),STAGES));
    if(!cueGone&&tgt>.04){cueGone=true;}
    cue.style.opacity=String(cueGone?0:sstep(.85,1,introT));

    if(renderer){
      if(i!==curFrom||j!==curTo)bind(i,j,false);
      var vi=views[i],vj=views[j],e=mx*mx*(3-2*mx);
      var sc=vi.s+(vj.s-vi.s)*e;
      group.position.set(vi.x+(vj.x-vi.x)*e,vi.y+(vj.y-vi.y)*e,0);
      group.scale.setScalar(sc);
      var tm=(now-t0)/1000;
      var swing=((T[i].img?T[i].img.swing:0)*(1-e)+(T[j].img?T[j].img.swing:0)*e);
      var rx=py*.09,ry=px*.14;
      var rz=(T[i].tilt||0)*(1-e)+(T[j].tilt||0)*e+(vi.rot||0)*(1-e)+(vj.rot||0)*e;
      group.rotation.set(rx,ry,rz);
      var u2=mat.uniforms,mlsPair=u2.uMls.value>.5;
      u2.uFade.value=imagesReady?sstep(0,.5,introT):0;u2.uGain.value=(vi.gn||1)+((vj.gn||1)-(vi.gn||1))*e;u2.uGB.value=(vi.gb||1)+((vj.gb||1)-(vi.gb||1))*e;u2.uPoseF.value=isPose(T[i])?1:0;u2.uPoseT.value=isPose(T[j])?1:0;u2.uMix.value=mx;u2.uTime.value=reduce?2.0:tm;u2.uPsz.value=vi.p+(vj.p-vi.p)*e;u2.uRs.value.set(vi.pr+(vj.pr-vi.pr)*e,vi.pb+(vj.pb-vi.pb)*e);
      u2.uTurb.value=reduce?0:(mlsPair?.1/sc:1.6*Math.min(1,12/sc));u2.uJit.value=.006*Math.min(1,10/sc);u2.uSt.value=mlsPair?.12:.5;
      var swA=reduce?0:Math.sin(tm*.38);u2.uSwF.value=swA*(T[i].img?T[i].img.swing:0);u2.uSwT.value=swA*(T[j].img?T[j].img.swing:0);u2.uAxF.value=T[i].axisY||0;u2.uAxT.value=T[j].axisY||0;
      u2.uAmpFrom.value=T[i].waveAmp;u2.uAmpTo.value=T[j].waveAmp;u2.uCmpF.value=T[i].img?1:0;u2.uCmpT.value=T[j].img?1:0;u2.uSc.value=sc;
      fieldUpdate(dt,mx<.5?T[i]:T[j]);
      renderer.render(scene,camera);
    }
    requestAnimationFrame(frame);
  }

