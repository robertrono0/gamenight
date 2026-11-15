(function(){
const g=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},s=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
window.tgRoster=()=>{const r=g('tg-roster');return Array.isArray(r)?r:[]};
window.tgSetRoster=a=>{const seen=new Set();const out=(a||[]).map(x=>String(x).trim()).filter(x=>x&&!seen.has(x.toLowerCase())&&seen.add(x.toLowerCase()));if(out.length)s('tg-roster',out)};
window.tgNamesFromText=t=>String(t||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
// places: [[names for 1st],[2nd],[3rd]] ; 5 / 3 / 1 points
window.tgNight=(game,places,id)=>{const N=g('tg-night')||{log:[]};id=game+':'+(id||JSON.stringify(places));if(N.log.some(x=>x.id===id))return;
 const P=[5,3,1],aw={};places.forEach((ns,i)=>{if(P[i])(ns||[]).forEach(n=>{if(n)aw[n]=(aw[n]||0)+P[i]})});if(!Object.keys(aw).length)return;
 N.log.push({id,game,t:Date.now(),aw});s('tg-night',N);
 const d=document.createElement('div');d.textContent='🏅 Points added to the Game Night leaderboard';d.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99999;background:#ffcc3d;color:#2a0d12;font:700 16px system-ui,sans-serif;padding:10px 18px;border-radius:30px;box-shadow:0 6px 20px rgba(0,0,0,.4);pointer-events:none';document.body.appendChild(d);setTimeout(()=>d.remove(),4000)};
// group a sorted list into places by equal score: items [{names:[..],v}]
window.tgPlaces=items=>{const sorted=items.slice().sort((a,b)=>b.v-a.v),out=[];let last=null;sorted.forEach(x=>{if(last===null||x.v!==last){out.push([]);last=x.v}out[out.length-1].push(...x.names)});return out};
window.tgHome=pos=>{if(document.getElementById('tgHome'))return;const a=document.createElement('a');a.id='tgHome';a.href='index.html';a.title='All games';a.textContent='🏠';a.style.cssText='position:fixed;'+(pos||'left:14px;bottom:14px')+';z-index:9999;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;text-decoration:none;font-size:24px;border:2px solid rgba(255,255,255,.4);background:rgba(0,0,0,.45);backdrop-filter:blur(4px)';document.body.appendChild(a)};
})();

"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function rnd(n){const a=new Uint32Array(1),lim=Math.floor(4294967296/n)*n;let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=lim);return x%n}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a},pick=a=>a[rnd(a.length)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let _tT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(_tT);_tT=setTimeout(()=>t.classList.remove('on'),2200)}
function t2(html,ms=1800){const b=$('#t2');b.innerHTML=html;b.classList.add('on');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('on'),ms)}
// ---------------- AUDIO ----------------
const A={ctx:null,on:LS.get('tg-music',true),mode:'off',step:0,next:0,timer:null,style:null};
const STYLES={
 funk:{bpm:112,prog:[[60,64,67,71],[57,60,64,67],[62,65,69,72],[55,59,62,65]],bass:[48,45,50,43],mel:[72,0,74,76,0,79,76,0,74,72,0,69,72,0,0,0,76,0,79,81,0,79,76,0,74,0,76,74,72,0,0,0],lead:'square'},
 pop:{bpm:122,prog:[[60,64,67],[67,71,74],[57,60,64],[65,69,72]],bass:[48,43,45,41],mel:[76,76,0,74,72,0,74,76,79,0,76,0,74,0,72,0,72,74,76,0,79,0,81,79,76,0,74,72,74,0,0,0],lead:'triangle'},
 arab:{bpm:104,prog:[[62,65,69],[62,66,69],[60,63,67],[62,65,69]],bass:[50,50,48,50],mel:[74,75,78,0,79,78,75,74,0,75,74,72,74,0,0,0,74,0,78,79,81,79,78,75,78,75,74,0,72,74,0,0],lead:'sawtooth',maq:1},
 swing:{bpm:132,prog:[[60,64,67,70],[65,69,72,75],[60,64,67,70],[67,71,74,77]],bass:[48,53,48,55],mel:[79,0,76,79,0,76,0,72,74,0,76,0,74,72,0,0,81,0,79,76,0,74,0,76,79,0,0,76,74,0,72,0],lead:'square'},
 spooky:{bpm:96,prog:[[57,60,64],[53,57,60],[52,56,59],[57,60,64]],bass:[45,41,40,45],mel:[69,0,72,0,71,0,68,0,69,0,0,0,64,0,0,0,69,0,72,76,0,74,72,0,71,0,68,0,64,0,0,0],lead:'triangle'}};
