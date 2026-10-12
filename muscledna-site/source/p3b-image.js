/* Image -> particle target. Pure function so it can be tested in Node.
   px: Uint8 pixel array, stride 3 (RGB) or 4 (RGBA). Each source is a full 16:9 frame.
   Image space: height 1, x in [-ar/2, ar/2], y in [-.5, .5].
   Colour: the photo only supplies LIGHT (luminance + edge direction). It is re-lit with a neon backlight palette:
   indigo shadows -> electric blue -> ice-cyan highlights, a magenta fill on the opposite side, and cyan / magenta rim light
   on edges depending on which way they face. No skin tones survive. */
function imageTarget(px,stride,w,h,ar,spec,N,seed){
  var s=seed>>>0||1;
  function rnd(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;}
  var nC=w*h,cdf=new Float64Array(nC),lum=new Float32Array(nC),tot=0,totIn=0,nIn=0,i,x,y,PD=spec.pad||null;     // PD: the frame was padded (see padFrame in the loader); only the original frame counts for the statistics
  for(i=0;i<nC;i++){
    var j=i*stride;
    var l=(.2126*px[j]+.7152*px[j+1]+.0722*px[j+2])/255;lum[i]=l;
    tot+=Math.pow(l,spec.gam)+.0006;cdf[i]=tot;
    if(!PD||(i%w>=PD.x&&i%w<PD.x+PD.w&&((i/w)|0)>=PD.y&&((i/w)|0)<PD.y+PD.h)){totIn+=Math.pow(l,spec.gam)+.0006;nIn++;}
  }
  /* light direction of every pixel: gradient of a blurred luminance (3x3 box twice) */
  var bl=new Float32Array(nC),tmp=new Float32Array(nC);
  function box(src,dst){
    for(y=0;y<h;y++)for(x=0;x<w;x++){
      var a=0,c=0;
      for(var dy=-1;dy<=1;dy++){var yy=y+dy;if(yy<0||yy>=h)continue;for(var dx=-1;dx<=1;dx++){var xx=x+dx;if(xx<0||xx>=w)continue;a+=src[yy*w+xx];c++;}}
      dst[y*w+x]=a/c;
    }
  }
  box(lum,tmp);box(tmp,bl);
  var gx=new Float32Array(nC),gy=new Float32Array(nC),K=Math.max(2,Math.round(w/320));
  for(y=0;y<h;y++)for(x=0;x<w;x++){
    var xa=x-K<0?0:x-K,xb=x+K>=w?w-1:x+K,ya=y-K<0?0:y-K,yb=y+K>=h?h-1:y+K;
    gx[y*w+x]=bl[y*w+xb]-bl[y*w+xa];gy[y*w+x]=bl[yb*w+x]-bl[ya*w+x];
  }
  /* helix mask: only the sharp, bright helix should spin, never the blurred background strands.
     Wide blur, threshold, then keep the largest connected blob. */
  var mask=null;
  if(spec.helix){
    var R=Math.max(3,Math.round(w/190)),m1=new Float32Array(nC),m2=new Float32Array(nC),a0,c0;
    function blurH(src,dst){for(var yy=0;yy<h;yy++){a0=0;c0=0;var row=yy*w;for(var xx=-R;xx<w;xx++){var inx=xx+R,outx=xx-R-1;if(inx<w){a0+=src[row+inx];c0++;}if(outx>=0){a0-=src[row+outx];c0--;}if(xx>=0)dst[row+xx]=a0/c0;}}}
    function blurV(src,dst){for(var xx=0;xx<w;xx++){a0=0;c0=0;for(var yy=-R;yy<h;yy++){var iny=yy+R,outy=yy-R-1;if(iny<h){a0+=src[iny*w+xx];c0++;}if(outy>=0){a0-=src[outy*w+xx];c0--;}if(yy>=0)dst[yy*w+xx]=a0/c0;}}}
    blurH(lum,m1);blurV(m1,m2);blurH(m2,m1);blurV(m1,m2);
    var th=spec.helixTh||.22,lab=new Int32Array(nC),stack=new Int32Array(nC),best=0,bestN=0,nl=0;
    for(i=0;i<nC;i++){
      if(m2[i]<=th||lab[i])continue;
      nl++;var sp=0,cnt=0;stack[sp++]=i;lab[i]=nl;
      while(sp){
        var q0=stack[--sp];cnt++;var qx=q0%w,qy=(q0/w)|0;
        if(qx>0&&!lab[q0-1]&&m2[q0-1]>th){lab[q0-1]=nl;stack[sp++]=q0-1;}
        if(qx<w-1&&!lab[q0+1]&&m2[q0+1]>th){lab[q0+1]=nl;stack[sp++]=q0+1;}
        if(qy>0&&!lab[q0-w]&&m2[q0-w]>th){lab[q0-w]=nl;stack[sp++]=q0-w;}
        if(qy<h-1&&!lab[q0+w]&&m2[q0+w]>th){lab[q0+w]=nl;stack[sp++]=q0+w;}
      }
      if(cnt>bestN){bestN=cnt;best=nl;}
    }
    mask=new Uint8Array(nC);for(i=0;i<nC;i++)mask[i]=lab[i]===best?1:0;
  }
  var sm=0,sc=0;for(i=0;i<nC;i++){if(lum[i]>.18){sm+=lum[i];sc++;}}
  var mean=sc?sm/sc:.5,auto=Math.max(1,Math.min(1.35,.5/mean));
  /* neon ramp */
  var RP=spec.ramp||[[.06,.05,.32],[.10,.22,.95],[.18,.62,1],[.62,.93,1]],R0=RP[0],R1=RP[1],R2=RP[2],R3=RP[3];
  function ramp(t,o){
    var a,b,u;
    if(t<.35){a=R0;b=R1;u=t/.35;}else if(t<.7){a=R1;b=R2;u=(t-.35)/.35;}else{a=R2;b=R3;u=(t-.7)/.3;}
    u=u*u*(3-2*u);
    o[0]=a[0]+(b[0]-a[0])*u;o[1]=a[1]+(b[1]-a[1])*u;o[2]=a[2]+(b[2]-a[2])*u;
  }
  var rc=[0,0,0],mag=spec.mag==null?.7:spec.mag,rimK=spec.rim==null?.7:spec.rim;
  var pos=new Float32Array(N*3),col=new Float32Array(N*3),size=new Float32Array(N);
  var px2=new Float32Array(N),py2=new Float32Array(N);
  var spr=new Float32Array(N),sprSum=0,sprN=0;
  var ca=spec.tilt?Math.cos(spec.tilt):1,sa=spec.tilt?Math.sin(spec.tilt):0;
  for(var p=0;p<N;p++){
    var u=rnd()*tot,lo=0,hi=nC-1;
    while(lo<hi){var mid=(lo+hi)>>1;if(cdf[mid]<u)lo=mid+1;else hi=mid;}
    var cx=lo%w,cy=(lo/w)|0;
    var fx=(cx+rnd())/w,fy=(cy+rnd())/h;
    var X0=(fx-.5)*ar,Y0=.5-fy,L=lum[lo];
    px2[p]=fx;py2[p]=fy;
    var z=(L-.3)*spec.relief+(rnd()-.5)*.004;
    var X=X0,Y=Y0;
    if(spec.tilt){X=X0*ca-Y0*sa;Y=X0*sa+Y0*ca;}
    var j3=p*3;pos[j3]=X;pos[j3+1]=Y;pos[j3+2]=z;
    if(mask&&mask[lo]){spr[p]=1;if(!PD||(cx>=PD.x&&cx<PD.x+PD.w&&cy>=PD.y&&cy<PD.y+PD.h)){sprSum+=Y;sprN++;}}
    /* colour */
    var t=Math.min(1,L*1.2);ramp(t,rc);
    var mz=Math.max(0,Math.min(1,.55+(.5-fx)*.9+(fy-.5)*.8));          // magenta fill sits lower-left, blue key upper-right
    var mw=mag*mz*(1-.6*t)*.85;
    var cr=rc[0]+(1.0*(.35+.9*t)-rc[0])*mw,cg=rc[1]+(.16*(.35+.9*t)-rc[1])*mw,cb=rc[2]+(.78*(.35+.9*t)-rc[2])*mw;
    var ex=gx[lo],ey=gy[lo],em=Math.sqrt(ex*ex+ey*ey);
    if(em>1e-4){
      var rs=Math.min(1,em*2.6);                                      // rim strength from edge contrast
      var dir=(-ex*.7+ey*.7)/em;                                       // outward normal . light dir (y is down)
      var amt=rs*Math.abs(dir)*(.3+Math.min(1,L*1.6))*rimK;
      if(dir>0){cr+=.20*amt;cg+=.85*amt;cb+=1.0*amt;}else{cr+=1.0*amt;cg+=.2*amt;cb+=.85*amt;}
    }
    var fade=L<.12?.15+.85*(L/.12):1;                                   // keep the studio backdrop as dim indigo haze
    var k=spec.gain*auto*(.8+.5*L)*fade;
    col[j3]=Math.min(1.7,cr*k);col[j3+1]=Math.min(1.7,cg*k);col[j3+2]=Math.min(1.7,cb*k);
    if(spec.raw){var jr=lo*stride,dn=Math.min(6,Math.max(.2,(Math.pow(L,spec.gam)+.0006)/(totIn/nIn)));var rk=spec.raw/dn;col[j3]=px[jr]/255*rk;col[j3+1]=px[jr+1]/255*rk;col[j3+2]=px[jr+2]/255*rk;}   // colours were graded to the screenshot offline
    size[p]=spec.sz*(.8+rnd()*.5)*(.85+.4*L);
  }
  var base=new Float32Array(col);
  var tg={pos:pos,col:col,size:size,w:ar,h:1,cx:0,cy:0,waveAmp:0,spin:[0,0],tilt:-(spec.tilt||0),sway:spec.sway||0,spr:mask?spr:null,axisY:sprN?sprSum/sprN:0,
    img:{k:PD?PD.k:1,ar:ar,fx:spec.fx,fy:spec.fy,fL:spec.fL,fR:spec.fR,pf:spec.pf||0,voidk:spec.voidk||0,swing:spec.swing||0,psz:1},update:function(){}};
  if(spec.regions){
    var reg=new Uint8Array(N);
    for(var q=0;q<N;q++){
      var best=0;
      for(var e=0;e<spec.regions.length&&!best;e++){
        var E=spec.regions[e],dx=(px2[q]-E.x)/E.rx,dy=(py2[q]-E.y)/E.ry;
        if(dx*dx+dy*dy<1)best=E.id;
      }
      reg[q]=best;
    }
    tg.reg=reg;
    tg.update=function(sel){
      for(var q=0;q<N;q++){
        var j3=q*3,b0=base[j3],b1=base[j3+1],b2=base[j3+2];
        if(!sel){col[j3]=b0;col[j3+1]=b1;col[j3+2]=b2;}
        else if(reg[q]===sel){var m=Math.max(b0,b1,b2);col[j3]=m*.5+.1;col[j3+1]=m*1.15+.3;col[j3+2]=m*.95+.22;}   // electric aqua-mint
        else{col[j3]=b0*.2;col[j3+1]=b1*.22;col[j3+2]=b2*.3;}
      }
    };
  }
  return tg;
}

