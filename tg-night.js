/* Game Night: shared theme + settings + playlist layer, loaded on every game page */
(function(){
let S={},P=null;try{S=JSON.parse(localStorage.getItem('tg-settings')||'{}')||{};if(S.kid){delete S.kid;localStorage.setItem('tg-settings',JSON.stringify(S))}P=JSON.parse(localStorage.getItem('tg-playlist')||'null')}catch(e){}
if(S.big){const hub=/(^|\/)(index\.html)?$/.test(location.pathname)||/recap\.html$/.test(location.pathname);if(hub)document.documentElement.style.zoom=1.12;/* game pages already scale to the TV, so no zoom there */}
/* title emojis keep their real colors (gradient text turned them into gold blobs) */
(function(){const css=document.createElement('style');css.textContent='.tEmo{-webkit-text-fill-color:initial!important;color:initial!important;background:none!important;-webkit-background-clip:border-box!important;background-clip:border-box!important;display:inline-block;filter:none}.qs>span b{all:unset;font-weight:800;color:var(--gold)}';document.head.appendChild(css);
const re=/(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\u200D[\u2640\u2642]\uFE0F?|[\u{1F3FB}-\u{1F3FF}])*)/gu;
const wrap=()=>document.querySelectorAll('.title,h1').forEach(el=>{if(el.dataset.tEmo)return;el.dataset.tEmo=1;[...el.childNodes].forEach(n=>{if(n.nodeType===3&&re.test(n.data)){re.lastIndex=0;const sp=document.createElement('span');sp.innerHTML=n.data.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(re,'<span class="tEmo">$1</span>');n.replaceWith(...sp.childNodes)}})});
if(document.readyState==='loading')addEventListener('DOMContentLoaded',wrap);else wrap()})();
/* ---------- themes: [label, bgA, bgB, falling emojis, music style, accent] ---------- */
const T=window.TG_THEMES={
 classic:['🎉 Classic',null,null,null,null,null],
 christmas:['🎄 Christmas','#1f7a3a','#0b2a14',['❄️','🎄','🎁','⭐','🔔'],'xmas','#ffd166'],
 newyear:['🎆 New Year\'s','#2b1b6b','#06051a',['🎆','🥂','✨','🎉','⭐'],'party','#f5d76e'],
 winter:['❄️ Winter','#2d6aa8','#0b1e3a',['❄️','❄️','☃️','✨'],'xmas','#bde0fe'],
 valentine:['💕 Valentine\'s','#c2185b','#3d0620',['💕','💖','🌹','💘'],'romance','#ffb3c6'],
 stpatrick:['☘️ St. Patrick\'s','#2e7d32','#0a2a0d',['☘️','🍀','🌈','🪙'],'swing','#ffd166'],
 easter:['🐣 Easter','#7cb342','#2b4a12',['🥚','🐣','🐰','🌷','🌸'],'pop','#fff3b0'],
 spring:['🌸 Spring','#e91e63','#3f0a24',['🌸','🌼','🦋','🌷'],'pop','#ffe0ef'],
 ramadan:['🌙 Ramadan & Eid','#1a237e','#05081f',['🌙','⭐','🏮','✨'],'arab','#ffd166'],
 mothers:['💐 Mother\'s Day','#ad1457','#3a0620',['💐','🌷','💗','🌸'],'romance','#ffd6e7'],
 summer:['☀️ Summer','#f57c00','#4a1d00',['☀️','🍉','🕶️','🌴'],'tropical','#fff3b0'],
 july4:['🇺🇸 4th of July','#1e3a8a','#0b0f2a',['🎆','⭐','🇺🇸','🎇'],'party','#ff4d6d'],
 beach:['🏖️ Beach Party','#0097a7','#00303a',['🌴','🐚','🏐','🌊'],'tropical','#ffe082'],
 fall:['🍂 Fall','#bf5b04','#3a1500',['🍂','🍁','🍃','🎃'],'swing','#ffcc80'],
 halloween:['🎃 Halloween','#4a148c','#0c0216',['🎃','👻','🦇','🕸️','🍬'],'spooky','#ff9100'],
 thanksgiving:['🦃 Thanksgiving','#8d4004','#2b1102',['🍂','🦃','🥧','🌽','🍁'],'swing','#ffcc80'],
 hanukkah:['🕎 Hanukkah','#1565c0','#061a3a',['🕎','✡️','✨','🍩'],'pop','#e3f2fd'],
 lunar:['🧧 Lunar New Year','#c62828','#3a0505',['🧧','🏮','🐉','✨'],'pop','#ffd54f'],
 birthday:['🎂 Birthday','#8e24aa','#2a0738',['🎈','🎂','🎉','🎁','🥳'],'pop','#ffd166'],
 neon:['🌃 Neon Night','#0d0d2b','#000005',['✨','💜','💙','⚡'],'funk','#00e5ff']};
const key=S.theme&&T[S.theme]?S.theme:'classic',th=T[key];
/* ---------- extra music styles for the theme ---------- */
const MORE={
 xmas:{bpm:140,prog:[[60,64,67],[65,69,72],[67,71,74],[60,64,67]],bass:[48,53,55,48],mel:[76,76,76,0,76,76,76,0,76,79,72,74,76,0,0,0,77,77,77,77,77,76,76,76,76,74,74,76,74,0,79,0],lead:'triangle'},
 tropical:{bpm:108,prog:[[65,69,72],[60,64,67],[62,65,69],[58,62,65]],bass:[41,48,50,46],mel:[72,0,74,72,0,69,0,72,0,74,77,0,74,72,0,0,69,0,72,74,0,72,69,0,67,0,69,72,0,0,0,0],lead:'triangle'},
 romance:{bpm:88,prog:[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]],bass:[48,45,41,43],mel:[79,0,0,76,0,0,74,0,72,0,0,74,76,0,0,0,77,0,0,76,0,0,72,0,74,0,0,72,71,0,0,0],lead:'sine'},
 party:{bpm:128,prog:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],bass:[45,41,48,43],mel:[76,0,76,79,0,76,0,74,72,0,74,0,76,0,0,0,76,0,76,79,0,81,0,79,76,0,74,72,74,0,0,0],lead:'square'}};