function ac(){if(!A.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;const c=A.ctx=new C();A.out=c.createDynamicsCompressor();A.out.connect(c.destination);A.mus=c.createGain();A.mus.gain.value=0;A.mus.connect(A.out);A.sfx=c.createGain();A.sfx.gain.value=.9;A.sfx.connect(A.out);
 const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;A.nb=nb}if(A.ctx.state==='suspended')A.ctx.resume();return A.ctx}
const mt=n=>440*Math.pow(2,(n-69)/12);
function v(t,f,d,o={}){const c=A.ctx,os=c.createOscillator(),g=c.createGain();os.type=o.type||'sine';os.frequency.setValueAtTime(f,t);if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+d);let n=os;if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;os.connect(fl);n=fl}n.connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.g||.2,t+(o.a||.004));g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(o.bus||A.sfx);os.start(t);os.stop(t+d+.05)}
function nz(t,d,o={}){const c=A.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=A.nb;f.type=o.ft||'highpass';f.frequency.value=o.f||7000;s.connect(f);f.connect(g);g.gain.setValueAtTime(o.g||.15,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(o.bus||A.sfx);s.start(t,Math.random()*.5);s.stop(t+d+.02)}
function setStyle(name){A.style=STYLES[name]||STYLES.funk;A.bpm=A.style.bpm}
function music(m){A.mode=m;if(!ac())return;if(!A.style)setStyle('funk');const lv={off:0,chill:.22,play:.32,tense:.3,party:.55}[m]||0;A.mus.gain.setTargetAtTime(A.on?lv:0,A.ctx.currentTime,.3);
 if(!A.timer){A.next=A.ctx.currentTime+.1;A.step=0;A.timer=setInterval(()=>{if(!A.on||A.mode==='off')return;const bpm=A.style.bpm*(A.mode==='tense'?1.12:A.mode==='party'?1.06:1),spb=60/bpm/4;if(A.next<A.ctx.currentTime)A.next=A.ctx.currentTime+.05;while(A.next<A.ctx.currentTime+.12){beat(A.step,A.next,spb);A.next+=spb;A.step++}},25)}
 $$('.musicBtn').forEach(b=>b.classList.toggle('off',!A.on))}
function beat(s,t,spb){const S=A.style,st=s%16,bar=Math.floor(s/16),ch=bar%4,m=A.mode,B=A.mus;
 if(m!=='chill'||st%8===0){if(st%4===0)v(t,150,.28,{f2:42,g:.75,bus:B})}
 if(st===4||st===12)nz(t,.14,{f:1400,g:m==='chill'?.12:.28,bus:B});
 if(st%2===0||m==='tense')nz(t,.035,{f:9000,g:m==='tense'?.09:.05,bus:B});
 if(S.maq&&(st===3||st===11))nz(t,.05,{ft:'bandpass',f:3200,g:.12,bus:B});
 if(st%4===2||(m!=='chill'&&st%8===7))v(t,mt(S.bass[ch]-12),spb*1.6,{type:'sawtooth',g:.15,lp:520,bus:B});
 if(st===0||st===8||(m==='party'&&st%4===2))S.prog[ch].forEach(n=>v(t,mt(n+12),.28,{type:'square',g:.022,lp:2600,bus:B}));
 if(m==='chill'&&st===0)S.prog[ch].forEach(n=>v(t,mt(n),spb*14,{type:'triangle',g:.035,a:.3,bus:B}));
 if(m==='tense'&&st%2===0)v(t,mt(S.bass[ch]),spb*.9,{type:'square',g:.04,lp:900,bus:B});
 if(m!=='tense'&&m!=='chill'){const mi=(st+(bar%2)*16),n=S.mel[mi%S.mel.length];if(n&&st%1===0&&(mi%2===0||m==='party'))v(t,mt(n),spb*1.8,{type:S.lead,g:m==='party'?.07:.045,lp:3500,bus:B})}}
const SFX={
 ding(){if(!ac())return;const t=A.ctx.currentTime;[88,93].forEach((n,i)=>v(t+i*.12,mt(n),1.1,{g:.24}));v(t,mt(76),.6,{type:'triangle',g:.12})},
 ok(){if(!ac())return;const t=A.ctx.currentTime;[72,76,79,84].forEach((n,i)=>v(t+i*.07,mt(n),.35,{type:'triangle',g:.18}))},
 buzz(){if(!ac())return;const t=A.ctx.currentTime;v(t,110,.8,{type:'sawtooth',g:.3,lp:1400});v(t,116,.8,{type:'square',g:.15,lp:1200})},
 skip(){if(!ac())return;const t=A.ctx.currentTime;v(t,600,.25,{type:'triangle',f2:200,g:.15})},
 tick(hi){if(!ac())return;v(A.ctx.currentTime,hi?1600:1100,.06,{type:'square',g:hi?.1:.06})},
 click(){if(!ac())return;v(A.ctx.currentTime,900,.05,{type:'square',g:.05})},
 whoosh(){if(!ac())return;nz(A.ctx.currentTime,.5,{ft:'bandpass',f:1200,g:.25})},
 horn(){if(!ac())return;const t=A.ctx.currentTime;[0,.18,.36].forEach((d,i)=>v(t+d,i<2?mt(67):mt(72),i<2?.15:.7,{type:'sawtooth',g:.14,lp:2500}))},
 roll(ms=1500){if(!ac())return;const t=A.ctx.currentTime,n=Math.floor(ms/45);for(let i=0;i<n;i++)nz(t+i*.045,.05,{ft:'bandpass',f:220,g:.12+.25*i/n});v(t+ms/1000,mt(60),.6,{type:'sawtooth',g:.1,lp:2000});nz(t+ms/1000,.6,{f:6000,g:.3})},
 win(){if(!ac())return;const t=A.ctx.currentTime;[[60,64,67],[65,69,72],[67,71,74],[72,76,79,84]].forEach((c,i)=>c.forEach(n=>v(t+i*.16,mt(n),i==3?1.4:.22,{type:'sawtooth',g:.06,lp:4000})));for(let i=0;i<24;i++)nz(t+.3+i*.04,.05,{ft:'bandpass',f:2000+rnd(2000),g:.08})},
 sad(){if(!ac())return;const t=A.ctx.currentTime;[67,66,65,64].forEach((n,i)=>v(t+i*.32,mt(n-12),i===3?1:.3,{type:'sawtooth',g:.12,lp:1200}))}};
function toggleMusic(){A.on=!A.on;LS.set('tg-music',A.on);music(A.mode==='off'?'play':A.mode);if(A.on&&A.mus)A.mus.gain.setTargetAtTime(.3,A.ctx.currentTime,.3)}
// ---------------- FX ----------------
let _cv,_cx,_parts=[];
function fxInit(){_cv=$('#fx');_cx=_cv.getContext('2d');const rs=()=>{_cv.width=innerWidth;_cv.height=innerHeight};addEventListener('resize',rs);rs();(function loop(){_cx.clearRect(0,0,_cv.width,_cv.height);_parts=_parts.filter(p=>p.life>0&&p.y<_cv.height+40);for(const p of _parts){p.vy+=.25;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.r+=p.vr;p.life-=p.dec;_cx.save();_cx.globalAlpha=Math.min(1,p.life*1.5);_cx.translate(p.x,p.y);_cx.rotate(p.r);if(p.c){_cx.fillStyle=p.c;_cx.fillRect(-p.sz/2,-p.sz/4,p.sz,p.sz/2)}else{_cx.font=(p.sz*2.6)+'px serif';_cx.fillText(p.e,-p.sz,p.sz)}_cx.restore()}requestAnimationFrame(loop)})()}
function burst(x=innerWidth/2,y=innerHeight/3,n=100,emo){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=9*(.4+Math.random());_parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-4,life:1,dec:.008+Math.random()*.01,r:0,vr:(Math.random()-.5)*.3,c:Math.random()<.7?pick(['#ffcc3d','#ff7a1a','#2ec4b6','#ff4d6d','#fff3dc','#a78bfa']):null,e:pick(emo||['🎉','⭐','💵','✨','🎊']),sz:7+Math.random()*8})}}
function rain(emo,n=14){for(let i=0;i<n;i++){const e=document.createElement('div');e.className='falling';e.textContent=pick(emo);e.style.left=rnd(100)+'vw';e.style.animationDuration=(4+rnd(5))+'s';e.style.animationDelay=(rnd(30)/10)+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),13000)}}
async function countdown(n=3,go='GO!'){const d=document.createElement('div');d.className='countdown';document.body.appendChild(d);for(let i=n;i>0;i--){d.innerHTML=`<span>${i}</span>`;SFX.tick(i===1);await sleep(800)}d.innerHTML=`<span>${go}</span>`;SFX.horn();await sleep(700);d.remove()}
// ---------------- TIMER ----------------
function Timer(el,secs,onEnd,onTick){let left=secs,iv=null,paused=false;const draw=()=>{el.style.setProperty('--p',left/secs);el.querySelector('span').textContent=Math.ceil(left);el.classList.toggle('low',left<=5)};draw();
 return{start(){clearInterval(iv);iv=setInterval(()=>{if(paused)return;left=Math.max(0,left-.1);draw();if(Math.abs(left-Math.round(left))<.05&&left<=5&&left>0)SFX.tick(left<=3);onTick&&onTick(left);if(left<=0){clearInterval(iv);SFX.buzz();onEnd&&onEnd()}},100)},stop(){clearInterval(iv)},pause(p){paused=p},add(s){left=Math.min(secs,left+s);draw()},get left(){return left}}}
