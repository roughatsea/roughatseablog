/** Dependency-free, deterministic geometry. Units are micrometers for the envelope only. */
export const RADIUS = 3.91;
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const mul = (a, s) => a.map(v => v * s);
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
export const length = a => Math.hypot(...a);
export const norm = a => mul(a, 1 / (length(a) || 1));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function halfThickness(r) {
  const u = clamp((r / RADIUS) ** 2, 0, 1);
  return 0.5 * Math.sqrt(1 - u) * (0.81 + 7.83*u - 4.39*u*u);
}
export function containsCell(p) { return Math.hypot(p[0], p[1]) < RADIUS && Math.abs(p[2]) < halfThickness(Math.hypot(p[0], p[1])); }
export function seededRandom(seed = 1741) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
export function builder() { return { positions: [], normals: [], indices: [] }; }
function vertex(m, p, n) { m.positions.push(...p); m.normals.push(...n); return m.positions.length / 3 - 1; }
export function cellMesh(rows = 48, cols = 96) {
  const m = builder();
  for (let i=0; i<=rows; i++) {
    const t = Math.PI*i/rows, s=Math.sin(t), c=Math.cos(t);
    const z = c*0.5*(0.81+7.83*s*s-4.39*s**4);
    const dz = -s*0.5*(0.81+7.83*s*s-4.39*s**4) + c*c*(7.83*s-8.78*s**3);
    for (let j=0;j<=cols;j++) {
      const p=2*Math.PI*j/cols, cp=Math.cos(p), sp=Math.sin(p);
      vertex(m, [RADIUS*s*cp,RADIUS*s*sp,z], norm([-dz*cp,-dz*sp,RADIUS*c]));
    }
  }
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++) { const a=i*(cols+1)+j,b=a+cols+1; m.indices.push(a,b,a+1,b,b+1,a+1); }
  return m;
}
export function ellipsoid(m, center, scale, rows=7, cols=10) {
  const start=m.positions.length/3;
  for(let i=0;i<=rows;i++) for(let j=0;j<=cols;j++) {
    const t=Math.PI*i/rows,p=Math.PI*2*j/cols,n=[Math.sin(t)*Math.cos(p),Math.sin(t)*Math.sin(p),Math.cos(t)];
    vertex(m,add(center,n.map((v,k)=>v*scale[k])),norm(n.map((v,k)=>v/scale[k])));
  }
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++) { const a=start+i*(cols+1)+j,b=a+cols+1; m.indices.push(a,b,a+1,b,b+1,a+1); }
}
export function cylinder(m,a,b,r=0.025,sides=6) {
  const axis=norm(sub(b,a)), u=norm(cross(axis,Math.abs(axis[2])<0.9?[0,0,1]:[0,1,0])),v=cross(axis,u), start=m.positions.length/3;
  for(const p of [a,b]) for(let j=0;j<sides;j++) { const n=add(mul(u,Math.cos(j*2*Math.PI/sides)),mul(v,Math.sin(j*2*Math.PI/sides))); vertex(m,add(p,mul(n,r)),n); }
  for(let j=0;j<sides;j++) { const n=(j+1)%sides; m.indices.push(start+j,start+sides+j,start+n,start+n,start+sides+j,start+sides+n); }
}
export function buildModel() {
  const meshes={ membrane:cellMesh(), spectrin:builder(), nodes:builder(), ankyrin:builder(), band3:builder(), abo:builder(), rhd:builder(), alpha:builder(), beta:builder() };
  const picks=[],anchors={shape:[0,0,0.43],membrane:[3.25,0.3,halfThickness(3.264)+0.04],hemoglobin:[1.3,-0.8,0],spectrin:[-1.8,-1.1,halfThickness(2.11)-0.08],ankyrin:[0,2.9,halfThickness(2.9)-0.08],band3:[-2.7,0.45,halfThickness(2.737)+0.17],abo:[1.8,1.1,halfThickness(2.11)+0.52],rhd:[0.2,-2.7,halfThickness(2.708)+0.29],'no-nucleus':[0,0,0]};
  const rand=seededRandom();
  // A regular triangulated drawing, NOT a cryo-EM reconstruction of human spectrin.
  for(const sign of [-1,1]) {
    const nodes=[];
    for(let j=-8;j<=8;j++) for(let i=-8;i<=8;i++) {
      const x=0.47*(i+(j%2)*0.5),y=0.47*Math.sqrt(3)/2*j,r=Math.hypot(x,y);
      if(r>3.66) continue;
      const p=[x,y,sign*(halfThickness(r)-0.075)]; nodes.push(p);
      ellipsoid(meshes.nodes,p,[0.043,0.043,0.043],4,6);
      picks.push({id:'spectrin',p,r:0.09,layer:'skeleton'});
    }
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++) if(Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1])<0.48) cylinder(meshes.spectrin,nodes[i],nodes[j],0.018,5);
  }
  const hbCenters=[[1.3,-0.8,0]];
  for(let i=0;i<160;i++) {
    const x=(rand()*2-1)*3.45,y=(rand()*2-1)*3.45,r=Math.hypot(x,y);
    if(r>3.45) continue;
    const h=halfThickness(r)-0.2;
    hbCenters.push([x,y,(rand()*2-1)*Math.max(0.05,h)]);
  }
  hbCenters.forEach((p,i)=>{
    const rotation=rand()*Math.PI,cos=Math.cos(rotation),sin=Math.sin(rotation);
    [[-.082,-.072,-.04],[.082,.072,.04],[-.082,.072,.04],[.082,-.072,-.04]].forEach((d,j)=>{
      const q=add(p,[d[0]*cos-d[1]*sin,d[0]*sin+d[1]*cos,d[2]]);
      ellipsoid(j<2?meshes.alpha:meshes.beta,q,[0.105,0.087,0.093],5,7);
    });
    picks.push({id:'hemoglobin',p,r:0.22,layer:'hemoglobin'});
  });
  function protein(id,x,y,sign=1) {
    const z=sign*halfThickness(Math.hypot(x,y)),p=[x,y,z];
    if(id==='abo') {
      const q=[x,y,z+sign*.4]; cylinder(meshes.abo,p,q,.027);
      for(let k=0;k<3;k++) ellipsoid(meshes.abo,[x+.045*Math.sin(k*1.7),y,z+sign*(.12+k*.13)],[.065,.065,.065],5,7);
      cylinder(meshes.abo,[x,y,z+sign*.29],[x+.19,y+.04,z+sign*.43],.023);
      ellipsoid(meshes.abo,[x+.19,y+.04,z+sign*.43],[.083,.083,.083],5,7);
    } else if(id==='rhd') {
      for(let k=0;k<3;k++) ellipsoid(meshes.rhd,[x+(k-1)*.085,y,z+sign*.055],[.062,.105,.2],6,8);
    } else {
      ellipsoid(meshes.band3,[x-.085,y,z],[.11,.14,.2],7,9);
      ellipsoid(meshes.band3,[x+.085,y,z],[.11,.14,.2],7,9);
      cylinder(meshes.ankyrin,[x,y,z-sign*.18],[x-.12,y+.1,z-sign*.37],.04);
      picks.push({id:'ankyrin',p:[x-.12,y+.1,z-sign*.3],r:.14,layer:'skeleton'});
    }
    picks.push({id,p:[x,y,z+sign*(id==='abo'?.3:.09)],r:id==='abo'?.25:.23,layer:'proteins'});
  }
  protein('abo',1.8,1.1);protein('rhd',.2,-2.7);protein('band3',-2.7,.45);
  protein('band3',0,2.9);
  for(let i=0;i<48;i++) { const r=Math.sqrt(rand())*3.55,theta=rand()*Math.PI*2;protein(['abo','rhd','band3'][i%3],r*Math.cos(theta),r*Math.sin(theta),i%4===0?-1:1); }
  // Uint16 meshes deliberately stay below the WebGL 1 index limit.
  for(const [name,m] of Object.entries(meshes)) if(m.positions.length/3>65535) throw new Error(`${name}: index capacity exceeded`);
  return {meshes,picks,anchors};
}
export function lookAt(eye,target,up=[0,1,0]) {
  const z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
export function perspective(fov,aspect,near=.025,far=150) { const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]); }
export function transform(m,p) { const v=[...p,1];return [0,1,2,3].map(i=>v.reduce((s,x,j)=>s+m[j*4+i]*x,0)); }
export function project(p,view,projection,width,height) { const q=transform(view,p),v=transform(projection,q.slice(0,3));return {x:(v[0]/v[3]*.5+.5)*width,y:(.5-v[1]/v[3]*.5)*height,depth:-q[2],visible:v[3]>0&&Math.abs(v[0])<v[3]&&Math.abs(v[1])<v[3]}; }
