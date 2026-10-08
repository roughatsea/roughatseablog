import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodes,defaultEdges,search} from '../public/scripts/algorithms-engine.mjs';
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