// ---------------- TEAMS ----------------
const TC=['var(--t0)','var(--t1)','var(--t2)','var(--t3)'];
const TNAMES=[['The Smarty Pants','The Know-It-Alls','The Wildcards','The Underdogs'],['Team Fire','Team Ice','Team Yalla','Team Habibi']];
const parseNames=txt=>{const seen=new Set();return txt.split(/[\n,]+/).map(s=>s.trim()).filter(s=>s&&!seen.has(s.toLowerCase())&&seen.add(s.toLowerCase()))};
function splitTeams(names,n){const sh=shuffle(names),t=Array.from({length:n},()=>[]);sh.forEach((x,i)=>t[i%n].push(x));return t}
// standard setup block: <div id="teamSetup"></div>
function teamSetup(host,key,opts={}){const st=LS.get(key+'-setup',{names:'',n:2,tn:TNAMES[0].slice()});let groups=[];const R=tgRoster();if(R.length)st.names=R.join('\n');
 host.innerHTML=`<h3>Players <span class="hint">(one per line or commas)</span></h3><textarea class="field" id="tsNames" placeholder="✏️ Type everyone's names here, one per line&#10;(Names fill in by themselves when guests scan the QR on the home page)">${esc(st.names)}</textarea>
 <div style="display:flex;gap:1vw;align-items:center;flex-wrap:wrap;margin-top:1vh"><b style="font-size:1.9vh">Teams:</b><div class="seg" id="tsN">${[2,3,4].map(n=>`<button data-v="${n}" class="${n===st.n?'on':''}">${n}</button>`).join('')}</div><button class="chip" id="tsMix">🎲 Shuffle teams</button><span class="hint" id="tsCount"></span></div>
 <div class="teamsPrev" id="tsPrev"></div>`;
 const draw=()=>{$('#tsPrev').innerHTML=Array.from({length:st.n},(_,i)=>`<div style="--tc:${TC[i]}"><input class="field" data-tn="${i}" value="${esc(st.tn[i]||TNAMES[0][i])}" style="font-weight:700;margin-bottom:.5vh;padding:.5vh 1vh"><span>${(groups[i]||[]).map(esc).join(', ')||'<i class="hint">add names above</i>'}</span></div>`).join('');$$('[data-tn]').forEach(e=>e.oninput=()=>{st.tn[+e.dataset.tn]=e.value;LS.set(key+'-setup',st)});$('#tsCount').textContent=parseNames(st.names).length+' players'};
 const re=()=>{groups=splitTeams(parseNames(st.names),st.n);draw()};
 $('#tsNames').oninput=e=>{st.names=e.target.value;LS.set(key+'-setup',st);tgSetRoster(parseNames(st.names));re()};$('#tsMix').onclick=()=>{re();SFX.click()};
 $$('#tsN button').forEach(b=>b.onclick=()=>{$$('#tsN button').forEach(x=>x.classList.remove('on'));b.classList.add('on');st.n=+b.dataset.v;LS.set(key+'-setup',st);re()});re();
 return{teams(){const names=parseNames(st.names);if(groups.flat().length!==names.length)re();return Array.from({length:st.n},(_,i)=>({name:st.tn[i]||TNAMES[0][i],m:groups[i]||[],score:0,c:TC[i]}))},names:()=>parseNames(st.names)}}
