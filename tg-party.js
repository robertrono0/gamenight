/* Game Night party engine: lobby, collect answers from phones, vote, score, podium.
   Used by the phone party games (Fill in the Blank, Who Said It, Two Truths, Fake Out, Herd Mind, Category Rush, Sketch Off, Picture Phone, Baby Photos...) */
const PG={opt:{},score:{},round:0,_c:null,_v:null,_timer:null,_handlers:{},log:[],
 init(o){this.opt=o;this.score=LS.get(o.key+'-score',{});
  if(window.TGB)TGB.init({game:o.game,names:phoneNames,onInput:(n,id,v)=>this.onInput(n,id,v),onJoin:n=>{if(this.inLobby){this._ldraw&&this._ldraw();this.wait('You\'re in! 🎉','Waiting for the host to start...','🎉')}else if(this._c&&this._c.spec)TGB.ask(this._c.spec(n),[n]);else if(this._v)TGB.ask(this._v.specFor(n),[n])},
   onAct:id=>{if(id==='go'&&this.inLobby&&this._go)this._go();else if(id==='skip')this.skip();else if(id==='next'&&this._next)this._next()}});
  shellInit({game:o.game,style:o.style||'pop',rain:o.rain,onNew:()=>{this.reset();$('#endOv').classList.add('hidden');$('#setupOv').classList.remove('hidden');music('chill');if(window.TGB)TGB.clearUI()}})},
 save(){LS.set(this.opt.key+'-score',this.score)},
 reset(){this.score={};this.save();this.round=0;this.stop();this.inLobby=false;this._np=null;this._nres=null},
 players(){return window.TGB?TGB.players():[]},
 add(n,p){if(!n)return;this.score[n]=(this.score[n]||0)+p;this.save()},
 stage(h){$('#stage').innerHTML=h},
 wait(t,b,e){if(window.TGB)TGB.ask({k:'msg',key:'w'+Date.now(),emoji:e||'👀',title:t||'Look at the TV!',body:b||''})},
 /* ---------- lobby ---------- */
 lobby(){return new Promise(res=>{this.inLobby=true;this._go=()=>{if(this.players().length<(this.opt.min||2)){toast(`Need at least ${this.opt.min||2} players with phones`);return}this.inLobby=false;clearInterval(this._li);res(this.players())};
  const steps=$$('#howOv .hc').slice(0,4).map((e,i)=>`<div class="qs"><b>${i+1}</b><span>${e.innerHTML.replace(/<span class="i">.*?<\/span>/,'')}</span></div>`).join('');
  const draw=()=>{if(!this.inLobby)return;const n=this.players().length;this.stage(lobbyHTML(this.opt.title,this.opt.sub||'')+(steps?`<div class="qsteps">${steps}</div>`:'')+`<button class="bb gold big" id="pgGo" ${n>=(this.opt.min||2)?'':'disabled'}>▶ START (${n} player${n===1?'':'s'})</button>`);$('#pgGo').onclick=this._go;this.host('Lobby: '+n+' players',[{id:'go',label:'▶ Start',k:'y'}])};
  this._ldraw=draw;draw();clearInterval(this._li);this._li=setInterval(draw,2500);this.wait('You\'re in! 🎉','Waiting for the host to start...','🎉')})},
 host(q,actions,a){if(window.TGB)TGB.host({title:this.opt.title,q,a:a||'',actions:actions||[],noBuzzBtns:true})},
 /* ---------- collect: every phone answers ---------- */
 collect({id,spec,secs=60,who,title,sub,show}){return new Promise(res=>{const names=who||this.players(),subs={},until=Date.now()+secs*1000;const key=id+'-'+Date.now();
  const sp=n=>Object.assign({key,id,secs,until},spec(n));this._c={id,subs,names,spec:sp,res,until,secs};
  if(window.TGB)TGB.askEach(Object.fromEntries(names.map(n=>[n,sp(n)])));
  this.stage(`${title||''}<div style="display:flex;gap:2vw;align-items:center;justify-content:center"><div class="ring" id="pgRing"><span>${secs}</span></div><div class="status" style="font-size:2.6vh">${sub||'Answer on your phone! 📱'}</div></div><div id="pgSubs">${subsHTML(names,[])}</div><button class="bb ghost" id="pgSkip">⏭ Time's up</button>`);
  $('#pgSkip').onclick=()=>this.skip();this.host((sub||'Phones are answering')+'',[{id:'skip',label:"⏭ Time's up",k:'no'}]);
  this.tick(until,secs,()=>this.finishC());music('tense')})},
 tick(until,secs,end){clearInterval(this._timer);this._timer=setInterval(()=>{const l=Math.max(0,(until-Date.now())/1000),r=$('#pgRing');if(r){r.style.setProperty('--p',l/secs);r.querySelector('span').textContent=Math.ceil(l);r.classList.toggle('low',l<=5)}if(l<=5&&l>0&&Math.abs(l-Math.round(l))<.05)SFX.tick(l<=3);if(l<=0){clearInterval(this._timer);end()}},100)},
 finishC(){const c=this._c;if(!c)return;this._c=null;clearInterval(this._timer);SFX.horn();this.wait('Time\'s up! ⏰','Look at the TV 👀','📺');c.res(c.subs)},
 /* ---------- vote ---------- */
 vote({id,opts,secs=40,who,title,sub,exclude}){return new Promise(res=>{const names=who||this.players(),votes={},until=Date.now()+secs*1000,key=id+'-'+Date.now();
  const specFor=n=>{const o=opts(n).filter(x=>!exclude||!exclude(n,x));return{k:'choice',key,id,secs,until,title:title||'Vote!',body:sub||'',opts:o,cols:o.length>4?2:1}};
  this._v={id,votes,names,res,specFor};if(window.TGB)TGB.askEach(Object.fromEntries(names.map(n=>[n,specFor(n)])));
  const st=$('#pgVotes');if(st)st.innerHTML=`<div style="display:flex;gap:2vw;align-items:center;justify-content:center"><div class="ring" id="pgRing"><span>${secs}</span></div>${subsHTML(names,[])}</div>`;
  this.host('Voting...',[{id:'skip',label:'⏭ End voting',k:'no'}]);this.tick(until,secs,()=>this.finishV())})},
 finishV(){const v=this._v;if(!v)return;this._v=null;clearInterval(this._timer);this.wait('Votes are in! 🗳️','Look at the TV 👀','📺');v.res(v.votes)},
 skip(){if(this._c)this.finishC();else if(this._v)this.finishV()},
 stop(){clearInterval(this._timer);clearInterval(this._li);this._c=null;this._v=null},
 onInput(n,id,v){if(this._c&&id===this._c.id&&this._c.names.includes(n)&&this._c.subs[n]==null){this._c.subs[n]=v;SFX.click();const e=$('#pgSubs');if(e)e.innerHTML=subsHTML(this._c.names,Object.keys(this._c.subs));if(this._c.names.filter(x=>this.players().includes(x)).every(x=>this._c.subs[x]!=null))setTimeout(()=>this.finishC(),700);return}
  if(this._v&&id===this._v.id&&this._v.names.includes(n)){this._v.votes[n]=v;SFX.click();const e=$('#pgVotes .subs');if(e)e.outerHTML=subsHTML(this._v.names,Object.keys(this._v.votes));if(this._v.names.filter(x=>this.players().includes(x)).every(x=>this._v.votes[x]!=null))setTimeout(()=>this.finishV(),700);return}
  const h=this._handlers[id];if(h)h(n,v)},
 /* ---------- next button ---------- */
 next(label='NEXT ➜',extra=''){if(!this._np)this._np=new Promise(res=>{this._nres=res});const old=$('#pgNextWrap');if(old)old.remove();const b=document.createElement('div');b.className='btns';b.id='pgNextWrap';b.innerHTML=`${extra}<button class="bb gold big" id="pgNext">${label}</button>`;$('#stage').appendChild(b);
  this._next=()=>{const r=this._nres;this._np=null;this._nres=null;this._next=null;const w=$('#pgNextWrap');if(w)w.remove();SFX.whoosh();r&&r()};$('#pgNext').onclick=this._next;this.host('Ready for the next part',[{id:'next',label:'➜ '+label.replace(/[^\w ]/g,'').trim(),k:'y'}]);return this._np},
 /* ---------- scoreboard + end ---------- */
 ranked(){this.players().forEach(n=>{if(this.score[n]==null)this.score[n]=0});return Object.entries(this.score).sort((a,b)=>b[1]-a[1])},
 board(gain){const r=this.ranked().slice(0,10);return`<div class="bigT" style="font-size:4.6vh">📊 SCORES</div><div style="display:flex;flex-direction:column;gap:.8vh;width:min(900px,90vw)">${r.map(([n,p],i)=>`<div style="display:grid;grid-template-columns:5vh 5.4vh 1fr auto auto;gap:1vw;align-items:center;padding:.8vh 1.4vw;border-radius:1.4vh;background:${i?'rgba(255,255,255,.08)':'linear-gradient(90deg,rgba(255,204,61,.4),rgba(255,204,61,.08))'};font-size:2.6vh;font-weight:700;animation:popIn .5s ${i*.06}s backwards"><span style="font-family:var(--fd);color:var(--gold);text-align:center">${['🥇','🥈','🥉'][i]||i+1}</span>${avHTML(n)}<span>${esc(n)}</span><span style="color:#5cf09a;font-size:2vh">${gain&&gain[n]?'+'+gain[n]:''}</span><span style="font-family:var(--fd)">${p}</span></div>`).join('')}</div>`},
 end(){this.stop();music('party');const r=this.ranked();try{tgNight(this.opt.game,tgPlaces(r.map(([n,p])=>({names:[n],v:p}))))}catch(e){}
  const top=r.slice(0,3),md=['🥇','🥈','🥉'],h=[46,36,28],vis=[top[1],top[0],top[2]].filter(Boolean);
  $('#endWrap').innerHTML=`<div class="bigT">🏆 ${r[0]?esc(r[0][0])+' WINS!':'GAME OVER'}</div><div class="podium">${vis.map(t=>{const k=top.indexOf(t);return`<div class="pod" style="--tc:${['#ffcc3d','#c0c0c0','#cd7f32'][k]};height:${h[k]}vh;animation-delay:${(2-k)*.3}s"><div class="md">${md[k]}</div><div style="margin:0 auto">${avHTML(t[0])}</div><h4>${esc(t[0])}</h4><div class="s">${t[1]}</div></div>`}).join('')}</div><div class="ctr"><button class="bb gold big" id="eAgain">🔁 Play again</button></div>`;
  $('#endOv').classList.remove('hidden');if(window.FXX&&r[0])FXX.bigWin('🏆 '+r[0][0].toUpperCase(),r[0][1]+' pts',this.opt.game+' champion!');else SFX.win();
  if(window.TGB)TGB.askEach(Object.fromEntries(this.players().map(n=>{const k=r.findIndex(x=>x[0]===n);return[n,{k:'msg',key:'end'+n,emoji:['🥇','🥈','🥉'][k]||'🎉',title:k>=0?`You finished #${k+1}!`:'Thanks for playing!',body:`${this.score[n]||0} points`}]})));
  $('#eAgain').onclick=()=>{$('#endOv').classList.add('hidden');this.reset();$('#setupOv').classList.remove('hidden');music('chill');if(window.TGB)TGB.clearUI()}}};
