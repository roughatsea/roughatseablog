import { add,sub,mul,dot,cross,norm,length,clamp,buildModel,containsCell,halfThickness,lookAt,perspective,project } from './geometry.js';
const VERTEX=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uView;uniform mat4 uProjection;varying vec3 vPosition;varying vec3 vNormal;void main(){vPosition=aPosition;vNormal=aNormal;gl_Position=uProjection*uView*vec4(aPosition,1.0);}`;
const FRAGMENT=`precision mediump float;varying vec3 vPosition;varying vec3 vNormal;uniform vec3 uColor;uniform vec3 uEye;uniform float uOpacity;uniform float uCut;uniform float uOrganic;uniform float uHighlight;
void main(){if(uCut>0.5 && vPosition.z>0.045)discard;vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
float grain=sin(vPosition.x*79.0+vPosition.z*23.0)*sin(vPosition.y*87.0-vPosition.x*19.0);n=normalize(n+uOrganic*grain*0.024);
vec3 eye=normalize(uEye-vPosition);vec3 key=normalize(vec3(-0.5,0.8,1.0));vec3 fill=normalize(vec3(0.9,-0.4,0.5));vec3 rim=normalize(vec3(0.4,0.7,-0.9));
float light=0.27+0.78*max(dot(n,key),0.0)+0.22*max(dot(n,fill),0.0);float sheen=pow(max(dot(n,normalize(key+eye)),0.0),36.0)*0.23;float edge=pow(1.0-abs(dot(n,eye)),3.0);
vec3 color=uColor*light+vec3(1.0,0.78,0.64)*sheen+uColor*edge*0.30+vec3(0.28,0.45,0.6)*pow(max(dot(n,rim),0.0),3.0)*0.18;
color=mix(color,color+vec3(0.10,0.09,0.055),uHighlight);color*=1.0+grain*0.012*uOrganic;gl_FragColor=vec4(pow(max(color,vec3(0.0)),vec3(0.88)),uOpacity);}`;
const COLORS={spectrin:[.12,.69,.64],nodes:[.47,.92,.76],ankyrin:[.96,.66,.28],band3:[.53,.36,.85],abo:[.95,.57,.19],rhd:[.18,.75,.69],alpha:[.85,.28,.21],beta:[.95,.50,.31]};
export class CellRenderer {
  constructor(canvas,onFrame,onPick,onFailure){
    this.canvas=canvas;this.onFrame=onFrame;this.onPick=onPick;this.onFailure=onFailure;
    this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
    if(!this.gl)throw new Error('WebGL is unavailable');
    const gl=this.gl,shaders=[];
    try {
      for(const [type,src] of [[gl.VERTEX_SHADER,VERTEX],[gl.FRAGMENT_SHADER,FRAGMENT]]){
        const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);shaders.push(s);
        if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'Shader compilation failed');
      }
      this.program=gl.createProgram();shaders.forEach(s=>gl.attachShader(this.program,s));gl.linkProgram(this.program);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error('Shader program linking failed');
    }finally{shaders.forEach(s=>gl.deleteShader(s));}
    this.attributes={position:gl.getAttribLocation(this.program,'aPosition'),normal:gl.getAttribLocation(this.program,'aNormal')};
    this.uniforms={};for(const name of ['View','Projection','Color','Eye','Opacity','Cut','Organic','Highlight'])this.uniforms[name]=gl.getUniformLocation(this.program,`u${name}`);
    const model=buildModel();this.anchors=model.anchors;this.picks=model.picks;this.meshes={};
    for(const [name,m] of Object.entries(model.meshes)) {
      const position=gl.createBuffer(),normal=gl.createBuffer(),index=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,position);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(m.positions),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(m.normals),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(m.indices),gl.STATIC_DRAW);
      this.meshes[name]={position,normal,index,count:m.indices.length};
    }
    this.layers={shell:true,skeleton:false,hemoglobin:false,proteins:true};this.view='whole';this.mode='orbit';this.oxygen=.9;this.active='shape';this.spin=false;
    this.target=[0,0,0];this.yaw=.32;this.pitch=.69;this.distance=11.4;this.flyPosition=[0,0,10];this.flyYaw=0;this.flyPitch=0;
    this.frame=0;this.lastTime=0;this.keys=new Set();this.pointers=new Map();this.gestureMoved=false;this.abort=new AbortController();this.disposed=false;this.lost=false;
    const options={signal:this.abort.signal};
    canvas.addEventListener('contextmenu',e=>e.preventDefault(),options);
    canvas.addEventListener('pointerdown',e=>this.pointerDown(e),options);
    canvas.addEventListener('pointermove',e=>this.pointerMove(e),options);
    canvas.addEventListener('pointerup',e=>this.pointerUp(e),options);
    canvas.addEventListener('pointercancel',()=>{this.pointers.clear();this.keys.clear();this.gestureMoved=true;},options);
    canvas.addEventListener('lostpointercapture',()=>{this.pointers.clear();},options);
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(clamp(e.deltaY,-100,100)*.003));},{...options,passive:false});
    canvas.addEventListener('keydown',e=>this.keyDown(e),options);
    canvas.addEventListener('keyup',e=>{this.keys.delete(e.key.toLowerCase());},options);
    canvas.addEventListener('blur',()=>this.keys.clear(),options);
    window.addEventListener('blur',()=>{this.keys.clear();this.pointers.clear();},options);
    document.addEventListener('visibilitychange',()=>{this.keys.clear();this.pointers.clear();if(!document.hidden)this.request();},options);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.keys.clear();cancelAnimationFrame(this.frame);this.frame=0;onFailure('The graphics context was interrupted. Your field notes are still available. Reload to restore 3D.');},options);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);const dpr=Math.min(window.devicePixelRatio||1,1.75,Math.sqrt(1500000/(this.width*this.height)));this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.request();}
  getEye(){if(this.mode==='fly')return this.flyPosition;return add(this.target,mul([Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch)],this.distance));}
  getForward(){return this.mode==='fly'?[Math.sin(this.flyYaw)*Math.cos(this.flyPitch),Math.sin(this.flyPitch),-Math.cos(this.flyYaw)*Math.cos(this.flyPitch)]:norm(sub(this.target,this.getEye()));}
  setMode(mode){
    if(mode===this.mode)return;
    if(mode==='fly'){this.flyPosition=[...this.getEye()];const f=this.getForward();this.flyPitch=Math.asin(clamp(f[1],-1,1));this.flyYaw=Math.atan2(f[0],-f[2]);}
    else{const eye=this.getEye(),center=add(eye,mul(this.getForward(),clamp(length(eye),2,14))),offset=sub(eye,center);this.target=center;this.distance=length(offset);this.pitch=Math.asin(offset[1]/this.distance);this.yaw=Math.atan2(offset[0],offset[2]);}
    this.mode=mode;this.keys.clear();this.spin=false;this.request();
  }
  home(){this.mode='orbit';this.target=[0,0,0];this.yaw=.32;this.pitch=.69;this.distance=this.width/this.height<1?12.1:11.4;this.spin=false;this.keys.clear();this.request();}
  focus(id){this.active=id;this.mode='orbit';this.spin=false;this.keys.clear();if(['shape','spectrin','ankyrin','band3','membrane'].includes(id))this.home();else{this.target=[...this.anchors[id]];this.yaw=.12;this.pitch=.40;this.distance=id==='no-nucleus'?8.5:id==='hemoglobin'?5.7:5.1;this.request();}}
  zoom(factor){this.spin=false;if(this.mode==='orbit')this.distance=clamp(this.distance*factor,.7,70);else this.flyPosition=add(this.flyPosition,mul(this.getForward(),(1-factor)*4));this.request();}
  setMovement(key,on){if(on)this.keys.add(key);else this.keys.delete(key);this.request();}
  keyDown(e){
    const k=e.key.toLowerCase();if(k==='r'){e.preventDefault();this.home();return;}
    if(k==='+'||k==='='||k==='-'){e.preventDefault();this.zoom(k==='-'?1.15:1/1.15);return;}
    if(k==='escape'){this.keys.clear();this.spin=false;this.request();return;}
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)||(this.mode==='fly'&&['w','a','s','d','q','e'].includes(k))){e.preventDefault();this.keys.add(k);this.spin=false;this.request();}
  }
  pointerDown(e){if(e.button!==0&&e.button!==2)return;this.canvas.focus({preventScroll:true});this.canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.down={x:e.clientX,y:e.clientY,time:performance.now()};if(this.pointers.size===1)this.gestureMoved=false;else this.gestureMoved=true;this.spin=false;}
  pointerMove(e){
    const old=this.pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;
    if(this.down&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>5)this.gestureMoved=true;
    if(this.pointers.size===2){const other=[...this.pointers.entries()].find(([id])=>id!==e.pointerId)[1];const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(after>5)this.zoom(before/after);}
    else if(this.mode==='fly'){this.flyYaw+=dx*.005;this.flyPitch=clamp(this.flyPitch-dy*.005,-1.5,1.5);}
    else if(e.shiftKey||e.buttons===2){const f=this.getForward(),right=norm(cross(f,[0,1,0])),up=cross(right,f),scale=this.distance*.0017;this.target=add(this.target,add(mul(right,-dx*scale),mul(up,dy*scale)));}
    else{this.yaw-=dx*.006;this.pitch=clamp(this.pitch+dy*.006,-1.53,1.53);}
    this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.request();
  }
  pointerUp(e){const shouldPick=this.pointers.size===1&&!this.gestureMoved&&this.down&&performance.now()-this.down.time<700&&e.button===0;this.pointers.delete(e.pointerId);if(shouldPick){const r=this.canvas.getBoundingClientRect(),id=this.pick(e.clientX-r.left,e.clientY-r.top);if(id)this.onPick(id);}this.request();}
  pick(x,y){
    const origin=this.getEye(),forward=this.getForward(),right=norm(cross(forward,[0,1,0])),up=cross(right,forward),s=Math.tan(47*Math.PI/360);
    const dir=norm(add(forward,add(mul(right,(x/this.width*2-1)*s*this.width/this.height),mul(up,(1-y/this.height*2)*s))));
    let body=Infinity;
    if(this.layers.shell&&this.view!=='scaffold'){let previous=containsCell(origin);for(let t=.025;t<Math.min(100,length(origin)+12);t+=.025){const p=add(origin,mul(dir,t)),inside=containsCell(p);if(inside!==previous&&(this.view!=='inside'||p[2]<.045)){body=t;break;}previous=inside;}}
    let nearest=body,chosen=Number.isFinite(body)?'membrane':null;
    for(const item of this.picks){if(!this.layers[item.layer]||(this.view==='inside'&&item.p[2]>.07))continue;const rel=sub(item.p,origin),t=dot(rel,dir);if(t<=0||t>nearest+item.r)continue;const d2=dot(rel,rel)-t*t;if(d2>item.r*item.r)continue;const hit=t-Math.sqrt(item.r*item.r-d2);if(hit<nearest){nearest=hit;chosen=item.id;}}
    return chosen;
  }
  request(){if(!this.disposed&&!this.lost&&!this.frame&&!document.hidden)this.frame=requestAnimationFrame(t=>this.draw(t));}
  draw(time){
    this.frame=0;if(this.disposed||this.lost||document.hidden)return;const dt=clamp((time-this.lastTime)/1000,0,.04);this.lastTime=time;
    if(this.spin&&this.mode==='orbit')this.yaw+=dt*.12;
    if(this.mode==='orbit'){
      if(this.keys.has('arrowleft'))this.yaw+=dt;if(this.keys.has('arrowright'))this.yaw-=dt;if(this.keys.has('arrowup'))this.pitch=clamp(this.pitch+dt,-1.53,1.53);if(this.keys.has('arrowdown'))this.pitch=clamp(this.pitch-dt,-1.53,1.53);
    }else{
      if(this.keys.has('arrowleft'))this.flyYaw-=dt;if(this.keys.has('arrowright'))this.flyYaw+=dt;if(this.keys.has('arrowup'))this.flyPitch=clamp(this.flyPitch+dt,-1.5,1.5);if(this.keys.has('arrowdown'))this.flyPitch=clamp(this.flyPitch-dt,-1.5,1.5);
      const forward=this.getForward(),right=norm(cross(forward,[0,1,0]));let movement=[0,0,0];
      for(const [key,vector] of [['w',forward],['s',mul(forward,-1)],['d',right],['a',mul(right,-1)],['e',[0,1,0]],['q',[0,-1,0]]])if(this.keys.has(key))movement=add(movement,vector);
      if(length(movement)>0)this.flyPosition=add(this.flyPosition,mul(norm(movement),dt*2.1));
      if(length(this.flyPosition)>80)this.flyPosition=mul(norm(this.flyPosition),80);
    }
    const gl=this.gl,eye=this.getEye(),target=add(eye,this.getForward());this.viewMatrix=lookAt(eye,target);this.projection=perspective(47*Math.PI/180,this.width/this.height);
    gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniforms.View,false,this.viewMatrix);gl.uniformMatrix4fv(this.uniforms.Projection,false,this.projection);gl.uniform3fv(this.uniforms.Eye,eye);
    const cut=this.view==='inside'?1:0;
    if(this.layers.shell&&this.view!=='scaffold')this.drawMesh('membrane',this.cellColor(),1,cut);
    if(this.layers.skeleton){this.drawMesh('spectrin',COLORS.spectrin,1,cut);this.drawMesh('nodes',COLORS.nodes,1,cut);this.drawMesh('ankyrin',COLORS.ankyrin,1,cut);}
    if(this.layers.hemoglobin){this.drawMesh('alpha',COLORS.alpha.map((v,i)=>i===0?v*(.65+.35*this.oxygen):v),1,cut);this.drawMesh('beta',COLORS.beta,1,cut);}
    if(this.layers.proteins)for(const id of ['band3','rhd','abo'])this.drawMesh(id,COLORS[id],1,cut);
    if(this.layers.shell&&this.view==='scaffold'){gl.depthMask(false);this.drawMesh('membrane',this.cellColor(),.12,0);gl.depthMask(true);}
    this.onFrame(this);
    if(this.spin||this.keys.size)this.request();
  }
  cellColor(){return [.32+.53*this.oxygen,.025+.055*this.oxygen,.085+.07*this.oxygen];}
  drawMesh(name,color,opacity,cut){const gl=this.gl,m=this.meshes[name];gl.bindBuffer(gl.ARRAY_BUFFER,m.position);gl.vertexAttribPointer(this.attributes.position,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(this.attributes.position);gl.bindBuffer(gl.ARRAY_BUFFER,m.normal);gl.vertexAttribPointer(this.attributes.normal,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(this.attributes.normal);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.index);gl.uniform3fv(this.uniforms.Color,color);gl.uniform1f(this.uniforms.Opacity,opacity);gl.uniform1f(this.uniforms.Cut,cut);gl.uniform1f(this.uniforms.Organic,name==='membrane'?1:0);gl.uniform1f(this.uniforms.Highlight,name===this.active?1:0);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);}
  screenPoint(p){return project(p,this.viewMatrix,this.projection,this.width,this.height);}
  anchorVisible(id){
    if(!this.viewMatrix)return false;
    if(['shape','membrane'].includes(id)&&!this.layers.shell)return false;
    if(['spectrin','ankyrin'].includes(id)&&!this.layers.skeleton)return false;
    if(id==='hemoglobin'&&!this.layers.hemoglobin)return false;
    if(['abo','rhd','band3'].includes(id)&&!this.layers.proteins)return false;
    if(this.view==='inside'&&['abo','rhd','band3','ankyrin','shape'].includes(id))return false;
    if(this.view==='whole'&&this.layers.shell&&['spectrin','ankyrin','hemoglobin'].includes(id))return false;
    const p=this.anchors[id];
    if(this.view==='whole'&&id!=='hemoglobin'){
      const r=Math.hypot(p[0],p[1]),dh=(halfThickness(r+.005)-halfThickness(Math.max(0,r-.005)))/.01,n=norm([-dh*p[0]/(r||1),-dh*p[1]/(r||1),1]);
      if(dot(n,sub(this.getEye(),p))<=0)return false;
    }
    return true;
  }
  anchorPoint(id){const p=[...this.anchors[id]];if(this.view==='inside'&&['spectrin','membrane'].includes(id))p[2]=-Math.abs(p[2]);return p;}
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.abort.abort();this.resizeObserver.disconnect();const gl=this.gl;for(const m of Object.values(this.meshes))for(const key of ['position','normal','index'])gl.deleteBuffer(m[key]);gl.deleteProgram(this.program);}
}