function scoreBar(teams,cur){return teams.map((t,i)=>`<div class="sc${i===cur?' on':''}" id="sc${i}" style="--tc:${t.c}"><div style="min-width:0"><div class="n">${esc(t.name)}</div><div class="m">${t.m.map(esc).join(', ')}</div></div><div class="s">${t.score}</div></div>`).join('')}
function bumpScore(i){const e=$('#sc'+i);if(e){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}}
let GAME='game';
function podium(teams,label='points'){try{tgNight(GAME,tgPlaces(teams.map(t=>({names:t.m,v:t.score}))))}catch(e){}const order=teams.map((t,i)=>({...t,i})).sort((a,b)=>b.score-a.score),md=['🥇','🥈','🥉','🏅'],h=[46,36,28,22];const vis=[order[1],order[0],order[2],order[3]].filter(Boolean);
 return`<div class="podium">${vis.map(t=>{const r=order.indexOf(t);return`<div class="pod" style="--tc:${t.c};height:${h[r]}vh;animation-delay:${(3-r)*.3}s"><div class="md">${md[r]}</div><h4>${esc(t.name)}</h4><div class="s">${t.score}</div><p>${t.m.map(esc).join(', ')}</p></div>`}).join('')}</div>`}
// ---------------- SHELL ----------------
function shellInit(o){fxInit();setStyle(o.style||'funk');GAME=o.game||document.title;
 const bs=$('#bStart');if(bs)bs.addEventListener('click',()=>setTimeout(()=>{let seen=null;try{seen=sessionStorage.getItem('tg-rules-'+GAME)}catch(e){}if(!seen&&$('#setupOv').classList.contains('hidden')&&$('#howOv')){$('#howOv').classList.remove('hidden');try{sessionStorage.setItem('tg-rules-'+GAME,'1')}catch(e){}}},150));
 $$('.musicBtn').forEach(b=>b.onclick=toggleMusic);$$('.musicBtn').forEach(b=>b.classList.toggle('off',!A.on));
 const fb=$('#bFull');if(fb)fb.onclick=()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()};
 $$('[data-how]').forEach(b=>b.onclick=()=>$('#howOv').classList.remove('hidden'));const hc=$('#howClose');if(hc)hc.onclick=()=>$('#howOv').classList.add('hidden');
 let nArm=0;const nb=$('#bNew');if(nb)nb.onclick=()=>{if(Date.now()-nArm>3000){nArm=Date.now();toast('Tap 🔁 again to start a new game');return}o.onNew&&o.onNew()};
 document.addEventListener('pointerdown',()=>{ac();if(A.mode==='off')music('chill')},{once:true});
 if(o.rain)setInterval(()=>{if(!document.hidden)rain(o.rain,2)},9000)}

