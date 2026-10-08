import {nodes,defaultEdges,search,programs} from './algorithms-engine.mjs';
const root=document.querySelector('.algorithm-workspace');
if(root) {
 const $=id=>root.querySelector('#'+id), ns='http://www.w3.org/2000/svg';
 const compact=window.matchMedia('(max-width:600px)');
 const mobilePositions=[[210,50],[90,160],[330,160],[90,270],[330,270],[210,380],[90,490],[330,490],[210,600]];
 const graphNodes=()=>compact.matches?nodes.map((n,i)=>({...n,x:mobilePositions[i][0],y:mobilePositions[i][1]})):nodes;
 let algorithm=root.dataset.algorithm,edges=defaultEdges(),frames=[],index=0,timer=null,selected=0;
 const names={'breadth-first-search':'Fewest edges',dijkstra:'Lowest total weight',astar:'Lowest total weight · guided by an estimate'};
 const svg=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;return el;};
 const stop=()=>{if(timer)clearTimeout(timer);timer=null;$('play').textContent='Play';};
 function rebuild(){stop();frames=search(graphNodes(),edges,$('start').value,$('goal').value,algorithm);index=0;$('timeline').max=frames.length-1;render();}
 function edgeOptions(){ $('edge').replaceChildren(...edges.map((e,i)=>new Option(`${e.a}–${e.b}`,String(i))));selected=Math.min(selected,edges.length-1);$('edge').value=String(selected);$('weight').value=edges[selected]?.w??1;$('apply-weight').disabled=$('remove-edge').disabled=!edges.length; }
 function render(){
  const f=frames[index],bfs=algorithm==='breadth-first-search',aStar=algorithm==='astar';
  $('objective').textContent=names[algorithm];$('step-count').textContent=`Step ${index+1} / ${frames.length}`;
  $('timeline').value=index;$('explanation').textContent=f.message;$('explored').textContent=f.closed.length;$('examined').textContent=f.examined;$('waiting').textContent=f.open.length;
  $('back').disabled=index===0;$('step').disabled=index===frames.length-1;$('play').disabled=index===frames.length-1;
  $('frontier-title').textContent=bfs?'Queue · first in, first out':aStar?'Frontier · smallest cost + estimate first':'Frontier · smallest cost first';
  $('frontier').replaceChildren(...f.open.map(id=>{const s=document.createElement('span');s.textContent=id;return s;}));if(!f.open.length)$('frontier').textContent='Empty';
  $('distance-label').textContent=bfs?'Edges':'Cost';$('estimate-label').hidden=!aStar;
  $('distances').replaceChildren(...nodes.map(n=>{const tr=document.createElement('tr');tr.classList.toggle('active',n.id===f.current);const values=[n.id,Number.isFinite(f.distance[n.id])?String(f.distance[n.id]):'∞',f.parent[n.id]??'—'];if(aStar)values.push(f.estimates[n.id].toFixed(2));for(const v of values){const td=document.createElement('td');td.textContent=v;tr.append(td);}return tr;}));
  $('code').replaceChildren(...programs[algorithm].map((line,i)=>{const s=document.createElement('span');s.textContent=line;s.classList.toggle('active',i===f.line);return s;}));
  const graph=$('graph');graph.setAttribute('viewBox',compact.matches?'0 0 420 665':'0 0 1020 440');graph.replaceChildren();const displayNodes=graphNodes();
  const onPath=(a,b)=>f.path.some((id,i)=>i>0&&((id===a&&f.path[i-1]===b)||(id===b&&f.path[i-1]===a)));
  edges.forEach((e,i)=>{
   const a=displayNodes.find(n=>n.id===e.a),b=displayNodes.find(n=>n.id===e.b),route=onPath(e.a,e.b),inspected=f.selectedEdge&&f.selectedEdge.a===e.a&&f.selectedEdge.b===e.b;
   const g=svg('g',{role:'button',tabindex:'0','aria-label':`Connection ${e.a} to ${e.b}, weight ${e.w}. Edit connection.`});g.style.cursor='pointer';
   g.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'transparent','stroke-width':28}));
   g.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:route?'#b7ff53':inspected?'#ff48bd':'#3a5976','stroke-width':route||inspected?5:2}));
   const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
   g.append(svg('rect',{x:x-17,y:y-14,width:34,height:28,rx:8,fill:'#0d2138',stroke:route?'#b7ff53':'#42627f'}));g.append(svg('text',{x,y:y+6,'text-anchor':'middle',fill:'#edf5ff','font-size':18},String(e.w)));
   const edit=()=>{selected=i;edgeOptions();root.querySelector('.editor').open=true;$('weight').focus();};g.addEventListener('click',edit);g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();edit();}});graph.append(g);
  });
  const defs=svg('defs',{}),marker=svg('marker',{id:'predecessor-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'});marker.append(svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#37d6ff'}));defs.append(marker);graph.append(defs);
  Object.entries(f.parent).forEach(([id,previous])=>{const a=displayNodes.find(n=>n.id===id),b=displayNodes.find(n=>n.id===previous),distance=Math.hypot(b.x-a.x,b.y-a.y),dx=(b.x-a.x)/distance,dy=(b.y-a.y)/distance;const arrow=svg('line',{x1:a.x+dx*30,y1:a.y+dy*30,x2:b.x-dx*32,y2:b.y-dy*32,stroke:'#37d6ff','stroke-width':2,'stroke-dasharray':'4 6',opacity:.7,'marker-end':'url(#predecessor-arrow)','pointer-events':'none'});arrow.append(svg('title',{},`${id} was reached from ${previous}`));graph.append(arrow);});
  displayNodes.forEach(n=>{
   const color=f.path.includes(n.id)?'#b7ff53':n.id===f.current?'#ff48bd':f.closed.includes(n.id)?'#9974ff':f.open.includes(n.id)?'#37d6ff':'#63819f';
   const g=svg('g',{role:'button',tabindex:'0','aria-label':`Node ${n.id}${n.id===$('start').value?', start':''}${n.id===$('goal').value?', destination':''}. Set destination.`});g.style.cursor='pointer';
   if(n.id===f.current||f.path.includes(n.id))g.append(svg('circle',{cx:n.x,cy:n.y,r:37,fill:color,opacity:.12}));
   g.append(svg('circle',{cx:n.x,cy:n.y,r:25,fill:'#0b2038',stroke:color,'stroke-width':3}));g.append(svg('text',{x:n.x,y:n.y+7,'text-anchor':'middle',fill:color,'font-size':23,'font-weight':'bold'},n.id));
   if(n.id===$('start').value||n.id===$('goal').value)g.append(svg('text',{x:n.x,y:n.y+50,'text-anchor':'middle',fill:'#b1c5dc','font-size':16},n.id===$('start').value&&n.id===$('goal').value?'START / GOAL':n.id===$('start').value?'START':'GOAL'));
   const choose=()=>{$('goal').value=n.id;rebuild();};g.addEventListener('click',choose);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});graph.append(g);
  });
 }
 function tick(){if(index<frames.length-1){index++;render();}if(index<frames.length-1){timer=setTimeout(tick,Number($('speed').value));}else stop();}
 $('play').addEventListener('click',()=>{if(timer)stop();else{$('play').textContent='Pause';timer=setTimeout(tick,Number($('speed').value));}});
 $('step').addEventListener('click',()=>{stop();index=Math.min(index+1,frames.length-1);render();});$('back').addEventListener('click',()=>{stop();index=Math.max(0,index-1);render();});$('reset').addEventListener('click',rebuild);
 $('timeline').addEventListener('input',()=>{stop();index=Number($('timeline').value);render();});
 $('algorithm').addEventListener('change',()=>{algorithm=$('algorithm').value;rebuild();});['start','goal'].forEach(id=>$(id).addEventListener('change',rebuild));
 $('preset').addEventListener('change',()=>{edges=defaultEdges();if($('preset').value==='equal')edges.forEach(e=>e.w=1);if($('preset').value==='disconnected')edges=edges.filter(e=>e.a!=='I'&&e.b!=='I');edgeOptions();rebuild();});
 $('edge').addEventListener('change',()=>{selected=Number($('edge').value);$('weight').value=edges[selected].w;});
 $('apply-weight').addEventListener('click',()=>{const weight=Number($('weight').value);if(!Number.isInteger(weight)||weight<1||weight>99){$('edit-status').textContent='Choose a whole-number weight between 1 and 99.';return;}edges[selected].w=weight;$('edit-status').textContent='Weight updated. Search reset.';rebuild();});
 $('remove-edge').addEventListener('click',()=>{edges.splice(selected,1);edgeOptions();$('edit-status').textContent='Connection removed. Search reset.';rebuild();});
 $('add-edge').addEventListener('click',()=>{const a=$('connect-a').value,b=$('connect-b').value;if(a===b){$('edit-status').textContent='Choose two different nodes.';return;}if(edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))){$('edit-status').textContent='That connection already exists.';return;}edges.push({a,b,w:1});selected=edges.length-1;edgeOptions();$('edit-status').textContent='Connection added with weight 1. You can edit its weight.';rebuild();});
 $('restore').addEventListener('click',()=>{edges=defaultEdges();$('preset').value='weighted';edgeOptions();$('edit-status').textContent='Original map restored.';rebuild();});
 root.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>{root.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('data-panel').hidden=button.dataset.panel!=='data';$('code-panel').hidden=button.dataset.panel!=='code';}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 compact.addEventListener('change',rebuild);
 edgeOptions();rebuild();
}
