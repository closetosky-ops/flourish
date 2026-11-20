/* Flourish v9: thick, fluid, scrolling honey lip. A static shape remains if JS motion is reduced. */
(() => {
'use strict';
const svg=document.getElementById('honey-svg');if(!svg)return;
const hero=document.querySelector('.hero'),body=document.getElementById('honey-body'),edge=document.getElementById('honey-highlight'),rim=document.getElementById('honey-rim'),shine=document.getElementById('honey-drop-shine'),spark=document.getElementById('honey-sparkle');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');let width=1440,progress=0,target=0,clock=0,last=0,raf=0,visible=true,lastScroll=window.scrollY,activity=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function compute(t,stretch,energy){
 const w=width,small=w<650;const base=41;
 const wob=(x)=>Math.sin(x*.008+t*.52)*7.5+Math.cos(x*.023-t*.37)*3.3+(energy*.8)*Math.sin(x*.018+t*2);
 const yAt=x=>base+wob(x);
 const list=small?[
  {ratio:.13,w:22,len:46},{ratio:.50,w:27,len:126},{ratio:.76,w:27,len:85}
 ]:[
  {ratio:.19,w:28,len:40},{ratio:.446,w:39,len:126},{ratio:.615,w:38,len:57},{ratio:.785,w:34,len:95}
 ];
 let d=`M0 0 L0 ${yAt(0).toFixed(1)}`;let outline=`M0 ${(yAt(0)-5).toFixed(1)}`;let shines=[];let x0=0;
 for(let i=0;i<list.length;i++){
  const item=list[i],cx=w*item.ratio+Math.sin(t*.66+i*1.9)*1.4+energy*Math.sin(t*2+i)*2;
  const r=item.w*(small?0.88:1);const l=cx-r*1.65,rr=cx+r*1.65;const by=yAt(cx);
  const length=item.len+stretch*(i===1?22:12)+Math.sin(t*.86+i*2.1)*(2.3+energy*2);
  const tip=by+length;
  d+=` C${(x0+l)*.5} ${yAt((x0+l)*.5)} ${l-18} ${yAt(l)+1} ${l} ${yAt(l)}`;
  // Honey gathers at the edges, narrows under tension, then forms a rounded, weighty droplet.
  d+=` C${l+r*.35} ${by-6} ${cx-r*.89} ${by+5} ${cx-r*.75} ${by+20}`;
  d+=` C${cx-r*.55} ${by+31} ${cx-r*.39} ${tip-23} ${cx-r*.30} ${tip-12}`;
  d+=` C${cx-r*.27} ${tip+8} ${cx+r*.26} ${tip+9} ${cx+r*.31} ${tip-12}`;
  d+=` C${cx+r*.40} ${tip-26} ${cx+r*.54} ${by+30} ${cx+r*.76} ${by+20}`;
  d+=` C${cx+r*.88} ${by+5} ${rr-r*.35} ${by-6} ${rr} ${yAt(rr)}`;
  // A separate thin glint rides above the pool; it does not trace the drop like a cartoon outline.
  outline+=` C${(x0+l)*.5} ${yAt((x0+l)*.5)-5} ${l-18} ${yAt(l)-4} ${l} ${yAt(l)-4}`;
  outline+=` M${rr} ${yAt(rr)-4}`;
  const left=cx-r*.56;
  shines.push(`M${left-1} ${by+22} C${left+3} ${by+41} ${cx-r*.26} ${tip-33} ${cx-r*.21} ${tip-21}`);
  x0=rr;
 }
 d+=` C${(x0+w)*.5} ${yAt((x0+w)*.5)} ${w-14} ${yAt(w)} ${w} ${yAt(w)} L${w} 0 Z`;
 outline+=` C${(x0+w)*.5} ${yAt((x0+w)*.5)-5} ${w-14} ${yAt(w)-5} ${w} ${yAt(w)-5}`;
 return {d,outline,shines:shines.join(' '),rim:`M0 ${yAt(0)+2} C${w*.32} ${yAt(w*.32)+3} ${w*.68} ${yAt(w*.68)+2} ${w} ${yAt(w)+2}`};
}
function paint(){const g=compute(reduce.matches?0:clock,reduce.matches?.28:progress,reduce.matches?0:activity);body.setAttribute('d',g.d);edge.setAttribute('d',g.outline);rim.setAttribute('d',g.rim);shine.setAttribute('d',g.shines);spark.setAttribute('cx',String(width*.44));}
function update(){const top=hero.getBoundingClientRect().top+window.scrollY;target=clamp((window.scrollY-top)/(hero.offsetHeight*.9),0,1);activity=Math.min(1.2,activity+Math.abs(window.scrollY-lastScroll)/190);lastScroll=window.scrollY;if(!raf&&!reduce.matches&&visible)raf=requestAnimationFrame(tick)}
function tick(time){const dt=last?Math.min((time-last)/1000,.05):.016;last=time;clock+=dt;progress+=(target-progress)*(1-Math.exp(-4.1*dt));activity*=Math.exp(-1.8*dt);paint();if(!visible||document.hidden||reduce.matches){raf=0;last=0;return}raf=requestAnimationFrame(tick)}
function size(){width=Math.max(260,hero.clientWidth);svg.setAttribute('viewBox',`0 0 ${width} 210`);update();paint()}
window.addEventListener('resize',size,{passive:true});window.addEventListener('scroll',update,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0}else update()});
reduce.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;last=0;update();paint()});
if('IntersectionObserver'in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)update();else{cancelAnimationFrame(raf);raf=0;last=0}},{rootMargin:'210px'}).observe(svg)}
size();if(!reduce.matches)raf=requestAnimationFrame(tick);
})();