/* Big TV-moment effects: money rain, big win, big loss, count-up (standalone) */
(function(){
if(window.FXX)return;
const css=document.createElement('style');css.textContent=`
.fxBill{position:fixed;top:-12vh;z-index:9990;pointer-events:none;font-size:6vh;will-change:transform;animation:fxFall linear forwards}
@keyframes fxFall{0%{transform:translateY(0) rotate(0) rotateY(0)}100%{transform:translateY(125vh) rotate(var(--r)) rotateY(720deg)}}
.fxFly{position:fixed;z-index:9991;pointer-events:none;font-size:7vh;animation:fxFly 1.6s ease-in forwards}
@keyframes fxFly{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--x),var(--y)) scale(.3) rotate(var(--r));opacity:0}}
#fxOv{position:fixed;inset:0;z-index:9992;display:none;place-items:center;pointer-events:none}
#fxOv.on{display:grid}
#fxOv .spot{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(255,215,90,.55),rgba(255,170,30,.18) 30%,rgba(0,0,0,.82) 70%);animation:fxSpot 3.6s ease-out forwards}
#fxOv.loss .spot{background:radial-gradient(circle at 50% 45%,rgba(255,60,60,.35),rgba(120,0,0,.55) 45%,rgba(0,0,0,.85) 80%)}
@keyframes fxSpot{0%{opacity:0}12%{opacity:1}80%{opacity:1}100%{opacity:0}}
#fxOv .box{position:relative;text-align:center;animation:fxBox 3.6s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes fxBox{0%{transform:scale(.2);opacity:0}14%{transform:scale(1.08);opacity:1}22%{transform:scale(1)}82%{opacity:1}100%{opacity:0;transform:scale(1.05)}}
#fxOv .t{font:900 9vh system-ui,sans-serif;color:#fff;text-shadow:0 .8vh 0 rgba(0,0,0,.4),0 0 4vh rgba(255,204,61,.9);letter-spacing:.02em}
#fxOv.loss .t{color:#ffd0d0;text-shadow:0 .8vh 0 rgba(0,0,0,.5),0 0 4vh rgba(255,60,60,.9)}
#fxOv .a{font:900 16vh system-ui,sans-serif;color:#ffcc3d;text-shadow:0 1vh 0 #6b4a07,0 0 6vh rgba(255,204,61,.9);line-height:1}
#fxOv.loss .a{color:#ff6b6b;text-shadow:0 1vh 0 #5a0a0a,0 0 6vh rgba(255,60,60,.8)}
#fxOv .s{font:700 3.6vh system-ui,sans-serif;color:#fff3dc;margin-top:1vh}
.fxRing{position:fixed;left:50%;top:45%;width:10vh;height:10vh;margin:-5vh 0 0 -5vh;border-radius:50%;border:1vh solid #ffcc3d;z-index:9991;pointer-events:none;animation:fxRing 1.2s ease-out forwards}
@keyframes fxRing{to{transform:scale(14);opacity:0}}
.fxCannon{position:fixed;bottom:-4vh;z-index:9991;pointer-events:none;font-size:4.4vh;animation:fxCan 1.8s cubic-bezier(.2,.7,.4,1) forwards}
@keyframes fxCan{0%{transform:translate(0,0) rotate(0)}60%{opacity:1}100%{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}`;
(document.head||document.documentElement).appendChild(css);
const ov=document.createElement('div');ov.id='fxOv';ov.innerHTML='<div class="spot"></div><div class="box"><div class="t"></div><div class="a"></div><div class="s"></div></div>';const att=()=>{if(!ov.isConnected)document.body.appendChild(ov)};if(document.body)att();else document.addEventListener('DOMContentLoaded',att);
let ac=null;const A=()=>{try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}catch(e){return null}};
function tone(f,d,o={}){const c=A();if(!c)return;const t=c.currentTime+(o.at||0),os=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp||4000;os.type=o.type||'square';os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.g||.12,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);os.connect(fl);fl.connect(g);g.connect(c.destination);os.start(t);os.stop(t+d+.05)}
function noise(d,o={}){const c=A();if(!c)return;const t=c.currentTime+(o.at||0),b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type=o.ft||'bandpass';f.frequency.value=o.f||3000;g.gain.setValueAtTime(o.g||.15,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(c.destination);s.start(t)}
const S={
 cash(){[0,.07].forEach((d,i)=>tone(i?2637:1975,.35,{type:'triangle',g:.16,at:d}));noise(.25,{f:6000,g:.12,at:.05});tone(4186,.5,{type:'sine',g:.06,at:.12})},
 fanfare(){[[523,659,784],[587,740,880],[659,831,988],[784,988,1175,1568]].forEach((c,i)=>c.forEach(f=>tone(f,i==3?1.6:.2,{type:'sawtooth',g:.05,lp:3500,at:i*.17})));for(let i=0;i<14;i++)noise(.06,{f:2500+Math.random()*3000,g:.08,at:.5+i*.06})},
 trombone(){[392,370,349,311].forEach((f,i)=>tone(f/2,i===3?1.3:.42,{type:'sawtooth',g:.14,lp:900,at:i*.45,to:i===3?f/2*.9:undefined}))},
 whoosh(){noise(.6,{f:900,g:.2})},
 tick(){tone(1400,.03,{type:'square',g:.04})},
 boom(){tone(90,.6,{type:'sine',g:.35,to:40});noise(.4,{f:300,g:.2})}};
function rain(n=40,emo=['💵','💵','💵','💰','🪙']){for(let i=0;i<n;i++){const e=document.createElement('div');e.className='fxBill';e.textContent=emo[Math.floor(Math.random()*emo.length)];e.style.left=(Math.random()*100)+'vw';e.style.fontSize=(4+Math.random()*4)+'vh';e.style.setProperty('--r',(Math.random()*720-360)+'deg');e.style.animationDuration=(2.2+Math.random()*2.2)+'s';e.style.animationDelay=(Math.random()*1.2)+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),5000)}}
function cannons(emo=['🎉','✨','💵','⭐','🎊']){for(let i=0;i<36;i++){const left=i%2===0,e=document.createElement('div');e.className='fxCannon';e.textContent=emo[i%emo.length];e.style.left=left?'2vw':'94vw';e.style.setProperty('--x',(left?1:-1)*(20+Math.random()*45)+'vw');e.style.setProperty('--y',-(55+Math.random()*45)+'vh');e.style.setProperty('--r',(Math.random()*900-450)+'deg');e.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}}
function flyAway(n=14,emo=['💸','💸','💵']){for(let i=0;i<n;i++){const e=document.createElement('div');e.className='fxFly';e.textContent=emo[i%emo.length];e.style.left='50vw';e.style.top='45vh';const a=Math.random()*Math.PI*2;e.style.setProperty('--x',Math.cos(a)*60+'vw');e.style.setProperty('--y',Math.sin(a)*60-20+'vh');e.style.setProperty('--r',(Math.random()*720-360)+'deg');e.style.animationDelay=(Math.random()*.25)+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}}
function ring(){const r=document.createElement('div');r.className='fxRing';document.body.appendChild(r);setTimeout(()=>r.remove(),1300)}
const fmt$=v=>v<1&&v>0?(v*100).toFixed(0)+'¢':'$'+Math.round(v).toLocaleString();
function countUp(el,to,ms=1400,f=fmt$,from=0){const t0=performance.now();let lastTick=0;(function st(now){const k=Math.min(1,(now-t0)/ms),e=1-Math.pow(1-k,3),v=from+(to-from)*e;el.textContent=f(v);if(now-lastTick>70&&k<1){S.tick();lastTick=now}if(k<1)requestAnimationFrame(st);else el.textContent=f(to)})(t0)}
let hideT=null;
function show(cls,t,amt,sub){att();ov.className='on '+cls;ov.querySelector('.t').textContent=t;ov.querySelector('.s').textContent=sub||'';const a=ov.querySelector('.a');a.textContent=amt==null?'':(typeof amt==='number'?fmt$(0):amt);
 [ov.querySelector('.spot'),ov.querySelector('.box')].forEach(x=>{x.style.animation='none';void x.offsetWidth;x.style.animation=''});
 if(typeof amt==='number')setTimeout(()=>countUp(a,amt,1300),350);clearTimeout(hideT);hideT=setTimeout(()=>{ov.className=''},3700)}
