/* Particle targets: an intro wave, four bodybuilding poses, and a DNA strand.
   Pure functions, no DOM or WebGL, so they can run in Node. */
function buildTargets(N){
  const PI=Math.PI, TAU=PI*2;
  const C={blue:[.30,.55,1],ice:[.80,.89,1],ember:[1,.45,.28],mint:[.31,.89,.70],deep:[.14,.28,.72],amber:[1,.76,.30]};
  const U=N/22000;

  function rngOf(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function gaussOf(r){return function(){const u=Math.max(r(),1e-9),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);};}
  function alloc(){return {pos:new Float32Array(N*3),col:new Float32Array(N*3),size:new Float32Array(N)};}
  function put(t,i,x,y,z,c,k,s){const j=i*3;t.pos[j]=x;t.pos[j+1]=y;t.pos[j+2]=z;t.col[j]=c[0]*k;t.col[j+1]=c[1]*k;t.col[j+2]=c[2]*k;t.size[i]=s;}
  const mixc=(a,b,m)=>[a[0]+(b[0]-a[0])*m,a[1]+(b[1]-a[1])*m,a[2]+(b[2]-a[2])*m];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sstep=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
  const rotY=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return [p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];};
  const rotX=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return [p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];};
  const unitVec=r=>{const z=r()*2-1,a=r()*TAU,q=Math.sqrt(1-z*z);return [q*Math.cos(a),q*Math.sin(a),z];};
  const norm3=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const lerp3=(a,b,m)=>[a[0]+(b[0]-a[0])*m,a[1]+(b[1]-a[1])*m,a[2]+(b[2]-a[2])*m];
  const add3=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
  function split(weights){const sum=weights.reduce((a,b)=>a+b,0);const out=weights.map(w=>Math.floor(N*w/sum));out[out.length-1]+=N-out.reduce((a,b)=>a+b,0);return out;}

  /* ---------- wave (animated in the shader) ---------- */
  function genWave(seed,tint){
    const r=rngOf(seed),t=alloc();
    for(let i=0;i<N;i++){
      if(r()<.07){
        put(t,i,(r()*2-1)*15,.8+r()*6,-10+r()*13,mixc(C.blue,tint,.3),.35+r()*.3,.7+r()*.8);
      }else{
        const z=-11+Math.pow(r(),.9)*16,x=(r()*2-1)*17,depth=sstep(-11,-2,z);
        const col=mixc(C.deep,mixc(C.blue,tint,.35),.4+.6*depth);
        put(t,i,x,(r()-.5)*.3,z,col,.55+.55*depth*r(),.8+r()*1.5+(z>2?1.1:0));
      }
    }
    return t;
  }

  const mk=(key,extra,t)=>Object.assign(t,{key},extra);
  return [
    mk('wave',{w:34,h:8,cx:0,cy:0,waveAmp:1,wide:true,home:'bottom',spin:[0,0],tilt:0},genWave(3,C.blue))
  ];
}
if(typeof module!=='undefined')module.exports={buildTargets};
