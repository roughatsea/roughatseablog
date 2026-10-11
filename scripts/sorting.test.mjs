import test from 'node:test';
import assert from 'node:assert/strict';
import {sortFrames,sortingCode} from '../public/scripts/sorting-engine.mjs';
const slugs=Object.keys(sortingCode);
test('all five sorts match numerical ordering across exhaustive small inputs and randomized arrays',()=>{
 let seed=17;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};const inputs=[[],[1],[9,8,7,6,5,4,3,2,1],[1,2,3,4,5,6,7,8,9]];
 for(let n=0;n<=6;n++)for(let code=0;code<3**n;code++){let k=code;inputs.push(Array.from({length:n},()=>{const v=k%3+1;k=Math.floor(k/3);return v;}));}
 for(let i=0;i<150;i++)inputs.push(Array.from({length:24},()=>1+Math.floor(rand()*99)));
 for(const input of inputs)for(const slug of slugs){const original=[...input],frames=sortFrames(input,slug),last=frames.at(-1);assert.deepEqual(input,original);assert.deepEqual(last.items.map(x=>x.value),[...input].sort((a,b)=>a-b),slug);assert.deepEqual(last.items.map(x=>x.id).sort((a,b)=>a-b),input.map((_,i)=>i));assert.equal(last.settled.length,input.length);let previous={comparisons:0,writes:0,swaps:0};for(const f of frames){assert.ok(f.line>=0&&f.line<sortingCode[slug].length);for(const c of ['comparisons','writes','swaps'])assert.ok(f[c]>=previous[c]);previous=f;}
 if(['bubble-sort','insertion-sort','merge-sort'].includes(slug))for(let i=1;i<last.items.length;i++)if(last.items[i-1].value===last.items[i].value)assert.ok(last.items[i-1].id<last.items[i].id,slug);
 }
});
test('counters reveal early exit, fixed selection scans and poor quicksort partitions',()=>{
 const a=[1,2,3,4,5,6,7,8,9];assert.equal(sortFrames(a,'bubble-sort').at(-1).comparisons,8);assert.equal(sortFrames(a,'insertion-sort').at(-1).comparisons,8);assert.equal(sortFrames(a,'selection-sort').at(-1).comparisons,36);assert.equal(sortFrames(a,'quick-sort').at(-1).comparisons,36);assert.equal(sortFrames(a,'quick-sort').at(-1).swaps,0);
 const unstable=sortFrames([2,2,1],'selection-sort').at(-1).items;assert.deepEqual(unstable.map(x=>x.id),[2,1,0]);
 const f=sortFrames([3,1,2],'merge-sort');assert.ok(f.some(x=>x.buffer.length));assert.ok(f.some(x=>x.buffer.some(y=>y.used)));f.at(-1).items[0].value=99;assert.equal(f[0].items[0].value,3);
});
test('reject invalid or excessive input',()=>{for(const input of [[0],[100],[1.5],Array(33).fill(1)])assert.throws(()=>sortFrames(input,'bubble-sort'));assert.throws(()=>sortFrames([1],'invalid'));});
