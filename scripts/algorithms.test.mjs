import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodes,defaultEdges,search,programs} from '../public/scripts/algorithms-engine.mjs';
const algorithms=['breadth-first-search','dijkstra','astar'];
test('weighted shortcut distinguishes edge count from cost',()=>{
 const edges=[...defaultEdges(),{a:'A',b:'I',w:99}];
 assert.deepEqual(search(nodes,edges,'A','I',algorithms[0]).at(-1).path,['A','I']);
 for(const a of algorithms.slice(1))assert.equal(search(nodes,edges,'A','I',a).at(-1).distance.I,9);
});
test('zero-length route, unreachable goal, and independent snapshots',()=>{
 for(const a of algorithms){
 assert.deepEqual(search(nodes,defaultEdges(),'A','A',a).at(-1).path,['A']);
 const frames=search(nodes,[],'A','I',a);assert.deepEqual(frames.at(-1).path,[]);assert.equal(frames.at(-1).done,true);
 const complete=search(nodes,defaultEdges(),'A','I',a);assert.equal(complete[0].distance.I,Infinity);assert.equal(complete[0].parent.I,undefined);assert.deepEqual(complete[0].open,['A']);
 }
});
test('all algorithms agree with independent all-pairs shortest paths on edited graphs',()=>{
 let seed=82471;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let run=0;run<120;run++){
  const edges=[];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(random()<.27)edges.push({a:nodes[i].id,b:nodes[j].id,w:1+Math.floor(random()*99)});
  for(const algorithm of algorithms){
   const matrix=nodes.map((_,i)=>nodes.map((_,j)=>i===j?0:Infinity));for(const e of edges){const i=nodes.findIndex(n=>n.id===e.a),j=nodes.findIndex(n=>n.id===e.b);matrix[i][j]=matrix[j][i]=algorithm===algorithms[0]?1:e.w;}
   for(let k=0;k<nodes.length;k++)for(let i=0;i<nodes.length;i++)for(let j=0;j<nodes.length;j++)matrix[i][j]=Math.min(matrix[i][j],matrix[i][k]+matrix[k][j]);
   const start=Math.floor(random()*nodes.length),goal=Math.floor(random()*nodes.length),final=search(nodes,edges,nodes[start].id,nodes[goal].id,algorithm).at(-1);
   assert.equal(final.distance[nodes[goal].id],matrix[start][goal]);
   if(Number.isFinite(matrix[start][goal])){assert.equal(final.path[0],nodes[start].id);assert.equal(final.path.at(-1),nodes[goal].id);}else assert.deepEqual(final.path,[]);
  }
 }
});

const additions=['depth-first-search','bidirectional-bfs','greedy-best-first-search'];
test('new searches handle identical endpoints, disconnections, immutable frames, and code lines',()=>{
 for(const algorithm of additions){
  assert.deepEqual(search(nodes,defaultEdges(),'A','A',algorithm).at(-1).path,['A']);
  assert.deepEqual(search(nodes,[],'A','I',algorithm).at(-1).path,[]);
  const frames=search(nodes,defaultEdges(),'A','I',algorithm);
  assert.equal(frames.at(-1).done,true);assert.equal(frames[0].distance.I,Infinity);assert.equal(frames[0].parent.I,undefined);
  for(const frame of frames){assert.ok(frame.line>=0&&frame.line<programs[algorithm].length);assert.equal(new Set(frame.closed).size,frame.closed.length);}
  if(algorithm==='bidirectional-bfs'){assert.deepEqual(frames[0].openForward,['A']);assert.deepEqual(frames[0].openReverse,['I']);assert.equal(frames[0].distanceReverse.A,Infinity);assert.equal(frames.at(-1).meeting,'D');}
 }
});
test('DFS backtracks and its active stack is a predecessor chain',()=>{
 const frames=search(nodes,defaultEdges(),'A','I','depth-first-search');
 assert.ok(frames.some(f=>f.line===5&&f.message.includes('Pop C')));
 assert.deepEqual(frames.at(-1).path,['A','B','D','F','E','H','I']);
 for(const frame of frames){for(let i=0;i<frame.open.length-1;i++)assert.equal(frame.parent[frame.open[i]],frame.open[i+1]);}
});
test('greedy estimate ignores an expensive direct route; bidirectional BFS minimizes edges',()=>{
 const edges=[...defaultEdges(),{a:'A',b:'I',w:99}];
 assert.deepEqual(search(nodes,edges,'A','I','greedy-best-first-search').at(-1).path,['A','I']);
 assert.deepEqual(search(nodes,edges,'A','I','bidirectional-bfs').at(-1).path,['A','I']);
 assert.equal(search(nodes,edges,'A','I','astar').at(-1).distance.I,9);
});
test('new searches produce valid paths; two-way BFS matches an independent reference',()=>{
 let seed=32815;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let run=0;run<180;run++){
  const positions=run%2?nodes.map((n,i)=>({...n,x:(i%3)*120,y:Math.floor(i/3)*200})):nodes;
  const edges=[];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(random()<.28)edges.push({a:nodes[i].id,b:nodes[j].id,w:1+Math.floor(random()*99)});
  const matrix=nodes.map((_,i)=>nodes.map((_,j)=>i===j?0:Infinity));for(const e of edges){const i=nodes.findIndex(n=>n.id===e.a),j=nodes.findIndex(n=>n.id===e.b);matrix[i][j]=matrix[j][i]=1;}
  for(let k=0;k<nodes.length;k++)for(let i=0;i<nodes.length;i++)for(let j=0;j<nodes.length;j++)matrix[i][j]=Math.min(matrix[i][j],matrix[i][k]+matrix[k][j]);
  // Test every endpoint pair on each random graph, including swaps and same-node routes.
  for(let start=0;start<nodes.length;start++)for(let goal=0;goal<nodes.length;goal++)for(const algorithm of additions){
   const final=search(positions,edges,nodes[start].id,nodes[goal].id,algorithm).at(-1);
   if(!Number.isFinite(matrix[start][goal])){assert.deepEqual(final.path,[]);continue;}
   assert.equal(final.path[0],nodes[start].id);assert.equal(final.path.at(-1),nodes[goal].id);assert.equal(new Set(final.path).size,final.path.length);
   for(let i=1;i<final.path.length;i++)assert.ok(edges.some(e=>(e.a===final.path[i-1]&&e.b===final.path[i])||(e.b===final.path[i-1]&&e.a===final.path[i])));
   if(algorithm==='bidirectional-bfs')assert.equal(final.path.length-1,matrix[start][goal]);
  }
 }
});
