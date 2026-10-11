import test from 'node:test';
import assert from 'node:assert/strict';
import {traceAlgorithm,defaultInput,discoveryCode,validateInput} from '../public/scripts/discovery-engine.mjs';
const finish=(slug,input)=>traceAlgorithm(slug,input).at(-1).result;
const gcd=(a,b)=>{for(let d=Math.max(a,b);d>=1;d--)if(a%d===0&&b%d===0)return d;return 0;};
let seed=37;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
test('array searches agree with independent lookups, including duplicate and absent values',()=>{
 for(let run=0;run<250;run++){const a=Array.from({length:1+Math.floor(rand()*24)},()=>Math.floor(rand()*15)-7);for(let target=-8;target<=8;target++){assert.equal(finish('linear-search',{array:a.join(','),target}).index,a.indexOf(target));const sorted=[...a].sort((x,y)=>x-y),r=finish('binary-search',{array:sorted.join(','),target}).index;if(sorted.includes(target))assert.equal(sorted[r],target);else assert.equal(r,-1);}}
 assert.throws(()=>validateInput('binary-search',{array:'3,1,2',target:'1'}),/ascending/);
});
test('naive matching and KMP find all code-point matches, overlaps, and prefix borders',()=>{
 const words=n=>Array.from({length:2**n},(_,bits)=>Array.from({length:n},(_,i)=>bits&(1<<i)?'A':'B').join(''));
 const cases=[['','A'],['🌊✨🌊✨🌊','🌊✨'],['e\u0301e\u0301','e\u0301'],['a\nb\na','\na']];
 for(let n=0;n<=7;n++)for(const text of words(n))for(let m=1;m<=3;m++)for(const pattern of words(m))cases.push([text,pattern]);
 for(const [text,pattern]of cases){const t=Array.from(text),p=Array.from(pattern),expected=[];for(let i=0;i<=t.length-p.length;i++)if(p.every((c,j)=>c===t[i+j]))expected.push(i);
  assert.deepEqual(finish('naive-string-search',{text,pattern}).matches,expected);
  const frames=traceAlgorithm('kmp-search',{text,pattern}),r=frames.at(-1).result;assert.deepEqual(r.matches,expected);
  const borders=p.map((_,i)=>{for(let length=i;length>0;length--)if(p.slice(0,length).every((c,j)=>c===p[i-length+1+j]))return length;return 0;});assert.deepEqual(r.prefix,borders);assert.ok(frames.at(-1).counts['Text comparisons']<=2*t.length);assert.ok(frames.at(-1).counts['Prefix comparisons']<=2*p.length);
 }
});
test('Euclid agrees with divisor enumeration and extended coefficients satisfy every identity',()=>{
 for(let a=0;a<=50;a++)for(let b=0;b<=50;b++){const expected=gcd(a,b);assert.equal(finish('euclidean-gcd',{a,b}).gcd,expected);const frames=traceAlgorithm('extended-euclid',{a,b}),r=frames.at(-1).result;assert.equal(r.gcd,expected);assert.equal(a*r.x+b*r.y,expected);for(const f of frames)for(const [remainder,x,y]of f.history)assert.equal(a*x+b*y,remainder);}
 assert.deepEqual(finish('extended-euclid',{a:252,b:105}),{gcd:21,x:-2,y:5});
});
test('sieve agrees with trial division for every supported limit',()=>{
 for(let limit=2;limit<=100;limit++){const expected=[];for(let n=2;n<=limit;n++){let prime=true;for(let d=2;d*d<=n;d++)if(n%d===0)prime=false;if(prime)expected.push(n);}assert.deepEqual(finish('sieve-of-eratosthenes',{limit}).primes,expected);}
});
test('binary exponentiation is exact across every supported input, including exponent zero',()=>{
 for(let base=1;base<=20;base++)for(let exponent=0;exponent<=20;exponent++){const frames=traceAlgorithm('binary-exponentiation',{base,exponent});assert.equal(frames.at(-1).result.value,String(BigInt(base)**BigInt(exponent)));assert.ok(frames.at(-1).counts.Multiplications<=2*Math.ceil(Math.log2(exponent+1)));for(const frame of frames){const invariant=frame.rows.find(([key])=>key==='Invariant')[1];const match=invariant.match(/^(\d+) × (\d+)\^(?:\(2 × (\d+)\)|(\d+)) =/);assert.ok(match);assert.equal(BigInt(match[1])*BigInt(match[2])**BigInt(match[3]?2*Number(match[3]):match[4]),BigInt(base)**BigInt(exponent));}}
});
test('Fibonacci base cases and every computed term satisfy the recurrence',()=>{
 let previous=0,current=1;for(let n=0;n<=30;n++){const r=finish('fibonacci-tabulation',{n});assert.equal(r.value,previous);for(let i=2;i<r.table.length;i++)assert.equal(r.table[i],r.table[i-1]+r.table[i-2]);[previous,current]=[current,previous+current];}
});
test('0/1 knapsack matches exhaustive subsets and returns a feasible optimal selection',()=>{
 for(let run=0;run<300;run++){const n=1+Math.floor(rand()*6),weights=Array.from({length:n},()=>1+Math.floor(rand()*12)),values=Array.from({length:n},()=>Math.floor(rand()*20)),capacity=Math.floor(rand()*17);let best=0;for(let mask=0;mask<2**n;mask++){let w=0,v=0;for(let i=0;i<n;i++)if(mask&(1<<i)){w+=weights[i];v+=values[i];}if(w<=capacity)best=Math.max(best,v);}const r=finish('zero-one-knapsack',{weights:weights.join(','),values:values.join(','),capacity});assert.equal(r.value,best);assert.ok(r.weight<=capacity);assert.equal(new Set(r.chosen).size,r.chosen.length);assert.equal(r.chosen.reduce((sum,i)=>sum+values[i-1],0),best);}
 assert.deepEqual(finish('zero-one-knapsack',defaultInput('zero-one-knapsack')),{value:9,chosen:[1,2],weight:5});
});
test('all ten traces preserve snapshots, use valid code lines, and reject malformed inputs',()=>{
 for(const slug of Object.keys(discoveryCode)){const raw=defaultInput(slug),saved={...raw},frames=traceAlgorithm(slug,raw);assert.deepEqual(raw,saved);assert.ok(frames.at(-1).result);let previous={};for(const f of frames){assert.ok(f.line>=0&&f.line<discoveryCode[slug].length);for(const [key,value]of Object.entries(f.counts)){assert.ok(value>=(previous[key]??0));previous[key]=value;}}const first=structuredClone(frames[0]);frames.at(-1).boards[0].cells[0].value='changed';assert.deepEqual(frames[0],first);}
 for(const [slug,input]of [['linear-search',{array:'',target:1}],['kmp-search',{text:'hello',pattern:''}],['euclidean-gcd',{a:-1,b:2}],['sieve-of-eratosthenes',{limit:101}],['binary-exponentiation',{base:2,exponent:21}],['fibonacci-tabulation',{n:31}],['zero-one-knapsack',{weights:'2,3',values:'5',capacity:5}]])assert.throws(()=>traceAlgorithm(slug,input));
});
