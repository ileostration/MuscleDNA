/* Pose targets. Pure functions so they can be tested in Node.
   Each pose is a 2:3 portrait frame. Image space: height 1, x in [-ar/2, ar/2], y in [-.5, .5] (y up).
   Particles are split in two groups that never mix: the first Nfg are BODY particles (inside the cut-out silhouette),
   the rest are BACKDROP particles (the smoke). Each particle keeps one identity through every pose:
   - body particles are carried from pose to pose by a similarity moving-least-squares warp driven by 15 body points
     (head, neck, shoulders, elbows, hands, navel, hips, knees, feet), then paired with the next pose's samples by a
     balanced median-split match, so a fingertip lands on a fingertip and a heel on a heel.
   - backdrop particles are paired by position only. */
function ss(t){t=t<0?0:(t>1?1:t);return t*t*(3-2*t);}
function rngMk(seed){var s=seed>>>0||1;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* px: RGB(A) bytes of the pose frame (w x h). mask: bytes (mw x mh), >127 = body. */
function poseSample(px,stride,w,h,mask,mw,mh,Nfg,Nbg,seed,P){
  var rnd=rngMk(seed),nC=w*h,x,y,i;
  var fg=new Uint8Array(nC);
  for(y=0;y<h;y++){
    var my=(y+.5)/h*mh-.5,y0=Math.floor(my),fy=my-y0;if(y0<0){y0=0;fy=0;}if(y0>=mh-1){y0=mh-2;fy=1;}
    for(x=0;x<w;x++){
      var mx=(x+.5)/w*mw-.5,x0=Math.floor(mx),fx=mx-x0;if(x0<0){x0=0;fx=0;}if(x0>=mw-1){x0=mw-2;fx=1;}
      var a=mask[y0*mw+x0],b=mask[y0*mw+x0+1],c=mask[(y0+1)*mw+x0],d=mask[(y0+1)*mw+x0+1];
      var v=(a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;
      fg[y*w+x]=v>127?1:0;
    }
  }
  /* silhouette band: fg pixels within 2 px of the background. Small screens give them extra weight so the outline is made of many dots and stays crisp. */
  var edgeB=P.edgeBoost||0,eg=null;
  if(edgeB>0){
    eg=new Uint8Array(nC);
    for(y=2;y<h-2;y++)for(x=2;x<w-2;x++){i=y*w+x;if(fg[i]&&(!fg[i-1]||!fg[i+1]||!fg[i-w]||!fg[i+w]||!fg[i-2]||!fg[i+2]||!fg[i-2*w]||!fg[i+2*w]))eg[i]=1;}
  }
  var cdfF=new Float64Array(nC),cdfB=new Float64Array(nC),totF=0,totB=0,lum=new Float32Array(nC),lb=new Float32Array(nC),tmpb=new Float32Array(nC);
  for(i=0;i<nC;i++){var j=i*stride;lum[i]=(.2126*px[j]+.7152*px[j+1]+.0722*px[j+2])/255;}
  /* local contrast: how much brighter a pixel is than its neighbourhood. It pulls the muscle separation out of the dark navy skin. */
  (function(){
    var R=P.ceR||7,a0,c0,xx,yy;
    for(yy=0;yy<h;yy++){a0=0;c0=0;var row=yy*w;for(xx=-R;xx<w;xx++){var inx=xx+R,outx=xx-R-1;if(inx<w){a0+=lum[row+inx];c0++;}if(outx>=0){a0-=lum[row+outx];c0--;}if(xx>=0)tmpb[row+xx]=a0/c0;}}
    for(xx=0;xx<w;xx++){a0=0;c0=0;for(yy=-R;yy<h;yy++){var iny=yy+R,outy=yy-R-1;if(iny<h){a0+=tmpb[iny*w+xx];c0++;}if(outy>=0){a0-=tmpb[outy*w+xx];c0--;}if(yy>=0)lb[yy*w+xx]=a0/c0;}}
  })();
  var cm=new Float32Array(nC),wF=new Float32Array(nC),wB=new Float32Array(nC),nFg=0,nBg=0;
  for(i=0;i<nC;i++){
    var l=lum[i],c=1+P.ce*(l-lb[i])/(lb[i]+.05);cm[i]=c<.3?.3:(c>2.6?2.6:c);
    var inWin=P.win&&(((i/w)|0)/h>=P.win[0]&&((i/w)|0)/h<=P.win[1]);   // desktop only shows head to abs enlarged, so spend the particle budget there
    if(fg[i]){var wq=(P.fgBase+Math.pow(l*cm[i],P.fgGam))*(inWin?P.winGain:1)*(eg&&eg[i]?1+edgeB:1);wF[i]=wq;totF+=wq;nFg++;}else{var wb=(Math.pow(l,P.bgGam)+.01)*(inWin?P.winGainBg:1);wB[i]=wb;totB+=wb;nBg++;}
    cdfF[i]=totF;cdfB[i]=totB;
  }
  var n=Nfg+Nbg,sz=new Float32Array(n),u=new Float32Array(n),v=new Float32Array(n),col=new Float32Array(n*3),L=new Float32Array(n),p,idx;
  for(p=0;p<n;p++){
    var isF=p<Nfg,cdf=isF?cdfF:cdfB,t=rnd()*(isF?totF:totB),lo=0,hi=nC-1;
    while(lo<hi){var mid=(lo+hi)>>1;if(cdf[mid]<t)lo=mid+1;else hi=mid;}
    idx=lo;
    var cx=idx%w,cy=(idx/w)|0;
    u[p]=(cx+rnd())/w;v[p]=(cy+rnd())/h;
    var j2=idx*stride,r=px[j2]/255,g=px[j2+1]/255,b2=px[j2+2]/255;
    L[p]=lum[idx];
    var k3=p*3,edge=isF?1:ss(u[p]/.1)*ss((1-u[p])/.1)*ss(v[p]/.07)*ss((1-v[p])/.07);   // backdrop fades out at the frame edge so the strip beside the figure is soft
    var dn=isF?Math.max(.25,wF[idx]/(totF/nFg)):1,szq=isF&&P.dsz?Math.min(P.szMax,Math.max(P.szMin,1/Math.sqrt(dn))):1;sz[p]=szq;   // dense areas get smaller dots (never bigger than before), so the detail is not smeared
    if(P.cimg){
      /* recolour only: positions above are untouched, the colour comes from the desktop-look map (same frame as the photo), stored square-rooted */
      var dens=isF?1/(dn*szq*szq):1;   // where particles are packed denser each one carries less light, so the picture comes out as the screenshot
      var cw=P.cw,ch=P.ch,cim=P.cimg,fx=u[p]*cw-.5,fy=v[p]*ch-.5,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,x1=x0+1,y1=y0+1,cc;
      if(x0<0)x0=0;if(y0<0)y0=0;if(x1>cw-1)x1=cw-1;if(y1>ch-1)y1=ch-1;if(x0>cw-1)x0=cw-1;if(y0>ch-1)y0=ch-1;
      for(cc=0;cc<3;cc++){
        var q=((cim[(y0*cw+x0)*3+cc]*(1-tx)+cim[(y0*cw+x1)*3+cc]*tx)*(1-ty)+(cim[(y1*cw+x0)*3+cc]*(1-tx)+cim[(y1*cw+x1)*3+cc]*tx)*ty)/255;
        col[k3+cc]=isF?q*q*P.gCol*dens:(P.bgTint[cc]*P.bgLevel*edge/Math.max(.3,wB[idx]/(totB/nBg)));
      }
    }else if(isF){
      var lw=lum[idx],boost=P.gFg*(1+P.lift*(1-Math.min(1,lw*3)))*cm[idx];
      col[k3]=Math.min(P.cap,Math.pow(r,P.gamFg)*boost);col[k3+1]=Math.min(P.cap,Math.pow(g,P.gamFg)*boost);col[k3+2]=Math.min(P.cap,Math.pow(b2,P.gamFg)*boost);
    }else{
      col[k3]=Math.min(P.cap,Math.pow(r,P.gamBg)*P.gBg)*edge;col[k3+1]=Math.min(P.cap,Math.pow(g,P.gamBg)*P.gBg)*edge;col[k3+2]=Math.min(P.cap,Math.pow(b2,P.gamBg)*P.gBg)*edge;
    }
  }
  return {u:u,v:v,col:col,L:L,sz:sz,n:n,Nfg:Nfg};
}

/* similarity moving-least-squares (Schaefer et al.), complex form. kpA -> kpB, points as [u,v] in image units.
   Returns f(x,y,out): world-space (height 1, y up). */
function mlsMake(kpA,kpB,ar,alpha){
  var K=kpA.length,ax=new Float64Array(K),ay=new Float64Array(K),bx=new Float64Array(K),by=new Float64Array(K),w=new Float64Array(K),k;
  for(k=0;k<K;k++){ax[k]=(kpA[k][0]-.5)*ar;ay[k]=.5-kpA[k][1];bx[k]=(kpB[k][0]-.5)*ar;by[k]=.5-kpB[k][1];}
  return function(x,y,o){
    var sw=0,pcx=0,pcy=0,qcx=0,qcy=0;
    for(k=0;k<K;k++){var dx=x-ax[k],dy=y-ay[k];var ww=1/Math.pow(dx*dx+dy*dy+4e-4,alpha);w[k]=ww;sw+=ww;pcx+=ww*ax[k];pcy+=ww*ay[k];qcx+=ww*bx[k];qcy+=ww*by[k];}
    pcx/=sw;pcy/=sw;qcx/=sw;qcy/=sw;
    var cr=0,ci=0,mu=0;
    for(k=0;k<K;k++){var px=ax[k]-pcx,py=ay[k]-pcy,qx=bx[k]-qcx,qy=by[k]-qcy;cr+=w[k]*(px*qx+py*qy);ci+=w[k]*(px*qy-py*qx);mu+=w[k]*(px*px+py*py);}
    cr/=mu;ci/=mu;
    var vx=x-pcx,vy=y-pcy;
    o[0]=qcx+cr*vx-ci*vy;o[1]=qcy+cr*vy+ci*vx;
  };
}

function nthSel(idx,key,lo,hi,k){
  while(hi-lo>1){
    var pv=key[idx[(lo+hi)>>1]],i=lo,j=hi-1;
    while(i<=j){
      while(key[idx[i]]<pv)i++;
      while(key[idx[j]]>pv)j--;
      if(i<=j){var t=idx[i];idx[i]=idx[j];idx[j]=t;i++;j--;}
    }
    if(k<=j)hi=j+1;else if(k>=i)lo=i;else return;
  }
}
/* balanced match: A[i] -> B[match[i]], a bijection. Both sets are split at the median along A's long axis, recursively. */
function kdMatch(ax,ay,bx,by,n){
  var ia=new Int32Array(n),ib=new Int32Array(n),match=new Int32Array(n),i;
  for(i=0;i<n;i++){ia[i]=i;ib[i]=i;}
  function rec(lo,hi){
    var cnt=hi-lo;
    if(cnt===1){match[ia[lo]]=ib[lo];return;}
    var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,q;
    for(q=lo;q<hi;q++){var s=ia[q],xx=ax[s],yy=ay[s];if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy;}
    var useX=(x1-x0)>=(y1-y0),mid=lo+(cnt>>1);
    nthSel(ia,useX?ax:ay,lo,hi,mid);nthSel(ib,useX?bx:by,lo,hi,mid);
    rec(lo,mid);rec(mid,hi);
  }
  rec(0,n);
  return match;
}

/* Align pose i+1 to pose i. cur: Int32Array particle -> sample index in pose i. Returns the same for pose i+1. */
function poseAlignNext(A,B,cur,kpA,kpB,ar,alpha){
  var N=A.n,Nfg=A.Nfg,Nbg=N-Nfg,ax=new Float32Array(Nfg),ay=new Float32Array(Nfg),bx=new Float32Array(Nfg),by=new Float32Array(Nfg),p,o=[0,0],nxt=new Int32Array(N);
  var f=mlsMake(kpA,kpB,ar,alpha);
  for(p=0;p<Nfg;p++){var s=cur[p];f((A.u[s]-.5)*ar,.5-A.v[s],o);ax[p]=o[0];ay[p]=o[1];}
  for(p=0;p<Nfg;p++){bx[p]=(B.u[p]-.5)*ar;by[p]=.5-B.v[p];}
  var m=kdMatch(ax,ay,bx,by,Nfg);
  for(p=0;p<Nfg;p++)nxt[p]=m[p];
  var cx=new Float32Array(Nbg),cy=new Float32Array(Nbg),dx=new Float32Array(Nbg),dy=new Float32Array(Nbg);
  for(p=0;p<Nbg;p++){var s2=cur[Nfg+p];cx[p]=(A.u[s2]-.5)*ar;cy[p]=.5-A.v[s2];dx[p]=(B.u[Nfg+p]-.5)*ar;dy[p]=.5-B.v[Nfg+p];}
  var m2=kdMatch(cx,cy,dx,dy,Nbg);
  for(p=0;p<Nbg;p++)nxt[Nfg+p]=Nfg+m2[p];
  return nxt;
}

/* Particle-ordered target arrays for one pose. */
function poseTarget(S,cur,ar,P){
  var N=S.n,Nfg=S.Nfg,pos=new Float32Array(N*3),col=new Float32Array(N*3),size=new Float32Array(N),p,rnd=rngMk(77+N);
  for(p=0;p<N;p++){
    var s=cur[p],j=p*3,fgp=p<Nfg;
    pos[j]=(S.u[s]-.5)*ar;pos[j+1]=.5-S.v[s];
    pos[j+2]=fgp?(S.L[s]-.3)*P.relief:-P.bgZ+(rnd()-.5)*.01;
    col[j]=S.col[s*3];col[j+1]=S.col[s*3+1];col[j+2]=S.col[s*3+2];
    size[p]=(fgp?P.szFg:P.szBg)*(.8+rnd()*.5)*(S.sz?S.sz[s]:1);
  }
  return {pos:pos,col:col,size:size,base:new Float32Array(col)};
}

/* muscle regions on the first pose (front double biceps), image coordinates. Particles carry their region to every pose. */
var POSE_REGIONS=[
  {id:4,x:.17,y:.14,rx:.06,ry:.065},{id:4,x:.80,y:.14,rx:.06,ry:.065},
  {id:3,x:.25,y:.185,rx:.065,ry:.05},{id:3,x:.73,y:.185,rx:.065,ry:.05},
  {id:2,x:.33,y:.205,rx:.05,ry:.05},{id:2,x:.66,y:.205,rx:.05,ry:.05},
  {id:1,x:.39,y:.172,rx:.045,ry:.03},{id:1,x:.6,y:.172,rx:.045,ry:.03},
  {id:5,x:.41,y:.255,rx:.095,ry:.05},{id:5,x:.57,y:.255,rx:.095,ry:.05},
  {id:6,x:.5,y:.345,rx:.075,ry:.075},
  {id:7,x:.41,y:.53,rx:.075,ry:.12},{id:7,x:.6,y:.53,rx:.075,ry:.12},
  {id:8,x:.37,y:.8,rx:.05,ry:.095},{id:8,x:.63,y:.8,rx:.05,ry:.095}
];
function poseRegions(S){
  var N=S.n,id=new Uint8Array(N),rd=new Float32Array(N),q,e,med={},vals={};
  for(q=0;q<S.Nfg;q++){
    for(e=0;e<POSE_REGIONS.length;e++){
      var E=POSE_REGIONS[e],dx=(S.u[q]-E.x)/E.rx,dy=(S.v[q]-E.y)/E.ry,d2=dx*dx+dy*dy;
      if(d2<1){id[q]=E.id;rd[q]=Math.sqrt(d2);(vals[E.id]=vals[E.id]||[]).push(S.L[q]);break;}
    }
  }
  for(var k in vals){var a=vals[k].sort(function(x,y){return x-y;});med[k]=a[a.length>>1]||.2;}
  /* rl: the photo's light at the particle relative to the median of its region. The lit surface of the muscle is above 1, the grooves and shadow below. */
  var rl=new Float32Array(N);
  for(q=0;q<S.Nfg;q++)if(id[q])rl[q]=S.L[q]/med[id[q]];
  return {id:id,rd:rd,rl:rl,n:N};
}
/* Selected muscle: a red gradient (brightest red at the middle of the muscle, deep red toward its edge) shaped by the photo's own light, so the separations
   (the blocks of the abs, the edge of the delt) stay readable. Only the lit, front-facing surface is coloured; grooves and shadow stay dark purple.
   Everything else is dark purple, shaped by the same light. Nothing is pushed past 1, so there is no white and no bloom. */
function poseRecolor(tg,reg,sel){
  var N=reg.n,col=tg.col,b=tg.base,id=reg.id,rd=reg.rd,rl=reg.rl,q,j;
  var PUR=[.24,.05,.40],RLO=[.40,.02,.10],RHI=[.86,.09,.09];
  function sst(a,c,v){var t=(v-a)/(c-a);t=t<0?0:(t>1?1:t);return t*t*(3-2*t);}
  for(q=0;q<N;q++){
    j=q*3;
    if(!sel){col[j]=b[j];col[j+1]=b[j+1];col[j+2]=b[j+2];continue;}
    var m=Math.max(b[j],b[j+1],b[j+2]);
    if(id[q]!==sel){var g=m*1.0;col[j]=g*PUR[0];col[j+1]=g*PUR[1];col[j+2]=g*PUR[2];continue;}
    var edge=sst(1,.55,rd[q]),front=sst(.6,1.05,rl[q]),w=edge*front,hi=sst(.95,0,rd[q]);   // hi: 1 at the middle of the muscle
    var gain=Math.min(1.5,.15+1.0*rl[q]);
    var rr=RLO[0]+(RHI[0]-RLO[0])*hi,rg=RLO[1]+(RHI[1]-RLO[1])*hi,rb=RLO[2]+(RHI[2]-RLO[2])*hi;
    var g2=m*1.15,lit=Math.min(1,g2*gain*2.0+.06);
    col[j]  =(g2*PUR[0])*(1-w)+rr*lit*w;
    col[j+1]=(g2*PUR[1])*(1-w)+rg*lit*w;
    col[j+2]=(g2*PUR[2])*(1-w)+rb*lit*w;
  }
}

/* DNA target is generated in its own order; reorder it so each DNA particle sits near the pose particle it replaces. */
function permuteTarget(tg,perm){
  var N=perm.length,pos=new Float32Array(N*3),col=new Float32Array(N*3),size=new Float32Array(N),spr=tg.spr?new Float32Array(N):null,p;
  for(p=0;p<N;p++){
    var s=perm[p];
    pos[p*3]=tg.pos[s*3];pos[p*3+1]=tg.pos[s*3+1];pos[p*3+2]=tg.pos[s*3+2];
    col[p*3]=tg.col[s*3];col[p*3+1]=tg.col[s*3+1];col[p*3+2]=tg.col[s*3+2];
    size[p]=tg.size[s];if(spr)spr[p]=tg.spr[s];
  }
  tg.pos=pos;tg.col=col;tg.size=size;if(spr)tg.spr=spr;
  return tg;
}

/* per-pose brightness trim, measured against the 1920x1080 screenshots (different poses show regions of different particle density) */
var POSE_TRIM=[1.07,1.09,1.01,.86,.87,.75,1.0,1.14,1.11];
var POSE_P={ce:1.6,ceR:7,fgBase:.3,fgGam:.8,bgGam:1.3,gFg:1.9,gamFg:.85,lift:.5,cap:1.7,gBg:1.0,gamBg:.9,relief:.008,bgZ:.02,szFg:1.15,szBg:.6,alpha:1.5,gCol:.24,bgTint:[.35,.55,1],bgLevel:.03,dsz:1,szMin:.5,szMax:1};
if(typeof module!=='undefined')module.exports={rngMk,poseSample,mlsMake,kdMatch,poseAlignNext,poseTarget,poseRegions,poseRecolor,permuteTarget,POSE_P,POSE_REGIONS};
