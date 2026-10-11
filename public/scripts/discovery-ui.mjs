import {traceAlgorithm,defaultInput,discoveryCode} from './discovery-engine.mjs';
const root=document.querySelector('.discovery-workspace');
if(root){
 const $=id=>root.querySelector('#trace-'+id);let slug=$('algorithm').value,raw=defaultInput(slug),frames=[],index=0,timer=null;
 const schemas={
  'array-search':[['array','Array · 1–24 integers from −99 to 99'],['target','Target · −99 to 99']],
  'string-matching':[['text','Text · at most 48 Unicode code points'],['pattern','Pattern · 1–16 code points']],
  'euclidean-gcd':[['a','First integer · 0–9999'],['b','Second integer · 0–9999']],
  'sieve-of-eratosthenes':[['limit','Upper limit · 2–100']],
  'binary-exponentiation':[['base','Base · 1–20'],['exponent','Exponent · 0–20']],
  'fibonacci-tabulation':[['n','Requested index n · 0–30']],
  'zero-one-knapsack':[['weights','Weights · 1–6 items, each 1–12'],['values','Values · one per item, each 0–99'],['capacity','Capacity · 0–16']]
 };
 const kind=s=>['linear-search','binary-search'].includes(s)?'array-search':['naive-string-search','kmp-search'].includes(s)?'string-matching':s==='extended-euclid'?'euclidean-gcd':s;
 const presets={
  'array-search':[['Last item',{array:'2, 5, 8, 12, 16, 23, 38, 56, 72',target:'72'}],['Not present',{array:'2, 5, 8, 12, 16, 23, 38, 56, 72',target:'39'}],['Repeated values',{array:'1, 2, 2, 2, 3, 4, 5',target:'2'}]],
  'string-matching':[['Repeated prefix',{text:'AAAAAAAAAAAAAB',pattern:'AAAAB'}],['Overlapping',{text:'AAAAA',pattern:'AAA'}],['No match',{text:'ROUGH AT SEA',pattern:'LAND'}],['Unicode',{text:'🌊✨🌊✨🌊',pattern:'🌊✨'}]],
  'euclidean-gcd':[['Long remainder chain',{a:'233',b:'144'}],['Coprime',{a:'35',b:'12'}],['One zero',{a:'252',b:'0'}],['Both zero',{a:'0',b:'0'}]],
  'sieve-of-eratosthenes':[['Through 30',{limit:'30'}],['Through 100',{limit:'100'}],['Smallest limit',{limit:'2'}]],
  'binary-exponentiation':[['Power of two',{base:'2',exponent:'16'}],['Zero exponent',{base:'7',exponent:'0'}],['Beyond Number precision',{base:'20',exponent:'20'}]],
  'fibonacci-tabulation':[['Base case zero',{n:'0'}],['Base case one',{n:'1'}],['Thirty terms',{n:'30'}]],
  'zero-one-knapsack':[['Default example',{weights:'2, 3, 4',values:'4, 5, 7',capacity:'5'}],['Tied choices',{weights:'2, 2, 3',values:'4, 4, 5',capacity:'2'}],['Nothing fits',{weights:'2, 3, 4',values:'4, 5, 7',capacity:'1'}],['Six items',{weights:'1, 2, 3, 4, 5, 6',values:'2, 5, 7, 8, 11, 13',capacity:'12'}]]
 };
 const text=(tag,value,className='')=>{const el=document.createElement(tag);el.textContent=value;el.className=className;return el;};
 const stop=()=>{clearInterval(timer);timer=null;$('play').textContent='Play';};
 function fields(){ $('fields').replaceChildren();for(const [key,label]of schemas[kind(slug)]){const wrapper=text('label',label),input=document.createElement('input');input.name=key;input.value=raw[key];input.autocomplete='off';wrapper.append(input);$('fields').append(wrapper);}
  $('preset').replaceChildren();const blank=text('option','Choose an example');blank.value='';$('preset').append(blank);presets[kind(slug)].forEach(([label],i)=>{const opt=text('option',label);opt.value=i;$('preset').append(opt);});
 }
 function readFields(){return Object.fromEntries([...$('fields').querySelectorAll('input')].map(el=>[el.name,el.value]));}
 const table=(headers,records)=>{const wrapper=document.createElement('div');wrapper.className='trace-table-scroll';const t=document.createElement('table'),thead=document.createElement('thead'),tr=document.createElement('tr');headers.forEach(h=>tr.append(text('th',h)));thead.append(tr);const body=document.createElement('tbody');records.forEach(row=>{const tr=document.createElement('tr');row.forEach(x=>tr.append(text('td',String(x))));body.append(tr);});t.append(thead,body);wrapper.append(t);return wrapper;};
 function render(){const f=frames[index];$('board').replaceChildren();for(const b of f.boards){const section=document.createElement('section');section.append(text('h3',b.label));const wrap=document.createElement('div');wrap.className='trace-board-scroll';const cells=document.createElement('div');cells.className='trace-cells'+(b.align?' aligned':'');if(kind(slug)==='string-matching')cells.classList.add('string-row');b.cells.forEach(c=>{const el=text('div',c.value,'trace-cell '+c.status);el.append(text('small',c.note));cells.append(el);});wrap.append(cells);section.append(wrap);$('board').append(section);}
  if(f.boards.some(b=>b.align)){const stack=document.createElement('div');stack.className='trace-string-stack';[...$('board').children].slice(0,2).forEach(section=>stack.append(section));$('board').prepend(stack);}
  if(f.matrix){const m=f.matrix,section=document.createElement('section');section.append(text('h3',m.label));const wrap=document.createElement('div');wrap.className='trace-table-scroll';const t=document.createElement('table');t.className='trace-matrix';const head=document.createElement('thead'),hr=document.createElement('tr');hr.append(text('th','i / c'));m.values[0].forEach((_,c)=>hr.append(text('th',c)));head.append(hr);const body=document.createElement('tbody');m.values.forEach((row,r)=>{const tr=document.createElement('tr');tr.append(text('th',r));row.forEach((v,c)=>{const td=text('td',v===null?'·':v);const includes=list=>list.some(([x,y])=>x===r&&y===c);td.className=includes(m.active)?'active':includes(m.dependencies)?'amber':includes(m.path)?'good':'';tr.append(td);});body.append(tr);});t.append(head,body);wrap.append(t);section.append(wrap);$('board').append(section);}
  $('state').replaceChildren(table(['Variable','Current value'],f.rows));$('counts').replaceChildren();Object.entries(f.counts).forEach(([label,value])=>{const group=document.createElement('div');group.append(text('dt',label),text('dd',value));$('counts').append(group);});
  const headers=slug==='euclidean-gcd'?['a','b','Quotient q','Remainder r']:slug==='extended-euclid'?['Remainder r','Coefficient x','Coefficient y']:['Round','Operation','Accumulator','Base','Exponent'];$('history').replaceChildren();$('history-panel').hidden=!f.history.length;if(f.history.length)$('history').append(table(headers,f.history));
  $('explanation').textContent=f.message;$('progress').textContent=`Step ${index+1} / ${frames.length}`;$('timeline').value=index;$('back').disabled=index===0;$('step').disabled=index===frames.length-1;$('play').disabled=index===frames.length-1;
  $('code').replaceChildren();discoveryCode[slug].forEach((line,i)=>{const el=text('span',`${i+1}  ${line}\n`,i===f.line?'active':'');$('code').append(el);});
 }
 function rebuild(candidate=raw){try{const next=traceAlgorithm(slug,candidate);stop();raw={...candidate};frames=next;index=0;$('timeline').max=frames.length-1;$('validation').textContent='';render();return true;}catch(e){$('validation').textContent=e.message;return false;}}
 $('form').addEventListener('submit',e=>{e.preventDefault();rebuild(readFields());});$('preset').addEventListener('change',()=>{if($('preset').value==='')return;raw={...presets[kind(slug)][Number($('preset').value)][1]};const chosen=$('preset').value;fields();$('preset').value=chosen;rebuild();});
 $('algorithm').addEventListener('change',()=>{const next=$('algorithm').value,previous=slug;const candidate=kind(next)===kind(previous)?readFields():defaultInput(next);slug=next;if(!rebuild(candidate)){slug=previous;$('algorithm').value=previous;return;}fields();});
 const advance=()=>{if(index<frames.length-1)index++;render();if(index===frames.length-1)stop();};const play=()=>{timer=setInterval(advance,Number($('speed').value));$('play').textContent='Pause';};
 $('play').addEventListener('click',()=>timer?stop():play());$('back').addEventListener('click',()=>{stop();index=Math.max(0,index-1);render();});$('step').addEventListener('click',()=>{stop();advance();});$('reset').addEventListener('click',()=>rebuild());$('timeline').addEventListener('input',()=>{stop();index=Number($('timeline').value);render();});$('speed').addEventListener('change',()=>{if(timer){stop();play();}});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);fields();rebuild();
}
