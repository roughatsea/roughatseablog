// Each emitted frame is an immutable snapshot of an actual search operation.
export const nodes = [
  {id:'A',x:90,y:220},{id:'B',x:245,y:95},{id:'C',x:245,y:345},
  {id:'D',x:420,y:95},{id:'E',x:420,y:345},{id:'F',x:600,y:220},
  {id:'G',x:775,y:95},{id:'H',x:775,y:345},{id:'I',x:930,y:220}
];
export function defaultEdges() { return [
  ['A','B',8],['A','C',2],['B','D',8],['B','E',3],['C','E',2],
  ['D','F',7],['E','F',2],['D','G',4],['E','H',3],['F','G',2],
  ['F','H',2],['G','I',5],['H','I',2]
].map(([a,b,w])=>({a,b,w})); }
export const programs = {
  'depth-first-search': [
    'stack = [frame(start)]; visited.add(start);',
    'while (stack.length > 0) {',
    '  current = stack.top().node;',
    '  if (current === goal) return reconstruct(parent);',
    '  if (stack.top().neighborsExhausted()) {',
    '    stack.pop(); continue; // backtrack',
    '  }',
    '  neighbor = stack.top().nextNeighbor();',
    '  if (!visited.has(neighbor)) {',
    '    visited.add(neighbor); recordParentAndDepth();',
    '    stack.push(frame(neighbor));',
    '  }',
    '}',
    'return null; // no path'
  ],
  'greedy-best-first-search': [
    'open = [start]; cost[start] = 0;',
    'while (open.length > 0) {',
    '  current = extractMinimum(open, estimate);',
    '  if (current === goal) return reconstruct(parent);',
    '  for ({neighbor, weight} of neighbors(current)) {',
    '    if (cost[neighbor] === Infinity) {',
    '      cost[neighbor] = cost[current] + weight;',
    '      parent[neighbor] = current;',
    '      open.push(neighbor);',
    '    }',
    '  }',
    '}',
    'return null; // no path'
  ],
  'bidirectional-bfs': [
    'initializeQueuesAndDistances(start, goal);',
    'if (start === goal) return [start];',
    'while (bothQueuesNonempty()) {',
    '  side = alternate(); count = queue[side].length;',
    '  repeat(count) { // expand one complete layer',
    '    current = queue[side].shift();',
    '    for (neighbor of neighbors(current)) {',
    '      if (!discovered[side].has(neighbor)) {',
    '        recordDepthAndParent(); enqueue(neighbor);',
    '        checkOtherSideAndKeepShortestMeeting();',
    '      }',
    '    }',
    '  }',
    '  if (meeting) return joinPaths(meeting);',
    '}',
    'return null; // no path'
  ],
  'breadth-first-search': [
    'queue = [start]; distance[start] = 0;',
    'while (queue.length > 0) {',
    '  current = queue.shift();',
    '  if (current === goal) return reconstruct(parent);',
    '  for (neighbor of neighbors(current)) {',
    '    if (distance[neighbor] === Infinity) {',
    '      distance[neighbor] = distance[current] + 1;',
    '      parent[neighbor] = current;',
    '      queue.push(neighbor);',
    '    }',
    '  }',
    '}',
    'return null; // no path'
  ],
  dijkstra: [
    'open = [start]; distance[start] = 0;',
    'while (open.length > 0) {',
    '  current = extractMinimum(open, distance);',
    '  if (current === goal) return reconstruct(parent);',
    '  for ({neighbor, weight} of neighbors(current)) {',
    '    candidate = distance[current] + weight;',
    '    if (candidate < distance[neighbor]) {',
    '      distance[neighbor] = candidate;',
    '      parent[neighbor] = current;',
    '      insertIfAbsent(open, neighbor);',
    '    }',
    '  }',
    '}',
    'return null; // no path'
  ],
  astar: [
    'open = [start]; distance[start] = 0;',
    'while (open.length > 0) {',
    '  current = extractMinimum(open, distancePlusEstimate);',
    '  if (current === goal) return reconstruct(parent);',
    '  for ({neighbor, weight} of neighbors(current)) {',
    '    candidate = distance[current] + weight;',
    '    if (candidate < distance[neighbor]) {',
    '      distance[neighbor] = candidate;',
    '      parent[neighbor] = current;',
    '      insertIfAbsent(open, neighbor);',
    '    }',
    '  }',
    '}',
    'return null; // no path'
  ]
};
export function search(graphNodes, edges, start, goal, algorithm) {
  if (!programs[algorithm]) throw new Error('Unknown algorithm');
  if (!graphNodes.some(n=>n.id===start) || !graphNodes.some(n=>n.id===goal)) throw new Error('Unknown endpoint');
  if (edges.some(e=>!Number.isFinite(e.w)||e.w<=0)) throw new Error('Weights must be positive');
  if (algorithm==='depth-first-search') return depthFirst(graphNodes,edges,start,goal);
  if (algorithm==='greedy-best-first-search') return greedySearch(graphNodes,edges,start,goal);
  if (algorithm==='bidirectional-bfs') return bidirectionalSearch(graphNodes,edges,start,goal);
  const bfs=algorithm==='breadth-first-search', distance=Object.fromEntries(graphNodes.map(n=>[n.id,Infinity]));
  const parent={}, open=[start], closed=[], frames=[];
  let current=null, examined=0, selectedEdge=null, path=[];
  const point=id=>graphNodes.find(n=>n.id===id);
  const length=(a,b)=>Math.hypot(point(a).x-point(b).x,point(a).y-point(b).y);
  // Every edge costs at least scale times its drawn length. Triangle inequality
  // makes this Euclidean estimate admissible AND consistent, even after editing.
  const scale=edges.length?Math.min(...edges.map(e=>e.w/length(e.a,e.b))):0;
  const h=id=>algorithm==='astar'?scale*length(id,goal):0;
  const priority=id=>distance[id]+h(id);
  const ordered=()=>bfs?[...open]:[...open].sort((a,b)=>priority(a)-priority(b)||a.localeCompare(b));
  const emit=(line,message,done=false)=>frames.push({line,message,done,current,examined,selectedEdge:selectedEdge&&{...selectedEdge},distance:{...distance},parent:{...parent},open:ordered(),closed:[...closed],path:[...path],estimates:Object.fromEntries(graphNodes.map(n=>[n.id,h(n.id)]))});
  distance[start]=0;
  emit(0,`Begin at ${start}. Its distance is 0; every other distance is unknown. ${bfs?'The queue holds nodes in discovery order.':'The frontier holds discovered nodes waiting to be explored.'}`);
  while(open.length) {
    emit(1,`${open.length} node${open.length===1?'':'s'} remain in the ${bfs?'queue':'frontier'}.`);
    if(!bfs) open.sort((a,b)=>priority(a)-priority(b)||a.localeCompare(b));
    current=open.shift(); selectedEdge=null; closed.push(current);
    emit(2,bfs?`Remove ${current} from the front of the queue.`:`Choose ${current}: ${algorithm==='astar'?'cost so far + estimated remaining cost':'cost so far'} is smallest (${priority(current).toFixed(2)}).`);
    if(current===goal) {
      path=[goal];let id=goal;while(id!==start){id=parent[id];path.unshift(id);}
      const cost=path.slice(1).reduce((sum,id,i)=>sum+edges.find(e=>(e.a===path[i]&&e.b===id)||(e.b===path[i]&&e.a===id)).w,0);
      emit(3,`Destination reached. Path: ${path.join(' → ')}. ${path.length-1} edges; total weight ${cost}. ${bfs?'Breadth-first search minimizes edge count, not total weight.':'This path has the minimum total weight.'}`,true);
      return frames;
    }
    emit(3,`${current} is not destination ${goal}; continue exploring.`);
    const adjacent=edges.filter(e=>e.a===current||e.b===current);
    for(const edge of adjacent) {
      const neighbor=edge.a===current?edge.b:edge.a;selectedEdge=edge;examined++;
      emit(4,`Inspect the connection from ${current} to ${neighbor}${bfs?'; its weight does not affect breadth-first search':`, weight ${edge.w}`}.`);
      if(bfs) {
        emit(5,Number.isFinite(distance[neighbor])?`${neighbor} is already discovered; skip it.`:`${neighbor} is undiscovered; record its first route.`);
        if(!Number.isFinite(distance[neighbor])) {
          distance[neighbor]=distance[current]+1;emit(6,`Distance to ${neighbor} is ${distance[neighbor]} edges.`);
          parent[neighbor]=current;emit(7,`Record ${current} as the predecessor of ${neighbor}.`);
          open.push(neighbor);emit(8,`Add ${neighbor} to the back of the queue.`);
        }
      } else {
        const candidate=distance[current]+edge.w;
        emit(5,`Candidate cost to ${neighbor}: ${distance[current]} + ${edge.w} = ${candidate}.`);
        emit(6,candidate<distance[neighbor]?`${candidate} improves the known cost to ${neighbor} (${Number.isFinite(distance[neighbor])?distance[neighbor]:'unknown'}).`:`${candidate} does not improve the known cost to ${neighbor} (${distance[neighbor]}). Keep the existing route.`);
        if(candidate<distance[neighbor]) {
          distance[neighbor]=candidate;emit(7,`Update the cost to ${neighbor} to ${candidate}.`);
          parent[neighbor]=current;emit(8,`Record ${current} as the predecessor of ${neighbor}.`);
          if(!open.includes(neighbor))open.push(neighbor);
          emit(9,`${neighbor} is in the frontier with priority ${priority(neighbor).toFixed(2)}.`);
        }
      }
    }
  }
  current=null;selectedEdge=null;
  emit(programs[algorithm].length-1,`The frontier is empty. No path connects ${start} to ${goal}.`,true);
  return frames;
}