/* helpers */
const answersGrid=(items,cls='')=>`<div class="ansG ${cls}">${items.map((x,i)=>`<div class="ansC" style="animation-delay:${i*.12}s">${x}</div>`).join('')}</div>`;
(function(){const c=document.createElement('style');c.textContent=`
.ansG{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(30vw,420px),1fr));gap:1.4vh 1.2vw;width:min(1500px,94vw)}
.ansC{padding:1.8vh 1.6vw;border-radius:2vh;background:linear-gradient(180deg,#fff7e6,#ffe7bd);color:var(--ink);font-size:2.8vh;font-weight:700;box-shadow:0 .6vh 0 #b08a5a;animation:popIn .5s cubic-bezier(.3,1.6,.5,1) backwards;position:relative;line-height:1.3}
.ansC .num{position:absolute;top:-1.2vh;left:-1vh;width:4.4vh;height:4.4vh;border-radius:50%;display:grid;place-items:center;background:var(--gold);font-family:var(--fd);font-size:2.2vh;box-shadow:0 .3vh 0 #8a3a07}
.ansC .by{display:flex;align-items:center;gap:.6vw;margin-top:1vh;font-size:2vh;color:#7a2410}.ansC .vt{font-family:var(--fd);color:#16a35a;font-size:2.2vh;margin-left:auto}
.ansC.win{box-shadow:0 0 0 .5vh #ffcc3d,0 0 4vh rgba(255,204,61,.7)}.ansC.bad{opacity:.45}
.prompt{font-family:var(--fd);font-size:4.6vh;text-align:center;max-width:90vw;line-height:1.2;text-shadow:0 .5vh 0 rgba(0,0,0,.35)}
.prompt u{text-decoration:none;border-bottom:.5vh solid var(--gold);padding:0 2vw}
.qsteps{display:grid;grid-template-columns:repeat(4,1fr);gap:1vw;width:min(1500px,94vw)}.qs{display:flex;gap:.8vw;align-items:flex-start;padding:1.2vh 1vw;border-radius:1.6vh;background:rgba(255,255,255,.08);font-size:1.9vh;line-height:1.35;text-align:left}.qs b{flex:none;width:3.6vh;height:3.6vh;border-radius:50%;display:grid;place-items:center;background:var(--gold);color:var(--ink);font-family:var(--fd)}
.ansC img.drw{width:100%;border-radius:1.4vh;display:block;background:#fff}`;document.head.appendChild(c)})();
