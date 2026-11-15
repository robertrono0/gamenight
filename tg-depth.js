/*TGDEPTH*//* Game Night 3D depth layer: stage lights, 3D floor, depth particles, interactive tilt, press + light bursts */
(function(){
if(window.TGDEPTH)return;window.TGDEPTH=1;
let off=false;try{off=localStorage.getItem('tg-3d')==='0'||localStorage.getItem('tg-lite')==='1'}catch(e){}
if(off||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const css=document.createElement('style');css.textContent=`
#tgStage{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0}
#tgStage .floor{position:absolute;left:-50%;right:-50%;bottom:-8vh;height:62vh;transform-origin:50% 100%;transform:perspective(60vh) rotateX(72deg);
 background-image:linear-gradient(rgba(255,215,120,.22) 2px,transparent 2px),linear-gradient(90deg,rgba(255,215,120,.22) 2px,transparent 2px);background-size:9vh 9vh;
 -webkit-mask-image:linear-gradient(to top,#000 10%,transparent 85%);mask-image:linear-gradient(to top,#000 10%,transparent 85%);animation:tgFloor 6s linear infinite}
@keyframes tgFloor{to{background-position:0 9vh,0 0}}
#tgStage .spot{position:absolute;top:-20vh;width:70vh;height:150vh;transform-origin:50% 0;background:conic-gradient(from 168deg at 50% 0,transparent 0deg,rgba(255,240,200,.10) 10deg,rgba(255,240,200,.16) 12deg,rgba(255,240,200,.10) 14deg,transparent 24deg);filter:blur(6px);mix-blend-mode:screen}
#tgStage .spot.a{left:-10vh;animation:tgSwA 9s ease-in-out infinite alternate}#tgStage .spot.b{right:-10vh;animation:tgSwB 11s ease-in-out infinite alternate}
@keyframes tgSwA{from{transform:rotate(-28deg)}to{transform:rotate(12deg)}}@keyframes tgSwB{from{transform:rotate(26deg)}to{transform:rotate(-14deg)}}
#tgStage .bk{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,236,180,.55),rgba(255,236,180,0) 70%);animation:tgFloat linear infinite;mix-blend-mode:screen}
@keyframes tgFloat{from{transform:translate3d(0,10vh,0)}to{transform:translate3d(var(--dx),-110vh,0)}}
#tgStage .vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(0,0,0,.45) 100%)}
.tgTilt{transition:rotate .25s ease-out,scale .2s ease-out,box-shadow .25s ease-out;will-change:rotate}
.tgPress{scale:.95!important;transition:scale .08s!important}
.tgBurst{position:fixed;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;pointer-events:none;z-index:99999;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,220,120,.6) 40%,transparent 70%);animation:tgB .5s ease-out forwards}
@keyframes tgB{to{transform:scale(18);opacity:0}}
.tgGlare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.28),transparent 55%);mix-blend-mode:soft-light;opacity:0;transition:opacity .25s}
.tgTilt:hover>.tgGlare{opacity:1}`;
(document.head||document.documentElement).appendChild(css);
function stage(){if(document.getElementById('tgStage'))return;const st=document.createElement('div');st.id='tgStage';
 st.innerHTML='<div class="spot a"></div><div class="spot b"></div><div class="floor"></div><div class="vig"></div>';
 for(let i=0;i<22;i++){const b=document.createElement('div'),z=Math.random(),s=(1.2+z*7)+'vh';b.className='bk';b.style.width=b.style.height=s;b.style.left=Math.random()*100+'vw';b.style.bottom='-10vh';
  b.style.opacity=(.25+z*.55).toFixed(2);b.style.filter=`blur(${((1-z)*3).toFixed(1)}px)`;b.style.setProperty('--dx',(Math.random()*20-10)+'vw');b.style.animationDuration=(14+(1-z)*22)+'s';b.style.animationDelay=(-Math.random()*30)+'s';st.appendChild(b)}
 const bg=document.getElementById('bg');
 if(bg&&getComputedStyle(bg).position==='fixed'){bg.appendChild(st);st.style.position='absolute'}
 else document.body.insertBefore(st,document.body.firstChild)}
// interactive tilt on cards, tiles and buttons (uses the separate rotate/scale properties so game transforms keep working)
const SEL='.tile:not(.used),.slot,.g,.case,.panel,.team,.tbtn,.card2,.board .cell,.sq,.chip,.bb,.big,.big2,.big-btn,.key,.kb button,.gotB,.skipB,button.gold';
let cur=null;
function tiltOn(el,e){const r=el.getBoundingClientRect();if(r.width<30||r.height<20||r.width>innerWidth*.8)return;const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5,big=r.width*r.height>60000,amt=big?4:9;
 el.classList.add('tgTilt');el.style.rotate=`${(-py).toFixed(3)} ${px.toFixed(3)} 0 ${(Math.hypot(px,py)*amt*2).toFixed(2)}deg`;
 el.style.setProperty('--gx',((px+.5)*100).toFixed(0)+'%');el.style.setProperty('--gy',((py+.5)*100).toFixed(0)+'%');
 if(!el.querySelector(':scope>.tgGlare')&&getComputedStyle(el).position!=='static'){const g=document.createElement('span');g.className='tgGlare';el.appendChild(g)}}
function tiltOff(el){if(!el)return;el.style.rotate='';}
document.addEventListener('pointermove',e=>{const el=e.target.closest&&e.target.closest(SEL);if(el!==cur){tiltOff(cur);cur=el}if(el)tiltOn(el,e)},{passive:true});
document.addEventListener('pointerleave',()=>{tiltOff(cur);cur=null});
document.addEventListener('pointerdown',e=>{const el=e.target.closest&&e.target.closest('button,'+SEL);if(!el)return;el.classList.add('tgPress');setTimeout(()=>el.classList.remove('tgPress'),140);
 const b=document.createElement('div');b.className='tgBurst';b.style.left=e.clientX+'px';b.style.top=e.clientY+'px';document.body.appendChild(b);setTimeout(()=>b.remove(),520)},{passive:true});
if(document.body)stage();else document.addEventListener('DOMContentLoaded',stage);
})();