function emptyDistances(graphNodes) { return Object.fromEntries(graphNodes.map(n=>[n.id,Infinity])); }
function neighbors(edges,id) { return edges.filter(e=>e.a===id||e.b===id).map(edge=>({edge,id:edge.a===id?edge.b:edge.a})); }
function reconstruct(parent,start,goal) {
  const path=[goal];let id=goal;
  while(id!==start){id=parent[id];path.unshift(id);}
  return path;
}
function pathSummary(path,edges) {
  const cost=path.slice(1).reduce((sum,id,i)=>sum+edges.find(e=>(e.a===path[i]&&e.b===id)||(e.b===path[i]&&e.a===id)).w,0);
  return `Path: ${path.join(' → ')}. ${path.length-1} edges; total weight ${cost}.`;
}
function depthFirst(graphNodes,edges,start,goal) {
  const distance=emptyDistances(graphNodes),parent={},closed=[start],frames=[];
  const stack=[{id:start,next:0,neighbors:neighbors(edges,start)}];
  let current=start,examined=0,selectedEdge=null,path=[];
  distance[start]=0;
  const emit=(line,message,done=false)=>frames.push({line,message,done,current,examined,selectedEdge:selectedEdge&&{...selectedEdge},distance:{...distance},parent:{...parent},open:stack.map(f=>f.id).reverse(),closed:[...closed],path:[...path],estimates:{}});
  emit(0,`Visit ${start} and push its frame onto the stack. A frame remembers which neighbors still need inspection.`);
  while(stack.length){
    emit(1,`The stack holds ${stack.length} active frame${stack.length===1?'':'s'}.`);
    const top=stack.at(-1);current=top.id;selectedEdge=null;
    emit(2,`Resume the frame for ${current}. Follow one undiscovered neighbor before inspecting its next sibling.`);
    if(current===goal){path=reconstruct(parent,start,goal);emit(3,`Destination reached. ${pathSummary(path,edges)} Depth-first search does not guarantee the fewest edges or lowest weight.`,true);return frames;}
    emit(3,`${current} is not destination ${goal}.`);
    emit(4,top.next===top.neighbors.length?`${current} has no remaining neighbors. Backtrack.`:`${current} still has a neighbor to inspect.`);
    if(top.next===top.neighbors.length){stack.pop();emit(5,`Pop ${current}'s frame${stack.length?` and return to ${stack.at(-1).id}`:''}.`);continue;}
    const next=top.neighbors[top.next++];selectedEdge=next.edge;examined++;
    emit(7,`Inspect ${current} → ${next.id}. Edge weight does not guide depth-first search.`);
    const discovered=Number.isFinite(distance[next.id]);emit(8,discovered?`${next.id} is already visited; skip it to avoid cycles.`:`${next.id} is unvisited; descend into this branch.`);
    if(!discovered){distance[next.id]=distance[current]+1;parent[next.id]=current;closed.push(next.id);emit(9,`Mark ${next.id} visited. Record predecessor ${current} and tree depth ${distance[next.id]}. This depth is not necessarily a shortest distance.`);stack.push({id:next.id,next:0,neighbors:neighbors(edges,next.id)});emit(10,`Push the frame for ${next.id}. Its neighbors will be inspected before resuming ${current}.`);}
  }
  current=null;selectedEdge=null;emit(13,`The stack is empty. No path connects ${start} to ${goal}.`,true);return frames;
}
function greedySearch(graphNodes,edges,start,goal){
  const point=id=>graphNodes.find(n=>n.id===id),length=(a,b)=>Math.hypot(point(a).x-point(b).x,point(a).y-point(b).y);
  const scale=edges.length?Math.min(...edges.map(e=>e.w/length(e.a,e.b))):0;
  const estimates=Object.fromEntries(graphNodes.map(n=>[n.id,scale*length(n.id,goal)]));
  const distance=emptyDistances(graphNodes),parent={},open=[start],closed=[],frames=[];
  const order=()=>[...open].sort((a,b)=>estimates[a]-estimates[b]||a.localeCompare(b));
  let current=null,examined=0,selectedEdge=null,path=[];distance[start]=0;
  const emit=(line,message,done=false)=>frames.push({line,message,done,current,examined,selectedEdge:selectedEdge&&{...selectedEdge},distance:{...distance},parent:{...parent},open:order(),closed:[...closed],path:[...path],estimates:{...estimates}});
  emit(0,`Begin at ${start}. Greedy best-first search ranks nodes only by estimated remaining cost, ignoring cost already paid.`);
  while(open.length){
    emit(1,`${open.length} node${open.length===1?'':'s'} remain in the frontier.`);
    open.sort((a,b)=>estimates[a]-estimates[b]||a.localeCompare(b));current=open.shift();closed.push(current);selectedEdge=null;
    emit(2,`Choose ${current}: its estimate (${estimates[current].toFixed(2)}) is smallest. Recorded route cost ${distance[current]} does not affect this choice.`);
    if(current===goal){path=reconstruct(parent,start,goal);emit(3,`Destination reached. ${pathSummary(path,edges)} Greedy best-first search does not guarantee a cheapest or shortest path.`,true);return frames;}
    emit(3,`${current} is not destination ${goal}; inspect its neighbors.`);
    for(const next of neighbors(edges,current)){
      examined++;selectedEdge=next.edge;emit(4,`Inspect ${current} → ${next.id}, weight ${next.edge.w}.`);
      const discovered=Number.isFinite(distance[next.id]);emit(5,discovered?`${next.id} is already discovered; keep its first route.`:`${next.id} is undiscovered; record its first route.`);
      if(!discovered){distance[next.id]=distance[current]+next.edge.w;emit(6,`Record route cost ${distance[next.id]} to ${next.id}. This cost is not guaranteed optimal.`);parent[next.id]=current;emit(7,`Record predecessor ${current} for ${next.id}.`);open.push(next.id);emit(8,`Add ${next.id} with estimate ${estimates[next.id].toFixed(2)}.`);}
    }
  }
  current=null;selectedEdge=null;emit(12,`The frontier is empty. No path connects ${start} to ${goal}.`,true);return frames;
}
function bidirectionalSearch(graphNodes,edges,start,goal){
  const distance=emptyDistances(graphNodes),distanceReverse=emptyDistances(graphNodes),parent={},parentReverse={},queues=[[start],[goal]],visited=[[],[]],frames=[];
  distance[start]=0;distanceReverse[goal]=0;
  let side=0,current=null,examined=0,selectedEdge=null,path=[],meeting=null,best=Infinity;
  const emit=(line,message,done=false)=>frames.push({line,message,done,current,examined,side,selectedEdge:selectedEdge&&{...selectedEdge},distance:{...distance},distanceReverse:{...distanceReverse},parent:{...parent},parentReverse:{...parentReverse},open:[...queues[0],...queues[1]],openForward:[...queues[0]],openReverse:[...queues[1]],closed:[...new Set([...visited[0],...visited[1]])],closedForward:[...visited[0]],closedReverse:[...visited[1]],path:[...path],estimates:{},meeting});
  emit(0,`Begin two breadth-first searches: cyan from ${start}, amber from ${goal}. Each has its own queue, distances, and predecessors.`);
  if(start===goal){path=[start];meeting=start;emit(1,`Start equals destination. ${pathSummary(path,edges)}`,true);return frames;}
  emit(1,`Start ${start} and destination ${goal} differ; expand from both ends.`);
  while(queues[0].length&&queues[1].length){
    emit(2,'Both queues are nonempty. Alternate complete layers, preserving breadth-first order on each side.');
    const own=side===0?distance:distanceReverse,other=side===0?distanceReverse:distance,parents=side===0?parent:parentReverse,label=side===0?'start':'goal',count=queues[side].length;
    emit(3,`Expand the ${label} side's next complete layer: ${count} node${count===1?'':'s'}.`);
    for(let i=0;i<count;i++){
      emit(4,`Process node ${i+1} of ${count} in the ${label} layer.`);
      current=queues[side].shift();visited[side].push(current);selectedEdge=null;emit(5,`Remove ${current} from the ${label} queue; its distance from the ${label} is ${own[current]} edges.`);
      for(const next of neighbors(edges,current)){
        selectedEdge=next.edge;examined++;emit(6,`Inspect ${current} → ${next.id} from the ${label} side. Weights do not affect this search.`);
        const discovered=Number.isFinite(own[next.id]);emit(7,discovered?`${next.id} is already discovered on the ${label} side; skip it.`:`Discover ${next.id} from the ${label} side.`);
        if(!discovered){
          own[next.id]=own[current]+1;parents[next.id]=current;queues[side].push(next.id);emit(8,`Record ${own[next.id]} edges from the ${label} to ${next.id}, predecessor ${current}, and append ${next.id} to this queue.`);
          if(Number.isFinite(other[next.id])){const candidate=own[next.id]+other[next.id];if(candidate<best){best=candidate;meeting=next.id;}emit(9,`The searches meet at ${next.id}: ${own[next.id]} + ${other[next.id]} = ${candidate} edges. Best meeting so far: ${meeting} (${best} edges). Finish the layer before returning.`);}else emit(9,`${next.id} has not been discovered from the other end yet.`);
        }
      }
    }
    if(meeting!==null){path=reconstruct(parent,start,meeting);let id=meeting;while(id!==goal){id=parentReverse[id];path.push(id);}emit(13,`Layer complete. Join the two predecessor chains at ${meeting}. ${pathSummary(path,edges)} This path has the fewest edges; its weight need not be minimal.`,true);return frames;}
    emit(13,`Layer complete; no meeting yet. Switch to the ${side===0?'goal':'start'} side.`);side=1-side;
  }
  current=null;selectedEdge=null;emit(15,`One queue is empty. No path connects ${start} to ${goal}.`,true);return frames;
}
