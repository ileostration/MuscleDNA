
  /* ---------------- region highlight on every pose ---------------- */
  function setRegion(sel){
    if(!REG)return;
    for(var k=1;k<=NPOSE;k++)if(T[k].base)poseRecolor(T[k],REG,sel);
    if(renderer&&curFrom>=0)bind(curFrom,curTo,true);
  }

  /* ---------------- pose targets ----------------
     Decode the 9 pose frames and cut-outs, sample particles, carry every particle from pose to pose (warp + balanced match), then build the DNA target
     and pair it with the last pose. Work is split into small steps so the living wave keeps animating while this runs. */
  function decode(uri,cb){
    var im=new Image();
    im.onload=function(){cb(im,im.naturalWidth,im.naturalHeight);};
    im.onerror=function(){
      try{
        var b64=uri.slice(uri.indexOf(',')+1),bin=atob(b64),u8=new Uint8Array(bin.length);
        for(var q=0;q<bin.length;q++)u8[q]=bin.charCodeAt(q);
        var type=uri.indexOf('image/png')>0?'image/png':'image/jpeg';
        createImageBitmap(new Blob([u8],{type:type})).then(function(bm){cb(bm,bm.width,bm.height);},function(){cb(null,0,0);});
      }catch(e){cb(null,0,0);}
    };
    im.src=uri;
  }
  function pixelsOf(src,cw,ch){
    var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
    var cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,cw,ch);
    return cx.getImageData(0,0,cw,ch).data;
  }
  /* The figure keeps every colour it had except its neon pink. Pink and magenta pixels (hue about 270 to 355 degrees) are turned into warm gold of the same strength and brightness,
     so the figure's blue and cyan stay as they were and its rim light becomes the complement of that blue. Violet pixels near the blue side are only partly shifted. */
  function pinkToGold(rgb,o,bytes){
    var r=rgb[o],g=rgb[o+1],b=rgb[o+2];
    if(bytes){r/=255;g/=255;b/=255;}
    var mx=r>g?(r>b?r:b):(g>b?g:b),mn=r<g?(r<b?r:b):(g<b?g:b),d=mx-mn;
    if(d<.06||mx<.04)return;
    var h=mx===r?((g-b)/d+6)%6:(mx===g?(b-r)/d+2:(r-g)/d+4);h*=60;
    var w=sstep(268,296,h)*(1-sstep(338,356,h));
    if(w<=0)return;
    var s=d/mx,gr=mx,gb=mx*(1-s),gg=gb+(mx-gb)*.66,Lo=.2126*r+.7152*g+.0722*b,Lg=.2126*gr+.7152*gg+.0722*gb,k=Lg>0?Math.min(1.1,Lo/Lg*1.05):1;
    gr*=k;gg*=k;gb*=k;
    r+=(gr-r)*w;g+=(gg-g)*w;b+=(gb-b)*w;
    if(bytes){rgb[o]=Math.min(255,r*255+.5);rgb[o+1]=Math.min(255,g*255+.5);rgb[o+2]=Math.min(255,b*255+.5);}
    else{rgb[o]=r;rgb[o+1]=g;rgb[o+2]=b;}
  }

  /* The DNA takes the logo's colours: strands run from brand blue to brand cyan across the helix, its bright white spine takes the logo's yellow glint, and the blue dust stays blue.
     Every particle keeps the brightness the photo gave it; only the hue changes. */
  function dnaBrand(col,pos,N){
    var BL=[.216,.44,.984],CY=[0,.96,.98],YE=[1,.88,.3];
    var a=1e9,b=-1e9,q,j,hi=[];
    for(q=0;q<N;q++){var u=pos[q*3]-pos[q*3+1]*.55;if(u<a)a=u;if(u>b)b=u;var m=Math.max(col[q*3],col[q*3+1],col[q*3+2]);if(m>.05&&(q&7)===0)hi.push(m);}
    hi.sort(function(x,y){return x-y;});
    var p80=hi[Math.floor(hi.length*.8)]||.5,p97=hi[Math.floor(hi.length*.97)]||1,span=Math.max(1e-6,b-a);
    for(q=0;q<N;q++){
      j=q*3;var r=col[j],g=col[j+1],bl=col[j+2];
      var mx=Math.max(r,g,bl),mn=Math.min(r,g,bl);if(mx<.02)continue;
      var white=sstep(.5,.85,mn/mx),
          cyanish=sstep(.25,.55,(Math.min(g,bl)-r)/mx)*(1-sstep(.15,.45,(bl-g)/mx)),                // 1 on cyan strand pixels, 0 on the blue dust
          t=sstep(.1,.9,(pos[j]-pos[j+1]*.55-a)/span);                                               // blue at the lower left to cyan at the upper right, like the logo gradient
      var R=(BL[0]+(CY[0]-BL[0])*t)*cyanish+BL[0]*(1-cyanish),G=(BL[1]+(CY[1]-BL[1])*t)*cyanish+BL[1]*(1-cyanish),B=(BL[2]+(CY[2]-BL[2])*t)*cyanish+BL[2]*(1-cyanish);
      var k=mx/Math.max(R,G,B);R*=k;G*=k;B*=k;
      var wy=Math.max(white,.9*sstep(p80,p97,mx)*cyanish);                                           // the brightest strand and the white spine glint yellow
      col[j]=R+(YE[0]*mx-R)*wy;col[j+1]=G+(YE[1]*mx-G)*wy;col[j+2]=B+(YE[2]*mx-B)*wy;
    }
  }
  /* The DNA frame is padded on every side with a mirror image of itself that fades out, so there is no frame edge to find when the plane tilts with the cursor.
     The padded frame is 16:9 as well; the loader tells the engine how much bigger it is (k) so the original frame keeps its size on screen. */
  function padFrame(src,w,h,px,py){
    var W=w+2*px,Hh=h+2*py,out=new Float32Array(W*Hh*4),x,y,sx,sy,dx,dy,d,m,o,q;
    for(y=0;y<Hh;y++){
      sy=y-py;if(sy<0)sy=-sy-1;else if(sy>=h)sy=2*h-sy-1;
      dy=Math.max(0,py-y,y-(py+h-1))/py;
      for(x=0;x<W;x++){
        sx=x-px;if(sx<0)sx=-sx-1;else if(sx>=w)sx=2*w-sx-1;
        dx=Math.max(0,px-x,x-(px+w-1))/px;
        d=Math.sqrt(dx*dx+dy*dy);m=d<=.35?1:(d>=1?0:1-sstep(.35,1,d));
        o=(y*W+x)*4;q=(sy*w+sx)*4;
        out[o]=src[q]*m;out[o+1]=src[q+1]*m;out[o+2]=src[q+2]*m;out[o+3]=255;
      }
    }
    return out;
  }
  function loadAll(){
    if(!NPOSE||typeof SRC_DNA==='undefined'){imagesReady=true;return;}
    var imgD=new Array(NPOSE),mkD=new Array(NPOSE),colD=new Array(NPOSE),dna=null,left=NPOSE*3+1,bad=false;
    function one(){if(--left===0){if(bad)imagesReady=true;else build();}}
    SRC_POSES.forEach(function(p,n){
      decode(p.img,function(src,w,h){try{if(src)imgD[n]=pixelsOf(src,512,768);else bad=true;}catch(e){bad=true;}one();});
      decode(p.mask,function(src,w,h){
        try{
          if(!src){bad=true;}
          else{var d=pixelsOf(src,320,480),m=new Uint8Array(320*480);for(var q=0;q<m.length;q++)m[q]=d[q*4];mkD[n]=m;}
        }catch(e){bad=true;}
        one();
      });
    });
    SRC_POSES.forEach(function(p,n){
      decode(p.col,function(src,w,h){
        try{
          if(!src){bad=true;}
          else{var d=pixelsOf(src,768,1152),c=new Uint8Array(768*1152*3);for(var q=0,o=0;q<d.length;q+=4,o+=3){c[o]=d[q];c[o+1]=d[q+1];c[o+2]=d[q+2];pinkToGold(c,o,true);}colD[n]=c;}
        }catch(e){bad=true;}
        one();
      });
    });
    decode(SRC_DNA,function(src,w,h){
      try{
        if(src){var d=pixelsOf(src,960,540),f=new Float32Array(d.length);for(var q=0;q<d.length;q++){var v=d[q]/255;f[q]=v*v*255;}dna=f;}   // stored square-rooted (more steps in the darks)
        else bad=true;
      }catch(e){bad=true;}
      one();
    });

    /* 160x240 silhouette of a pose (cut-out mask, any of 2x2 mask pixels set, grown by one cell) for the 'is the cursor touching the figure' test */
    function silOf(m){
      var w=160,h=240,s=new Uint8Array(w*h),d=new Uint8Array(w*h),x,y,o,dx,dy;
      for(y=0;y<h;y++)for(x=0;x<w;x++){o=y*2*320+x*2;if(m[o]>127||m[o+1]>127||m[o+320]>127||m[o+321]>127)s[y*w+x]=1;}
      for(y=0;y<h;y++)for(x=0;x<w;x++)if(s[y*w+x])for(dy=-1;dy<=1;dy++)for(dx=-1;dx<=1;dx++){var xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h)d[yy*w+xx]=1;}
      return d;
    }
    /* Small screens show the figure at a fraction of the resolution, so the highlights that define the muscles would melt into the surface.
       The colour map gets a local-contrast lift (each pixel is scaled by (its light / the light around it)^k) so the separations and rim lights stay as clear as on a big screen. */
    function enhanceCol(cim,cw,ch,k,R){
      var n=cw*ch,lin=new Float32Array(n*3),L=new Float32Array(n),tmp=new Float32Array(n),Lb=new Float32Array(n),i,x,y,a,c,o=new Uint8Array(n*3);
      for(i=0;i<n;i++){var r=cim[i*3]/255,g=cim[i*3+1]/255,b=cim[i*3+2]/255;r*=r;g*=g;b*=b;lin[i*3]=r;lin[i*3+1]=g;lin[i*3+2]=b;L[i]=(r+g+b)/3;}
      for(y=0;y<ch;y++){a=0;c=0;var row=y*cw;for(x=-R;x<cw;x++){var inx=x+R,outx=x-R-1;if(inx<cw){a+=L[row+inx];c++;}if(outx>=0){a-=L[row+outx];c--;}if(x>=0)tmp[row+x]=a/c;}}
      for(x=0;x<cw;x++){a=0;c=0;for(y=-R;y<ch;y++){var iny=y+R,outy=y-R-1;if(iny<ch){a+=tmp[iny*cw+x];c++;}if(outy>=0){a-=tmp[outy*cw+x];c--;}if(y>=0)Lb[y*cw+x]=a/c;}}
      var eps=(10/255)*(10/255);
      for(i=0;i<n;i++){
        var f=Math.pow((L[i]+eps)/(Lb[i]+eps),k);if(f<.5)f=.5;else if(f>2.4)f=2.4;
        for(c=0;c<3;c++){var v=lin[i*3+c]*f;if(v>1)v=1;o[i*3+c]=Math.sqrt(v)*255+.5;}
      }
      return o;
    }
    function build(){
      var S=new Array(NPOSE),cur=new Array(NPOSE),tg=new Array(NPOSE),steps=[],n,dnaT=null;
      var kp=SRC_POSES.map(function(p){return p.kp;});
      for(n=0;n<NPOSE;n++)(function(n){steps.push(function(){var P2=Object.assign({},POSE_P);P2.gCol=POSE_P.gCol*(POSE_TRIM[n]||1)*.64/NFGF;if(window.__TUNE){if(__TUNE.g)P2.gCol=__TUNE.g*(POSE_TRIM[n]||1);if(__TUNE.bg!=null)P2.bgLevel=__TUNE.bg;}P2.cimg=small?enhanceCol(colD[n],768,1152,(window.__TUNE&&__TUNE.ek)||2.0,(window.__TUNE&&__TUNE.er)||8):colD[n];P2.cw=768;P2.ch=1152;if(small)P2.edgeBoost=(window.__TUNE&&__TUNE.eb!=null)?__TUNE.eb:2.8;if(!MOBILE_VIEW){P2.win=[kp[n][0][1]-.07,kp[n][8][1]+.09];P2.winGain=3;P2.winGainBg=2.2;}
        S[n]=poseSample(imgD[n],4,512,768,mkD[n],320,480,NFG,N-NFG,100+n,P2);});})(n);
      steps.push(function(){var id=new Int32Array(N);for(var p=0;p<N;p++)id[p]=p;cur[0]=id;});
      for(n=0;n<NPOSE-1;n++)(function(n){steps.push(function(){cur[n+1]=poseAlignNext(S[n],S[n+1],cur[n],kp[n],kp[n+1],AR,MLS_ALPHA);});})(n);
      for(n=0;n<NPOSE;n++)(function(n){steps.push(function(){
        var t=poseTarget(S[n],cur[n],AR,POSE_P);
        t.waveAmp=0;t.spin=[0,0];t.tilt=0;t.sway=0;t.key='pose'+n;t.kp=kp[n];t.lay=SRC_POSES[n].lay;t.sil=silOf(mkD[n]);
        t.kpW=kp[n].map(function(a){return [(a[0]-.5)*AR,.5-a[1]];});
        tg[n]=t;
      });})(n);
      for(n=0;n<NPOSE-1;n++)(function(n){steps.push(function(){
        var f=mlsMake(kp[n],kp[n+1],AR,MLS_ALPHA),A=tg[n].pos,B=tg[n+1].pos,r=new Float32Array(N*2),o=[0,0];
        for(var p=0;p<NFG;p++){f(A[p*3],A[p*3+1],o);r[p*2]=B[p*3]-o[0];r[p*2+1]=B[p*3+1]-o[1];}
        RES[n]=r;
      });})(n);
      steps.push(function(){
        var spec=IMG_SPECS[4];if(window.__TUNE&&__TUNE.dr)spec.raw=__TUNE.dr;var DPX=96,DPY=54,dpad=padFrame(dna,960,540,DPX,DPY),spec2=Object.assign({},spec,{pad:{x:DPX,y:DPY,w:960,h:540,k:(540+2*DPY)/540},relief:spec.relief*540/(540+2*DPY)});var t=imageTarget(dpad,4,960+2*DPX,540+2*DPY,16/9,spec2,N,1238),A=tg[NPOSE-1].pos,B=t.pos;for(var pc=0;pc<N;pc++)pinkToGold(t.col,pc*3,false);dnaBrand(t.col,t.pos,N);
        var ax=new Float32Array(N),ay=new Float32Array(N),bx=new Float32Array(N),by=new Float32Array(N);
        for(var p=0;p<N;p++){ax[p]=A[p*3];ay[p]=A[p*3+1];bx[p]=B[p*3];by[p]=B[p*3+1];}
        permuteTarget(t,kdMatch(ax,ay,bx,by,N));
        dnaT=t;
      });
      steps.push(function(){REG=poseRegions(S[0]);});
      function finish(){
        for(var k=0;k<NPOSE;k++)T[k+1]=tg[k];
        T[NPOSE+1]=dnaT;
        S=null;colD=null;
        computeViews();
        if(renderer)bind(curFrom<0?0:curFrom,curTo<0?1:curTo,true);
        imagesReady=true;
      }
      (function run(){
        var f=steps.shift();
        if(!f){finish();return;}
        try{f();}catch(err){imagesReady=true;return;}
        setTimeout(run,0);
      })();
    }
  }

  /* ---------------- init ---------------- */
  growUpd();
  window.addEventListener('resize',resize);
  window.addEventListener('pointermove',onMove,{passive:true});
  resize();
  if(renderer)bind(0,1,true);
  stages.forEach(function(s){s.style.visibility='hidden';s.style.opacity='0';});
  loadAll();
  requestAnimationFrame(frame);
})();
