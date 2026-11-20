/* Flourish v9: thick, fluid, scrolling honey lip. A static shape remains if JS motion is reduced. */
(() => {
'use strict';
const svg=document.getElementById('honey-svg');if(!svg)return;
const hero=document.querySelector('.hero'),body=document.getElementById('honey-body'),edge=document.getElementById('honey-highlight'),rim=document.getElementById('honey-rim'),shine=document.getElementById('honey-drop-shine'),spark=document.getElementById('honey-sparkle');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');let width=1440,progress=0,target=0,clock=0,last=0,raf=0,visible=true,lastScroll=window.scrollY,activity=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function compute(t,stretch,energy){
 const w=width,small=w<650;const base=small?38:40;
 const wob=(x)=>Math.sin(x*.006+t*.55)*4.5+Math.cos(x*.017-t*.36)*2.4+(energy*.45)*Math.sin(x*.015+t*1.8);
 const yAt=x=>base+wob(x);
 const list=small?[
  {ratio:.14,w:36,len:28,bulge:1.08},
  {ratio:.36,w:30,len:22,bulge:1.02},
  {ratio:.55,w:44,len:92,bulge:1.20},
  {ratio:.73,w:30,len:26,bulge:1.02},
  {ratio:.87,w:34,len:54,bulge:1.10}
 ]:[
  {ratio:.14,w:44,len:32,bulge:1.10},
  {ratio:.32,w:34,len:24,bulge:1.02},
  {ratio:.50,w:58,len:112,bulge:1.26},
  {ratio:.69,w:36,len:28,bulge:1.04},
  {ratio:.86,w:42,len:64,bulge:1.12}
 ];
 let d=`M0 0 L0 ${yAt(0).toFixed(1)}`;let outline=`M0 ${(yAt(0)-4).toFixed(1)}`;let shines=[];let x0=0;
 for(let i=0;i<list.length;i++){
  const item=list[i],cx=w*item.ratio+Math.sin(t*.52+i*1.7)*1.2+energy*Math.sin(t*1.6+i)*1.6;
  const r=item.w*(small?0.92:1),l=cx-r*1.9,rr=cx+r*1.9;const by=yAt(cx);
  const length=item.len+stretch*(i===2?26:12)+Math.sin(t*.72+i*1.8)*(1.4+energy*1.1);
  const tip=by+length,bul=item.bulge;
  d+=` C${(x0+l)*.5} ${yAt((x0+l)*.5)} ${l-20} ${yAt(l)+1} ${l} ${yAt(l)}`;
  d+=` C${l+r*.45} ${by-8} ${cx-r*1.03} ${by+6} ${cx-r*.92} ${by+20}`;
  d+=` C${cx-r*.78} ${by+38} ${cx-r*.64} ${tip-24} ${cx-r*.42} ${tip-10}`;
  d+=` C${cx-r*.24*bul} ${tip+10} ${cx+r*.24*bul} ${tip+10} ${cx+r*.42} ${tip-10}`;
  d+=` C${cx+r*.64} ${tip-24} ${cx+r*.78} ${by+38} ${cx+r*.92} ${by+20}`;
  d+=` C${cx+r*1.03} ${by+6} ${rr-r*.45} ${by-8} ${rr} ${yAt(rr)}`;
  outline+=` C${(x0+l)*.5} ${yAt((x0+l)*.5)-4} ${l-20} ${yAt(l)-3} ${l} ${yAt(l)-3}`;
  outline+=` M${rr} ${yAt(rr)-3}`;
  const left=cx-r*.50;
  shines.push(`M${left} ${by+18} C${left+4} ${by+35} ${cx-r*.20} ${tip-28} ${cx-r*.16} ${tip-18}`);
  x0=rr;
 }
 d+=` C${(x0+w)*.5} ${yAt((x0+w)*.5)} ${w-14} ${yAt(w)} ${w} ${yAt(w)} L${w} 0 Z`;
 outline+=` C${(x0+w)*.5} ${yAt((x0+w)*.5)-4} ${w-14} ${yAt(w)-4} ${w} ${yAt(w)-4}`;
 return {d,outline,shines:shines.join(' '),rim:`M0 ${yAt(0)+2} C${w*.33} ${yAt(w*.33)+2} ${w*.67} ${yAt(w*.67)+2} ${w} ${yAt(w)+2}`};
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