/* fx,fy: focal point of the subject in the full frame (0..1). fL,fR: horizontal extent of the subject.
   pf: where the subject's centre should sit on screen (fraction of viewport width from the centre, negative = left).
   voidk: how far (fraction of viewport width) the frame may slide off-centre, leaving empty background, in landscape. */
var IMG_SPECS=[
  {fx:.64,fy:.5,fL:.18,fR:.99,pf:.14,voidk:.04,gam:1.25,relief:.07,gain:.58,mag:.75,sz:1.15,sway:1,
   regions:[{id:7,x:.73,y:.39,rx:.075,ry:.07},{id:2,x:.62,y:.55,rx:.065,ry:.09},{id:8,x:.78,y:.7,rx:.1,ry:.14},{id:9,x:.55,y:.75,rx:.065,ry:.09},{id:6,x:.34,y:.87,rx:.14,ry:.05}]},
  {fx:.5,fy:.5,fL:.12,fR:.88,pf:-.2,voidk:.14,gam:1.25,relief:.07,gain:.6,mag:.6,sz:1.15,sway:1},
  {fx:.27,fy:.5,fL:0,fR:.6,pf:-.2,voidk:.06,gam:1.25,relief:.07,gain:.52,mag:.65,sz:1.15,sway:1},
  {fx:.64,fy:.5,fL:.26,fR:.99,pf:.18,voidk:.05,gam:1.25,relief:.07,gain:.54,mag:.5,sz:1.15,sway:1},
  {fx:.45,fy:.5,fL:.1,fR:.92,pf:-.18,voidk:.12,gam:1.1,relief:.16,gain:.7,mag:.2,rim:.5,sz:1.2,sway:0,tilt:.70,swing:.75,helix:1,helixTh:.22,ramp:[[.0,.05,.25],[.0,.30,.85],[.1,.78,1],[.85,1,1]],raw:4.4}
];
if(typeof module!=='undefined')module.exports={imageTarget,IMG_SPECS};
