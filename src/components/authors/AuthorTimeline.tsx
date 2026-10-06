import { useState } from 'react';
import { authors } from './data';
import './timeline.css';
export default function AuthorTimeline() {
  const [query,setQuery] = useState('');
  const [left,setLeft] = useState('steinbeck');
  const [right,setRight] = useState('heinlein');
  const [focused,setFocused] = useState(false);
  const [detail,setDetail] = useState('steinbeck');
  const a = authors.find(x=>x.id===left)!;
  const b = authors.find(x=>x.id===right)!;
  const selected = authors.find(x=>x.id===detail)!;
  const visible = authors.filter(x=>(!focused || x.id===left || x.id===right) && `${x.name} ${x.works.map(w=>w[1]).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const domain = focused ? [Math.min(a.born,b.born)-5,Math.max(a.died,b.died)+5] : [1770,2025];
  const position = (year:number)=>100*(year-domain[0])/(domain[1]-domain[0]);
  const step = focused ? 10 : 25;
  const ticks = Array.from({length:Math.ceil((domain[1]-domain[0])/step)},(_,i)=>Math.ceil(domain[0]/step)*step+i*step).filter(y=>y<=domain[1]);
  const overlap = Math.min(a.died,b.died)-Math.max(a.born,b.born);
  return <div className="authors-app">
    <div className="author-controls">
      <label>Compare <select value={left} onChange={e=>setLeft(e.target.value)}>{authors.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label>With <select value={right} onChange={e=>setRight(e.target.value)}>{authors.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label className="focus-control"><input type="checkbox" checked={focused} onChange={e=>setFocused(e.target.checked)}/> Focus on this pair</label>
    </div>
    <section className="comparison" aria-label="Chronological comparison" aria-live="polite">
      {a.id===b.id ? <p>Choose two different authors to compare their dates.</p> : <>
        <p><strong>{a.start===b.start ? 'Both publishing spans start in the same year.' : `${a.start<b.start?a.name:b.name}’s publishing span begins ${Math.abs(a.start-b.start)} years earlier.`}</strong> {a.name}: {a.start}–{a.end}. {b.name}: {b.start}–{b.end}. {overlap>0 ? `Their lifetimes overlap by approximately ${overlap} years.` : 'Their lifetimes do not overlap.'}</p>
        <p className="subtle">Earlier works can influence later writers even without overlapping lifetimes. Dates establish an opportunity to read a work, not evidence that someone read it.</p>
        {new Set([left,right]).has('steinbeck') && new Set([left,right]).has('heinlein') && <p><em>East of Eden</em> (1952) appeared 13 years after Heinlein’s debut story. Steinbeck’s earlier books preceded that debut; his 1952 novel could have influenced Heinlein’s later work, but could not have influenced his already-published work. No influence claim is made here.</p>}
      </>}
    </section>
    <div className="timeline-tools"><label>Find an author or book <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Twain or Kindred"/></label><div className="legend"><span><i className="life-key"/> Lifespan</span><span><i className="publishing-key"/> Publishing span</span><span>◆ Selected work</span></div></div>
    <p className="subtle">Select an author for book dates and sources. On a narrow screen, scroll the timeline sideways.</p>
    <div className="timeline-scroll" tabIndex={0} role="region" aria-label="Author timelines; scroll horizontally on small screens">
      <div className="timeline-grid">
        <div className="axis"><span>Author / life dates</span><div className="axis-track">{ticks.map(y=><span key={y} style={{left:`${position(y)}%`}}>{y}</span>)}</div></div>
        {visible.map(x=><div className={`author-row ${x.id===left||x.id===right?'compared':''}`} key={x.id}>
          <button className="author-name" onClick={()=>setDetail(x.id)} aria-pressed={detail===x.id}><strong>{x.name}</strong><span>{x.born}–{x.died}</span></button>
          <div className="track" aria-label={`${x.name}: lived ${x.born} to ${x.died}; publishing span ${x.start} to ${x.end}`}>
            {ticks.map(y=><i className="gridline" key={y} style={{left:`${position(y)}%`}}/>)}
            <div className="life-bar" style={{left:`${position(x.born)}%`,width:`${position(x.died)-position(x.born)}%`}}/>
            <div className="publishing-bar" title={`${x.start}–${x.end}: ${x.note}`} style={{left:`${position(x.start)}%`,width:`${position(x.end)-position(x.start)}%`}}/>
            {x.works.map(([year,title],i)=><button key={title} className="book-marker" style={{left:`${position(year)}%`,top:i%2?'38px':'5px'}} title={`${title} (${year})`} aria-label={`${x.name}, ${title}, ${year}; show book list`} onClick={()=>setDetail(x.id)}>◆</button>)}
          </div>
        </div>)}
      </div>
    </div>
    {!visible.length && <p role="status">No matches. Clear the search{focused?' or turn off pair focus':''} to see more authors.</p>}
    <section className="author-detail" aria-label="Selected author details" aria-live="polite">
      <div><h2>{selected.name}</h2><p>Lived {selected.born}–{selected.died} · Publishing span {selected.start}–{selected.end}</p><p className="subtle">{selected.note}</p><a href={selected.source}>Biography / bibliography source</a></div>
      <ol className="work-list">{selected.works.map(([year,title])=><li key={title}><time>{year}</time><span>{title}</span></li>)}</ol>
    </section>
    <details className="method"><summary>What “active years” means here</summary><p>There is no universal start or end date for a writing career. These bars use a documented publishing span as a practical proxy, with the scope explained for each author. Most show novel publication; some include other books or professional fiction. They do not imply uninterrupted work, the beginning of composition, or the end of all literary activity.</p><p>Markers show selected works, not complete bibliographies. Years use first publication, including first serialization where noted. A book may have been written years before publication. Translation dates, private manuscript access, letters, reading records and explicit acknowledgments can all change an influence investigation. Posthumous works are excluded from activity bars. This is a growing selection, not a ranking or a complete world literary history. Titles may be shown in English even when the date refers to an original-language edition; check each author’s note before comparing translation availability.</p></details>
  </div>;
}
