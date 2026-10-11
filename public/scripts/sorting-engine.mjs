export const sortingCode = {
 'bubble-sort':['for end from n−1 down to 1:','  swapped = false','  for j from 0 to end−1:','    if a[j] > a[j+1]:','      swap(a[j], a[j+1]); swapped = true','  settle(end)','  if not swapped: break','finish'],
 'selection-sort':['for i from 0 to n−2:','  minimum = i','  for j from i+1 to n−1:','    if a[j] < a[minimum]:','      minimum = j','  swap if minimum != i','  settle(i)','finish'],
 'insertion-sort':['for i from 1 to n−1:','  j = i','  while j > 0:','    if a[j−1] <= a[j]: break','    swap(a[j−1], a[j])','    j = j−1','  prefix through i is sorted','finish'],
 'merge-sort':['sort(lo, hi):','  if lo >= hi: return','  mid = floor((lo + hi) / 2)','  sort(lo, mid); sort(mid+1, hi)','  buffer = copy(a[lo..hi])','  while both halves have items:','    choose smaller front (left on a tie)','    write chosen item into a[k]; k++','  write remaining items','finish'],
 'quick-sort':['sort(lo, hi):','  if lo >= hi: return','  pivot = a[hi]; boundary = lo','  for j from lo to hi−1:','    if a[j] <= pivot:','      swap(a[j], a[boundary]); boundary++','  swap(a[boundary], a[hi])','  settle(boundary)','  sort(lo, boundary−1); sort(boundary+1, hi)','finish']
};
export function sortFrames(values, algorithm) {
 if (!sortingCode[algorithm]) throw new Error('Unknown sorting algorithm');
 if (!Array.isArray(values) || values.length>32 || values.some(v=>!Number.isInteger(v)||v<1||v>99)) throw new Error('Use up to 32 integers from 1 to 99');
 const a=values.map((value,id)=>({value,id})), frames=[], settled=new Set();
 let comparisons=0,writes=0,swaps=0;
 const emit=(line,message,active=[],range=[],pivot=null,buffer=[],depth=0)=>frames.push({items:a.map(x=>({...x})),line,message,active:[...active],range:[...range],pivot,buffer:buffer.map(x=>({...x})),settled:[...settled],comparisons,writes,swaps,depth});
 const swap=(i,j)=>{if(i!==j){[a[i],a[j]]=[a[j],a[i]];swaps++;writes+=2;}};
 emit(0,'Start with the input array. Compare values; identity labels track original positions.');
 if(algorithm==='bubble-sort'){
  for(let end=a.length-1;end>0;end--){let changed=false;emit(1,`Begin a pass through index ${end}.`,[],[0,end]);
   for(let j=0;j<end;j++){comparisons++;emit(3,`Compare ${a[j].value} with ${a[j+1].value}.`,[j,j+1],[0,end]);if(a[j].value>a[j+1].value){swap(j,j+1);changed=true;emit(4,'Swap these out-of-order neighbors.',[j,j+1],[0,end]);}}
   settled.add(end);emit(5,`Index ${end} is now in its final position.`);if(!changed){emit(6,'No swaps in this pass: the array is sorted.');break;}
  }
 }else if(algorithm==='selection-sort'){
  for(let i=0;i<a.length-1;i++){let min=i;emit(1,`Start the minimum at index ${i}.`,[i],[i,a.length-1]);for(let j=i+1;j<a.length;j++){comparisons++;emit(3,`Compare index ${j} with the current minimum at ${min}.`,[j,min],[i,a.length-1]);if(a[j].value<a[min].value){min=j;emit(4,`The new minimum is at index ${min}.`,[min],[i,a.length-1]);}}
   swap(i,min);emit(5,min===i?'The minimum is already in place.':'Swap the minimum into the next settled slot.',[i,min]);settled.add(i);emit(6,`Index ${i} is final.`);
  }
 }else if(algorithm==='insertion-sort'){
  for(let i=1;i<a.length;i++){let j=i;emit(1,`Insert the item at index ${i} into the sorted prefix.`,[i],[0,i]);while(j>0){comparisons++;emit(3,`Compare positions ${j-1} and ${j}.`,[j-1,j],[0,i]);if(a[j-1].value<=a[j].value)break;swap(j-1,j);emit(4,'Move the item one position left.',[j-1,j],[0,i]);j--;emit(5,`Continue at index ${j}.`,[j],[0,i]);}emit(6,`The prefix through index ${i} is sorted, but may still move later.`,[],[0,i]);}
 }else if(algorithm==='merge-sort'){
  const visit=(lo,hi,depth)=>{emit(0,`Sort range ${lo}…${hi}.`,[],[lo,hi],null,[],depth);if(lo>=hi){emit(1,'A range of at most one item is already sorted.',[],[lo,hi],null,[],depth);return;}
   const mid=Math.floor((lo+hi)/2);emit(2,`Split after index ${mid}.`,[],[lo,hi],null,[],depth);visit(lo,mid,depth+1);visit(mid+1,hi,depth+1);
   const left=a.slice(lo,mid+1),right=a.slice(mid+1,hi+1);let i=0,j=0,k=lo;
   const buffer=()=>[...left.map((x,t)=>({...x,side:'L',used:t<i})),...right.map((x,t)=>({...x,side:'R',used:t<j}))];
   emit(4,'Copy the sorted halves into a temporary buffer.',[],[lo,hi],null,buffer(),depth);
   while(i<left.length||j<right.length){let item,line=8;if(i<left.length&&j<right.length){comparisons++;emit(6,`Compare ${left[i].value} (left) with ${right[j].value} (right).`,[],[lo,hi],null,buffer(),depth);item=left[i].value<=right[j].value?left[i++]:right[j++];line=7;}else item=i<left.length?left[i++]:right[j++];a[k]={...item};writes++;emit(line,`Write ${item.value} to index ${k}.`,[k],[lo,hi],null,buffer(),depth);k++;}
  };if(a.length)visit(0,a.length-1,1);
 }else{
  const visit=(lo,hi,depth)=>{emit(0,`Sort range ${lo}…${hi}.`,[],[lo,hi],null,[],depth);if(lo>=hi){if(lo===hi)settled.add(lo);emit(1,'A range of at most one item needs no partition.',[],[lo,hi],null,[],depth);return;}
   const pivot=a[hi].value;let boundary=lo;emit(2,`Use ${pivot} at index ${hi} as pivot.`,[hi],[lo,hi],hi,[],depth);
   for(let j=lo;j<hi;j++){comparisons++;emit(4,`Compare ${a[j].value} with pivot ${pivot}.`,[j,boundary],[lo,hi],hi,[],depth);if(a[j].value<=pivot){swap(j,boundary);emit(5,'Extend the region whose values are at most the pivot.',[j,boundary],[lo,hi],hi,[],depth);boundary++;}}
   swap(boundary,hi);emit(6,`Place the pivot at index ${boundary}.`,[boundary,hi],[lo,hi],boundary,[],depth);settled.add(boundary);emit(7,'The pivot is in its final position.',[boundary],[lo,hi],boundary,[],depth);emit(8,'Recursively sort the ranges on each side.',[],[lo,hi],boundary,[],depth);visit(lo,boundary-1,depth+1);visit(boundary+1,hi,depth+1);
  };if(a.length)visit(0,a.length-1,1);
 }
 a.forEach((_,i)=>settled.add(i));emit(sortingCode[algorithm].length-1,'Sorted in ascending order. Equal-value identity labels reveal whether this run preserved their order.');return frames;
}