window.FXX={sfx:S,rain,cannons,flyAway,ring,countUp,fmt$,
 win(t,amt,sub){show('win',t,amt,sub);S.boom();setTimeout(S.cash,300);setTimeout(S.fanfare,1500);ring();cannons();setTimeout(()=>rain(60),400)},
 bigWin(t,amt,sub){this.win(t,amt,sub);setTimeout(()=>{rain(80);cannons()},1600)},
 gain(amt,label){S.cash();rain(Math.min(50,8+Math.round(Math.log10(Math.max(1,amt))*8)));if(label){show('win',label,amt);clearTimeout(hideT);hideT=setTimeout(()=>{ov.className=''},2300)}},
 loss(t,amt,sub){show('loss',t,amt==null?null:(typeof amt==='number'?'−'+fmt$(Math.abs(amt)):amt),sub);S.trombone();flyAway()},
 lose(amt){S.whoosh();flyAway(10)}};
})();


/* ---------- shared helpers for the new games ---------- */
const money=v=>(v<0?'-$':'$')+Math.abs(Math.round(v)).toLocaleString();
const SETTINGS=(()=>{try{return JSON.parse(localStorage.getItem('tg-settings')||'{}')}catch(e){return{}}})();
const SET_KID=!!SETTINGS.kid,SET_SPICY=!!SETTINGS.spicy;
if(SETTINGS.big)document.documentElement.classList.add('tg-big');