function applyMusic(){try{if(typeof STYLES==='undefined'||typeof setStyle!=='function'||!th[4])return;Object.assign(STYLES,MORE);const orig=setStyle;setStyle=function(n){orig(th[4])};setStyle(th[4])}catch(e){}}
/* ---------- visuals ---------- */
function applyLook(){if(!th[1])return;const c=document.createElement('style');c.id='tgTheme';
 c.textContent=`:root{--bgA:${th[1]}!important;--bgB:${th[2]}!important}#bg{background:radial-gradient(ellipse at 50% 115%,${th[1]} 0%,${th[2]} 45%,#05030a 85%)!important}
 body{background-color:${th[2]}}${location.pathname.endsWith('index.html')||location.pathname.endsWith('/')?`body{background:radial-gradient(ellipse at 50% 120%,${th[1]} 0%,${th[2]} 45%,#06030a 85%) fixed!important}`:''}
 .tgFall{position:fixed;top:-8vh;z-index:3;pointer-events:none;font-size:3.6vh;opacity:.55;animation:tgFall linear forwards}@keyframes tgFall{to{transform:translateY(116vh) rotate(360deg) translateX(var(--dx))}}`;
 document.head.appendChild(c);const fall=()=>{if(document.hidden)return;for(let i=0;i<3;i++){const e=document.createElement('div');e.className='tgFall';e.textContent=th[3][Math.floor(Math.random()*th[3].length)];e.style.left=Math.random()*100+'vw';e.style.setProperty('--dx',(Math.random()*16-8)+'vw');e.style.fontSize=(2.4+Math.random()*3)+'vh';e.style.animationDuration=(7+Math.random()*7)+'s';e.style.animationDelay=(Math.random()*2)+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),17000)}};
 const go=()=>{fall();setInterval(fall,3200)};if(document.body)go();else addEventListener('DOMContentLoaded',go)}
applyLook();applyMusic();
/* ---------- party playlist "Next" pill ---------- */
const f=(location.pathname.split('/').pop()||'index.html');if(f==='index.html'||!P||!P.list||!P.list.length)return;const i=P.list.findIndex(x=>x.f===f);if(i<0)return;const n=P.list[i+1];
const b=document.createElement('a');b.href=n?n.f+'?from=playlist':'index.html';b.textContent=n?'▶ Next: '+n.n:'🏁 Back to standings';b.title='Party playlist';
b.style.cssText='position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:9989;font:800 15px system-ui,sans-serif;padding:9px 18px;border-radius:30px;background:rgba(61,220,132,.92);color:#062;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.4)';
const add=()=>document.body.appendChild(b);if(document.body)add();else addEventListener('DOMContentLoaded',add)})();
/* setup panels: keep the start button visible even when the panel scrolls */
(function(){const go=()=>{document.querySelectorAll('.panel,.card,.ovBox').forEach(p=>{const cs=getComputedStyle(p);if(!/(auto|scroll)/.test(cs.overflowY))return;const b=[...p.querySelectorAll('button')].find(x=>/START|SPIN THE WHEEL|SURVEY SAYS|ENTER THE CASTLE|OPEN THE LOBBY|LET'?S (GO|PLAY)|DEAL ME|BEGIN/i.test(x.textContent));if(!b)return;let w=b.parentElement;if(w===p)return;if(w.dataset.stk)return;w.dataset.stk=1;w.style.position='sticky';w.style.bottom='0';w.style.zIndex=5;w.style.padding='1.6vh 0 2.4vh';w.style.margin='1vh 0 0';w.style.background='linear-gradient(180deg,rgba(255,233,196,0),#ffe9c4 35%)'})};
if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>setTimeout(go,50));else setTimeout(go,50)})();
