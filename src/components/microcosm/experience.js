import { topics,tour,readExplored } from './data.js';
import { renderTopic } from './shell.js';
import { CellRenderer } from './renderer.js';
import { add,mul,norm,cross } from './geometry.js';
const STORAGE='roughatsea:microcosm:rbc:explored:v1';
export function mountMicrocosm(){
  const root=document.getElementById('microcosm');if(!root||root.dataset.mounted)return()=>{};root.dataset.mounted='true';
  const find=id=>{const el=document.getElementById(id);if(!el)throw new Error(`Missing Microcosm element: ${id}`);return el;};
  const canvas=find('mc-canvas'),status=find('mc-render-status'),inspector=find('mc-inspector'),abort=new AbortController(),opt={signal:abort.signal};
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer=null,explored=[],persistent=true,selected='shape',tourIndex=-1,labels=true;
  try{explored=readExplored(localStorage.getItem(STORAGE));localStorage.setItem(STORAGE,JSON.stringify(explored));}catch{persistent=false;}
  const pressed=(selector,value)=>root.querySelectorAll(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===value||b.dataset.camera===value||b.dataset.panel===value)));
  function syncCamera(){if(!renderer)return;pressed('[data-camera]',renderer.mode);find('mc-flight-pad').hidden=renderer.mode!=='fly';find('mc-spin').setAttribute('aria-pressed',String(renderer.spin));canvas.dataset.camera=renderer.mode;
    find('mc-controls-help').textContent=renderer.mode==='fly'?'Drag to look · W/A/S/D move · Q/E lower/rise · Touch: hold the flight buttons · R resets':'Drag to orbit · Scroll or pinch to zoom · Shift-drag to pan · Arrow keys rotate a focused canvas';
    canvas.setAttribute('aria-label',renderer.mode==='fly'?'Three-dimensional red blood cell. Drag to look; W A S D move; Q E lower or rise; arrow keys look; R resets.':'Three-dimensional red blood cell. Drag to orbit, scroll to zoom. Arrow keys rotate; plus and minus zoom; R resets.');
  }
  function updateProgress(){find('mc-progress').textContent=`${explored.length} / ${topics.length} explored ${persistent?'on this device':'this visit'}`;root.querySelectorAll('[data-catalog]').forEach(b=>{const seen=explored.includes(b.dataset.catalog);b.classList.toggle('is-explored',seen);b.querySelector('.mc-topic-check').textContent=seen?'✓':'↗';b.setAttribute('aria-pressed',String(b.dataset.catalog===selected));});}
  function setPanel(panel){pressed('[data-panel]',panel);find('mc-inspect-panel').hidden=panel!=='inspect';find('mc-evolution-panel').hidden=panel!=='evolution';}
  function syncLayers(){if(!renderer)return;for(const [id,key] of [['mc-shell','shell'],['mc-skeleton','skeleton'],['mc-hemoglobin','hemoglobin'],['mc-proteins','proteins']])find(id).checked=renderer.layers[key];}
  function setView(view){pressed('[data-view]',view);root.dataset.view=view;if(renderer){renderer.view=view;renderer.layers={shell:true,skeleton:view!=='whole',hemoglobin:view==='inside',proteins:true};syncLayers();renderer.request();}
    find('mc-view-note').textContent=view==='whole'?'Surface markers enlarged':view==='inside'?'Cutaway · molecular sizes exaggerated':'Schematic network · not a molecular reconstruction';
  }
  function syncTour(){const area=find('mc-tour');area.hidden=tourIndex<0;if(tourIndex<0)return;find('mc-tour-position').textContent=`TOUR ${tourIndex+1} / ${tour.length}`;find('mc-tour-prev').disabled=tourIndex===0;find('mc-tour-next').textContent=tourIndex===tour.length-1?'Finish ✓':'Next →';}
  function select(id,{focus=true,mark=true,scroll=false,keepTour=false}={}){
    const topic=topics.find(t=>t.id===id);if(!topic)return;
    selected=id;if(!keepTour){tourIndex=-1;syncTour();}
    if(mark&&!explored.includes(id)){explored.push(id);if(persistent)try{localStorage.setItem(STORAGE,JSON.stringify(explored));}catch{persistent=false;}}
    find('mc-topic-content').innerHTML=`<button type="button" class="mc-return-scene" data-return-scene>↑ Back to the 3D cell</button>${renderTopic(topic)}`;
    find('mc-note-index').textContent=`ENCOUNTER ${String(topics.indexOf(topic)+1).padStart(2,'0')}`;
    find('mc-inspect-panel').scrollTop=0;setPanel('inspect');updateProgress();
    if(renderer){renderer.active=id;if(focus){setView(topic.view);renderer.focus(id);}renderer.request();syncCamera();}
    try{history.replaceState(null,'',`#rbc/${id}`);}catch{/* Embedded/private contexts may not permit history mutation. */}
    if(scroll&&window.innerWidth<=760){inspector.scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'start'});inspector.focus({preventScroll:true});}
  }
  function nextTour(delta){if(tourIndex+delta>=tour.length){tourIndex=-1;syncTour();find('mc-tour-start').textContent='Tour complete · Explore freely ↗';return;}tourIndex=Math.max(0,tourIndex+delta);select(tour[tourIndex],{keepTour:true,scroll:true});syncTour();}
  function failure(message){root.dataset.noWebgl='true';root.dataset.ready='fallback';status.hidden=false;status.replaceChildren(document.createTextNode(message));const reload=document.createElement('button');reload.type='button';reload.textContent='Reload 3D';reload.addEventListener('click',()=>location.reload(),opt);status.appendChild(reload);root.querySelectorAll('.mc-hotspot').forEach(b=>b.hidden=true);find('mc-scale').hidden=true;root.querySelectorAll('[data-camera],[data-view],#mc-reset,#mc-spin,#mc-zoom-in,#mc-zoom-out,.mc-tools input').forEach(el=>el.disabled=true);}
  // Both scene labels and the keyboard-accessible index open exactly the same content.
  root.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('button'):null;if(!target)return;
    if(target.dataset.topic){select(target.dataset.topic,{scroll:true});return;}
    if(target.dataset.view){setView(target.dataset.view);return;}
    if(target.dataset.panel){setPanel(target.dataset.panel);return;}
    if(target.dataset.camera&&renderer){renderer.setMode(target.dataset.camera);syncCamera();return;}
    if(target.hasAttribute('data-return-scene')){find('mc-stage').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'center'});canvas.focus({preventScroll:true});}
  },opt);
  find('mc-tour-start').addEventListener('click',()=>{tourIndex=0;select(tour[0],{keepTour:true,scroll:true});syncTour();},opt);
  find('mc-tour-prev').addEventListener('click',()=>nextTour(-1),opt);find('mc-tour-next').addEventListener('click',()=>nextTour(1),opt);
  find('mc-tour-end').addEventListener('click',()=>{tourIndex=-1;syncTour();},opt);
  for(const [id,key] of [['mc-shell','shell'],['mc-skeleton','skeleton'],['mc-hemoglobin','hemoglobin'],['mc-proteins','proteins']])find(id).addEventListener('change',e=>{
    if(!renderer)return;const value=e.target.checked;
    if(value&&renderer.view==='whole'&&(key==='skeleton'||key==='hemoglobin'))setView(key==='hemoglobin'?'inside':'scaffold');
    renderer.layers[key]=value;syncLayers();renderer.request();
  },opt);
  find('mc-labels').addEventListener('change',e=>{labels=e.target.checked;renderer?.request();},opt);
  find('mc-oxygenation').addEventListener('input',e=>{const v=Number(e.target.value);e.target.setAttribute('aria-valuetext',`${v} percent on an illustrative color scale, not a calculated saturation`);if(renderer){renderer.oxygen=v/100;renderer.request();}},opt);
  find('mc-reset').addEventListener('click',()=>{renderer?.home();syncCamera();},opt);
  find('mc-zoom-in').addEventListener('click',()=>{renderer?.zoom(1/1.2);syncCamera();},opt);find('mc-zoom-out').addEventListener('click',()=>{renderer?.zoom(1.2);syncCamera();},opt);
  find('mc-spin').addEventListener('click',()=>{if(renderer){if(renderer.mode!=='orbit')renderer.setMode('orbit');renderer.spin=!renderer.spin;renderer.request();syncCamera();}},opt);
  const pad=find('mc-flight-pad');pad.querySelectorAll('[data-move]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);renderer?.setMovement(b.dataset.move,true);},opt);
    for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>renderer?.setMovement(b.dataset.move,false),opt);
    b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();renderer?.setMovement(b.dataset.move,true);}},opt);
    b.addEventListener('keyup',()=>renderer?.setMovement(b.dataset.move,false),opt);b.addEventListener('blur',()=>renderer?.setMovement(b.dataset.move,false),opt);
  });
  const hotspotButtons=[...root.querySelectorAll('[data-anchor]')];
  function onFrame(r){
    status.hidden=true;root.dataset.ready='true';syncCamera();
    const occupied=[];
    for(const button of [...hotspotButtons].sort((a,b)=>Number(b.dataset.anchor===selected)-Number(a.dataset.anchor===selected))){
      const id=button.dataset.anchor,point=r.screenPoint(r.anchorPoint(id)),w=button.offsetWidth||100,h=31;
      let visible=labels&&r.anchorVisible(id)&&point.visible&&point.depth>.12;
      const x=point.x+10,y=point.y-h/2;
      if(x<8||x+w>r.width-10||y<83||y+h>r.height-49)visible=false;
      if(visible&&occupied.some(box=>Math.abs(box.x-x)<(box.w+w)/2+16&&Math.abs(box.y-y)<h+8))visible=false;
      button.hidden=!visible;button.setAttribute('aria-pressed',String(id===selected));
      if(visible){button.style.left=`${point.x}px`;button.style.top=`${point.y}px`;occupied.push({x,y,w});}
    }
    const right=norm(cross(r.getForward(),[0,1,0])),center=r.target,origin=r.screenPoint(center);
    let unit=1,width=0;for(const candidate of [10,5,2,1,.5,.2,.1,.05,.01]){const end=r.screenPoint(add(center,mul(right,candidate)));const size=Math.abs(end.x-origin.x);if(size<=105&&size>=20){unit=candidate;width=size;break;}}
    find('mc-scale-line').style.width=`${width||30}px`;find('mc-scale-text').textContent=width?`${unit} µm · cell geometry only`:'Cell diameter ≈ 7.8 µm';
  }
  try{renderer=new CellRenderer(canvas,onFrame,id=>select(id,{scroll:true}),message=>failure(message));renderer.home();setView('whole');}
  catch(error){console.warn('Microcosm 3D unavailable:',error);failure('3D is unavailable in this browser. All nine topics and their sources remain available below.');}
  updateProgress();
  function readHash(){const match=location.hash.match(/^#rbc\/([a-z0-9-]+)$/);if(match&&topics.some(t=>t.id===match[1]))select(match[1],{mark:false});}
  readHash();window.addEventListener('hashchange',readHash,opt);
  window.addEventListener('pageshow',()=>renderer?.request(),opt);
  window.addEventListener('pagehide',e=>{if(!e.persisted){renderer?.dispose();abort.abort();}},opt);
  return()=>{renderer?.dispose();abort.abort();delete root.dataset.mounted;};
}