/* ---------- phone-game helpers (lobby with big QR, avatars, collecting answers) ---------- */
const avatarOf=n=>(window.TGB&&TGB.avatar(n))||'';
function avHTML(n,cls='av'){const a=avatarOf(n);return a?`<img class="${cls}" src="${a}" alt="">`:`<span class="${cls} avL">${esc((n||'?').trim()[0]||'?').toUpperCase()}</span>`}
(function(){const c=document.createElement('style');c.textContent=`
.av{width:5vh;height:5vh;border-radius:50%;object-fit:cover;border:.3vh solid #fff;display:inline-grid;place-items:center;vertical-align:middle;flex:none}
.avL{background:linear-gradient(#ffcc3d,#ff7a1a);color:#2a0d12;font-family:var(--fd);font-size:2.4vh}
.lobby{display:grid;grid-template-columns:auto 1fr;gap:3vw;align-items:center;width:min(1400px,94vw)}
.lobby .qrb{background:#fff3dc;border-radius:3vh;padding:2vh;text-align:center;color:#2a0d12;box-shadow:0 0 0 .6vh var(--gold),0 2vh 5vh rgba(0,0,0,.5)}
.lobby .qrb svg{width:min(36vh,30vw);height:auto;display:block}
.lobby .qrb b{font-family:var(--fd);font-size:2.4vh;display:block;margin-bottom:1vh}
.lobby .who{display:flex;flex-wrap:wrap;gap:1.2vh;align-content:flex-start;max-height:58vh;overflow:auto}
.lobby .who .pp{display:flex;align-items:center;gap:.8vw;padding:.8vh 1.4vw .8vh .8vh;border-radius:4vh;background:rgba(255,255,255,.1);border:.25vh solid rgba(255,204,61,.5);font-weight:700;font-size:2.4vh;animation:popIn .5s cubic-bezier(.3,1.6,.5,1)}
.lobby h2{font-family:var(--fd);font-size:4.4vh;color:var(--gold);margin-bottom:1vh}
.subs{display:flex;flex-wrap:wrap;gap:1vh;justify-content:center;max-width:92vw}
.subs .pp{display:flex;align-items:center;gap:.6vw;padding:.6vh 1.2vw .6vh .6vh;border-radius:4vh;background:rgba(255,255,255,.08);font-weight:700;font-size:2vh;opacity:.45;transition:.3s}
.subs .pp.in{opacity:1;background:rgba(61,220,132,.25);box-shadow:0 0 0 .25vh #3ddc84}
html.tg-big body{zoom:1.12}`;document.head.appendChild(c)})();
function lobbyHTML(title,sub){const L=window.TGB?TGB.link('p'):'';const q=window.TGB?TGB.qr(L):'';const ps=window.TGB?TGB.players():[];
 return`<div class="lobby"><div class="qrb"><b>📱 SCAN TO PLAY</b>${q}<div style="font-size:1.6vh;margin-top:.6vh;opacity:.7">Same Wi-Fi as the TV</div></div><div><h2>${title}</h2><div class="status" style="text-align:left;margin-bottom:1.4vh">${sub||''}</div><div class="who">${ps.map(n=>`<div class="pp">${avHTML(n)}${esc(n)}</div>`).join('')||'<div class="hint" style="font-size:2.2vh;opacity:.7">Waiting for phones... 📲 Tip: tap 📸 on your phone to add a selfie!</div>'}</div></div></div>`}
function subsHTML(names,done){return`<div class="subs">${names.map(n=>`<div class="pp ${done.includes(n)?'in':''}">${avHTML(n)}${esc(n)}${done.includes(n)?' ✅':''}</div>`).join('')}</div>`}
const phoneNames=()=>[...new Set([...tgRoster(),...(window.TGB?TGB.players():[])])];
