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
