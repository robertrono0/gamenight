if(!window.tgConfirm){window.tgConfirm=(title,body,yes,no,onYes)=>{const old=document.getElementById('tgCf');if(old)old.remove();const d=document.createElement('div');d.id='tgCf';d.style.cssText='position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(10,4,6,.78);backdrop-filter:blur(6px)';
 d.innerHTML=`<div style="background:linear-gradient(180deg,#fff7e6,#ffe9c4);color:#2a0d12;border-radius:22px;padding:28px 32px;max-width:min(560px,90vw);text-align:center;box-shadow:0 0 0 6px #ffcc3d,0 20px 60px rgba(0,0,0,.6);font-family:Fredoka,system-ui,sans-serif"><div style="font-size:28px;font-weight:800;margin-bottom:8px">${title}</div><div style="font-size:18px;margin-bottom:20px;opacity:.85">${body}</div><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button id="tgCfN" style="font:800 18px Fredoka,system-ui;padding:12px 22px;border-radius:999px;border:0;background:#3ddc84;color:#08311b;cursor:pointer">${no}</button><button id="tgCfY" style="font:700 16px Fredoka,system-ui;padding:12px 18px;border-radius:999px;border:2px solid #c0392b;background:#fff;color:#c0392b;cursor:pointer">${yes}</button></div></div>`;
 document.body.appendChild(d);d.querySelector('#tgCfN').onclick=()=>d.remove();d.querySelector('#tgCfY').onclick=()=>{d.remove();onYes()};d.onclick=e=>{if(e.target===d)d.remove()}};}
/* ---------- Theme music engine: every theme gets its own original, live-synthesized loop ----------
   TGM.step(ctx,bus,step,time,secondsPerTick,mood,scale) plays one tick. Moods: chill, play, tense, party.
   Adapters below plug it into each page's own music engine, so mute, volume and mood switching keep working. */
(function(){
if(window.TGM)return;
const NOTE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const nm=s=>{const r=/^([A-G])(#|b)?(\d)$/.exec(s);return r?NOTE[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)+12*(+r[3]+1):null};
const QU={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],'6':[0,4,7,9],sus4:[0,5,7],'7sus4':[0,5,7,10],dim:[0,3,6],m6:[0,3,7,9]};
function chord(n){const r=/^([A-G])(#|b)?(.*)$/.exec(n),pc=(NOTE[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)+12)%12,iv=QU[r[3]]||QU[''],base=57+((pc+3)%12);return{n:iv.map(i=>base+i),b:36+pc,iv}}
const mt=m=>440*Math.pow(2,(m-69)/12);
/* ---------- per-output bus with a shared reverb and echo ---------- */
const BUS=new WeakMap();
function bus(c,out){let X=BUS.get(out);if(X&&X.c===c)return X;X={c,g:-1,dt:0};X.in=c.createGain();X.in.connect(out);
 const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;X.nb=nb;
 try{const len=Math.floor(c.sampleRate*1.7),ir=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const q=ir.getChannelData(ch);for(let i=0;i<len;i++)q[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}
  const cv=c.createConvolver();cv.buffer=ir;X.wet=c.createGain();X.wet.gain.value=.32;X.wet.connect(cv);cv.connect(X.in)}catch(e){X.wet=X.in}
 try{X.dly=c.createDelay(2);X.dly.delayTime.value=.35;const fb=c.createGain(),lp=c.createBiquadFilter(),o=c.createGain();fb.gain.value=.36;lp.type='lowpass';lp.frequency.value=2600;o.gain.value=.55;X.dly.connect(lp);lp.connect(fb);fb.connect(X.dly);lp.connect(o);o.connect(X.in)}catch(e){X.dly=X.in}
 BUS.set(out,X);return X}
/* one oscillator voice: o = {type,g,a,rel,lp,lp2,lpt,q,ft,f0,gl,f2,det,vib,vd,vdel,rev,dly} */
function vo(X,t,f,d,o){const c=X.c,a=o.a||.004;d=Math.max(d,a+.03);const os=c.createOscillator(),g=c.createGain();os.type=o.type||'sine';
 if(o.f0){os.frequency.setValueAtTime(o.f0,t);os.frequency.exponentialRampToValueAtTime(f,t+(o.gl||.05))}else os.frequency.setValueAtTime(f,t);
 if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+d);if(o.det)os.detune.setValueAtTime(o.det,t);
 let n=os;if(o.lp){const fl=c.createBiquadFilter();fl.type=o.ft||'lowpass';fl.frequency.setValueAtTime(Math.min(o.lp,18000),t);if(o.lp2)fl.frequency.exponentialRampToValueAtTime(o.lp2,t+(o.lpt||d));if(o.q)fl.Q.value=o.q;os.connect(fl);n=fl}
 n.connect(g);const pk=o.g||.1;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+a);
 if(o.rel){g.gain.setValueAtTime(pk,t+Math.max(a,d-o.rel));}g.gain.exponentialRampToValueAtTime(.0001,t+d);
 g.connect(X.in);if(o.rev)g.connect(X.wet);if(o.dly)g.connect(X.dly);
 if(o.vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=o.vib;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*(o.vd||.005),t+(o.vdel||0)+.05);l.connect(lg);lg.connect(os.frequency);l.start(t);l.stop(t+d+.05)}
 os.start(t);os.stop(t+d+.05)}
function nz(X,t,d,o){const c=X.c,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),a=o.a||.001;s.buffer=X.nb;s.loop=true;f.type=o.ft||'highpass';f.frequency.setValueAtTime(o.f||7000,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+d);if(o.q)f.Q.value=o.q;
 s.connect(f);f.connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.g||.1,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(d,a+.01));g.connect(X.in);if(o.rev)g.connect(X.wet);s.start(t,Math.random()*.5);s.stop(t+d+.03)}
/* ---------- drums ---------- */
const DR={
 k:(X,t,v)=>vo(X,t,150,.3,{f2:45,g:.72*v}),
 ks:(X,t,v)=>vo(X,t,120,.26,{f2:48,g:.5*v,lp:900}),
 s:(X,t,v)=>{nz(X,t,.14,{f:1800,g:.22*v});vo(X,t,190,.07,{type:'triangle',g:.09*v})},
 c:(X,t,v)=>{for(let k=0;k<3;k++)nz(X,t+k*.011,k===2?.15:.03,{ft:'bandpass',f:1500,q:1.2,g:.24*v,rev:k===2})},
 n:(X,t,v)=>nz(X,t,.07,{ft:'bandpass',f:2600,q:3,g:.3*v,rev:1}),
 h:(X,t,v)=>nz(X,t,.035,{f:9000,g:.06*v}),
 oh:(X,t,v)=>nz(X,t,.16,{f:7500,g:.055*v}),
 sh:(X,t,v)=>nz(X,t,.06,{f:6500,a:.012,g:.05*v}),
 tb:(X,t,v)=>{nz(X,t,.13,{f:8500,g:.065*v});nz(X,t,.04,{ft:'bandpass',f:5200,q:4,g:.05*v})},
 sl:(X,t,v)=>{[0,.017,.036,.06].forEach((o,i)=>nz(X,t+o,.07,{ft:'bandpass',f:6800+i*450,q:2.5,g:.07*v*(i?.7:1)}))},
 wb:(X,t,v)=>vo(X,t,1250,.06,{g:.14*v}),
 tm:(X,t,v)=>{X.tmf=X.tmf===880?620:880;vo(X,t,X.tmf,.09,{g:.13*v,f0:X.tmf*1.15,gl:.01})},
 dm:(X,t,v)=>{vo(X,t,115,.38,{f2:62,g:.62*v});nz(X,t,.05,{ft:'lowpass',f:500,g:.15*v})},
 tk:(X,t,v)=>{nz(X,t,.06,{ft:'bandpass',f:3400,q:1.6,g:.3*v});vo(X,t,2100,.025,{g:.035*v})},
 ka:(X,t,v)=>nz(X,t,.035,{ft:'bandpass',f:4600,q:2,g:.16*v}),
 bo:(X,t,v)=>{vo(X,t,105,.22,{f2:62,g:.48*v});nz(X,t,.05,{ft:'bandpass',f:700,q:1,g:.13*v})},
 br:(X,t,v)=>nz(X,t,.16,{ft:'bandpass',f:3800,q:.8,a:.018,g:.09*v}),
 rm:(X,t,v)=>{nz(X,t,.03,{ft:'bandpass',f:2900,q:5,g:.22*v});vo(X,t,1750,.02,{type:'triangle',g:.05*v})},
 cr:(X,t,v)=>nz(X,t,1.4,{f:4800,g:.1*v,rev:1}),
 ld:(X,t,v)=>{vo(X,t,82,.5,{f2:52,g:.7*v});nz(X,t,.2,{ft:'lowpass',f:900,g:.18*v})},
 cy:(X,t,v)=>nz(X,t,.35,{ft:'bandpass',f:5200,q:.7,g:.11*v}),
 gs:(X,t,v)=>{nz(X,t,.22,{ft:'bandpass',f:1300,q:.6,g:.3*v,rev:1});vo(X,t,180,.08,{type:'triangle',g:.1*v})},
 tom:(X,t,v)=>vo(X,t,150,.25,{f2:90,g:.4*v}),
 ck:(X,t,v)=>{X.ckf=X.ckf===2300?1750:2300;vo(X,t,X.ckf,.03,{type:'square',g:.025*v,lp:5000})},
 hb:(X,t,v)=>{vo(X,t,58,.2,{f2:40,g:.5*v,lp:300});vo(X,t+.2,58,.18,{f2:40,g:.35*v,lp:300})}};
/* ---------- instruments: (X,t,midi,seconds,velocity) ---------- */
const IN={
 bell:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,Math.max(d,1.1),{g:.08*v,rev:1});vo(X,t,f*4,.18,{g:.016*v})},
 mbox:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,Math.max(d,.9),{g:.07*v,rev:1});vo(X,t,f*2,.3,{type:'triangle',g:.016*v})},
 piano:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,Math.max(d,.8)+.3,{type:'triangle',g:.08*v,lp:Math.min(f*5,5000),lp2:f*1.6,lpt:.6,rev:1});vo(X,t,f*2,.25,{g:.014*v})},
 ep:(X,t,m,d,v)=>{const f=mt(m),dd=Math.max(d,1);vo(X,t,f,dd,{g:.085*v,rev:1});vo(X,t,f,dd*.8,{type:'triangle',g:.02*v,det:6});vo(X,t,f*7,.08,{g:.007*v})},
 pluck:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,Math.min(Math.max(d,.35),1.2),{type:'sawtooth',g:.055*v,lp:Math.min(f*7,7000),lp2:f*1.3,lpt:.22})},
 uke:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,.45,{type:'sawtooth',g:.045*v,lp:Math.min(f*8,8000),lp2:f*2,lpt:.12})},
 banjo:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,.3,{type:'sawtooth',g:.045*v,lp:Math.min(f*10,9000),lp2:f*2,lpt:.07});vo(X,t,f*2,.08,{g:.01*v})},
 harpsi:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,.45,{type:'sawtooth',g:.038*v,lp:6000,lp2:1800,lpt:.3});vo(X,t,f*2,.2,{type:'square',g:.007*v,lp:5000})},
 oud:(X,t,m,d,v)=>{const f=mt(m),n=d>.4?Math.min(8,Math.floor(d/.09)):1;for(let i=0;i<n;i++)vo(X,t+i*.09,f,i===n-1?.5:.12,{type:'sawtooth',g:.055*v*(i?.6:1),lp:f*5,lp2:f*1.2,lpt:.25,f0:i?0:f*1.012,gl:.04,rev:i===0})},
 zheng:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,1,{type:'triangle',g:.085*v,rev:1,f0:f*1.012,gl:.05});vo(X,t,f,.12,{type:'sawtooth',g:.02*v,lp:f*6})},
 harp:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,.9,{type:'triangle',g:.045*v,rev:1});vo(X,t,f*2,.2,{g:.01*v})},
 marimba:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,.4,{g:.11*v});vo(X,t,f*4,.06,{g:.028*v})},
 steel:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,.55,{type:'triangle',g:.08*v,f0:f*1.02,gl:.03,rev:1});vo(X,t,f*2,.35,{g:.045*v,det:6});vo(X,t,f*3,.12,{g:.012*v})},
 pizz:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,.22,{type:'triangle',g:.09*v,lp:f*3})},
 flute:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.05,{g:.075*v,a:.04,rel:.08,vib:5,vd:.004,vdel:.12,rev:1});vo(X,t,f*2,d,{g:.008*v,a:.04,rel:.08});nz(X,t,.08,{ft:'bandpass',f:Math.min(f*2,9000),q:2,g:.012*v,a:.02})},
 pic:(X,t,m,d,v)=>IN.flute(X,t,m+12,d,v*.75),
 whistle:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.02,{type:'triangle',g:.065*v,a:.015,rel:.04,vib:5.5,vd:.004,vdel:.1,lp:f*4,rev:1});nz(X,t,.05,{ft:'bandpass',f:Math.min(f*2,9000),q:2,g:.01*v})},
 ney:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.08,{g:.07*v,a:.08,rel:.15,vib:4.5,vd:.006,vdel:.15,rev:1});nz(X,t,d*.7+.08,{ft:'bandpass',f:Math.min(f*1.5,9000),q:1.5,g:.02*v,a:.05})},
 pan:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.05,{g:.07*v,a:.02,rel:.1,vib:4,vd:.004,vdel:.12,rev:1});nz(X,t,.1,{ft:'bandpass',f:Math.min(f*2,9000),q:2,g:.03*v})},
 fiddle:(X,t,m,d,v)=>vo(X,t,mt(m),d+.04,{type:'sawtooth',g:.04*v,a:.03,rel:.07,lp:3200,q:.7,vib:6,vd:.006,vdel:.08,rev:1}),
 erhu:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.05,{type:'sawtooth',g:.042*v,a:.05,rel:.1,lp:2400,q:2,f0:f*.94,gl:.07,vib:5.5,vd:.012,vdel:.1,rev:1})},
 clar:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.03,{type:'square',g:.04*v,a:.025,rel:.06,lp:Math.min(f*3.5,3200),vib:5,vd:.005,vdel:.12,rev:1})},
 acc:(X,t,m,d,v)=>{[-7,7].forEach(dt=>vo(X,t,mt(m),Math.min(d,.25),{type:'sawtooth',g:.02*v,a:.01,rel:.04,lp:2200,det:dt}))},
 sax:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.05,{type:'sawtooth',g:.05*v,a:.04,rel:.12,lp:Math.min(f*2.6,2600),q:1.5,vib:5,vd:.006,vdel:.15,rev:1})},
 brass:(X,t,m,d,v)=>{[-6,6].forEach(dt=>vo(X,t,mt(m),d+.02,{type:'sawtooth',g:.032*v,a:.03,rel:.06,lp:2400,det:dt,rev:1}))},
 stab:(X,t,m,d,v)=>{[-6,6].forEach(dt=>vo(X,t,mt(m),.16,{type:'sawtooth',g:.026*v,a:.015,lp:2000,det:dt}))},
 ssaw:(X,t,m,d,v)=>{[-14,0,14].forEach(dt=>vo(X,t,mt(m),Math.max(d,.12),{type:'sawtooth',g:.02*v,a:.005,rel:.05,lp:3800,det:dt,rev:1}))},
 organ:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d,{g:.045*v,a:.02,rel:.1});vo(X,t,f*2,d,{g:.022*v,a:.02,rel:.1});vo(X,t,f,d,{type:'sawtooth',g:.016*v,a:.02,rel:.1,lp:1400,rev:1})},
 ther:(X,t,m,d,v)=>{const f=mt(m),f0=X.thf||f;X.thf=f;vo(X,t,f,d+.12,{g:.06*v,a:.08,rel:.16,f0:f0,gl:.12,vib:6,vd:.013,rev:1})},
 syn:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d+.05,{type:'sawtooth',g:.038*v,a:.01,rel:.1,lp:2800,vib:5,vd:.004,vdel:.2,dly:1,rev:1});vo(X,t,f,d,{type:'square',g:.012*v,det:-8,lp:2000,rel:.1})},
 sarp:(X,t,m,d,v)=>vo(X,t,mt(m),.16,{type:'sawtooth',g:.028*v,lp:2400,lp2:500,lpt:.15,dly:1}),
 chip:(X,t,m,d,v)=>vo(X,t,mt(m),Math.max(d*.9,.08),{type:'square',g:.03*v,lp:3500,rel:.03}),
 pad:(X,t,m,d,v)=>{[-9,9].forEach(dt=>vo(X,t,mt(m),d,{type:'sawtooth',g:.013*v,a:.5,rel:.6,lp:1000,det:dt,rev:1}))},
 str:(X,t,m,d,v)=>{[-8,8].forEach(dt=>vo(X,t,mt(m),d,{type:'sawtooth',g:.012*v,a:.3,rel:.4,lp:1800,det:dt,rev:1}))},
 /* bass */
 bass:(X,t,m,d,v)=>vo(X,t,mt(m),d,{type:'sawtooth',g:.15*v,lp:520}),
 up:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,Math.min(d,.6),{type:'triangle',g:.3*v,lp:f*4});vo(X,t,f*2,.05,{g:.04*v})},
 sub:(X,t,m,d,v)=>{const f=mt(m);vo(X,t,f,d,{g:.3*v,a:.01,rel:.05});vo(X,t,f,d,{type:'sawtooth',g:.04*v,lp:350,rel:.05})},
 synb:(X,t,m,d,v)=>vo(X,t,mt(m),d,{type:'sawtooth',g:.13*v,lp:900,lp2:250,lpt:Math.min(d,.25),q:4}),
 tuba:(X,t,m,d,v)=>vo(X,t,mt(m),Math.min(d,.3),{type:'sawtooth',g:.16*v,lp:550,a:.015})};
/* ---------- little moments ---------- */
function gliss(X,t,H,v){const ns=H.n.concat(H.n.map(n=>n+12));ns.forEach((n,i)=>IN.harp(X,t+i*.035,n+12,.8,v*.8))}
function riser(X,t,d){nz(X,t,d,{ft:'bandpass',f:400,f2:7000,q:3,a:d*.9,g:.12})}
function crackle(X,t,n,g){for(let i=0;i<n;i++)nz(X,t+Math.random()*.5,.012,{f:2500+Math.random()*4000,g:g*(.3+Math.random())})}
function firework(X,t){vo(X,t,700,.6,{f2:2600,g:.02,type:'sine'});nz(X,t+.62,.9,{ft:'lowpass',f:500,g:.3});crackle(X,t+.75,10,.06)}
function wave(X,t,d){nz(X,t,d,{ft:'lowpass',f:350,f2:1400,a:d*.45,g:.09})}
function bird(X,t){for(let i=0;i<2;i++)vo(X,t+i*.11,2600+Math.random()*500,.08,{f2:3900,g:.022})}
function ghost(X,t,d){vo(X,t,mt(69),d,{f0:mt(64),gl:d*.5,g:.035,a:d*.3,rel:d*.4,vib:4,vd:.02,rev:1})}
function howl(X,t){vo(X,t,mt(81),1.6,{f0:mt(69),gl:.5,g:.04,a:.2,rel:.8,vib:5,vd:.015,rev:1})}
function gong(X,t,v){[[1,.12,3.5],[1.48,.05,2.6],[2.03,.045,2.2],[2.74,.03,1.5],[3.8,.018,1]].forEach(([r,g,d])=>vo(X,t,98*r,d,{f0:98*r*.985,gl:.4,g:g*v,rev:1}));nz(X,t,2,{ft:'lowpass',f:1400,a:.25,g:.04*v})}
function gobble(X,t){for(let k=0;k<5;k++){const p=560*(1-k*.05);vo(X,t+k*.065,p,.06,{type:'sawtooth',f2:p*.8,g:.06,lp:1300,ft:'bandpass',q:2.5})}}
function horn(X,t){vo(X,t,370,.55,{type:'sawtooth',f0:300,gl:.2,g:.05,lp:1400,ft:'bandpass',q:2,a:.03,rel:.1});vo(X,t,555,.55,{type:'square',f0:450,gl:.2,g:.015,lp:2000,a:.03,rel:.1})}
function whistleS(X,t){vo(X,t,2700,.12,{g:.03,vib:28,vd:.03});vo(X,t+.16,2700,.12,{g:.03,vib:28,vd:.03})}
function boing(X,t){vo(X,t,260,.18,{f2:880,type:'triangle',g:.05})}
/* ---------- the themes (original melodies; Jingle Bells and Auld Lang Syne nods are short public-domain motifs) ---------- */
const TH={
 christmas:{name:'Jolly sleigh-bell shuffle',bpm:144,sw:.28,chords:['C','Am','F','G7','C','C','Dm7/G7','C'],
  mel:'G4 C5 E5 G5 A5 G5 E5 C5|A4 - C5 E5 A5 - G5 -|F5 E5 F5 A5 C6 - A5 -|G5 F5 D5 B4 G4 - . .|E5 E5 E5 - E5 E5 E5 -|E5 G5 C5 D5 E5 - - .|F5 - A5 F5 D5 E5 F5 D5|C5 - E5 G5 C6 - . .',
  lead:'bell',lead2:'flute',bass:'1...3...5...3...',bassI:'up',comp:'....x.......x...',compI:'piano',pad:'str',
  kit:{k:'x.......x.......',br:'....x.......x...',sl:'x.x.x.x.x.x.x.x.'},chill:{sl:'x...x...x...x...'},party:{tb:'....x.......x...',c:'....x.......x...'},sig:'sl'},
 newyear:{name:'Countdown house party',bpm:126,chords:['C','C/F','Am','F','C','G','Am/F','G'],
  mel:'G4 C5 - C5 E5 D5 C5 D5|E5 C5 - C5 E5 G5 A5 -|A5 - C6 - B5 A5 G5 E5|F5 - A5 - G5 F5 E5 C5|E5 G5 C6 G5 E5 G5 C6 D6|D6 - B5 - G5 A5 B5 -|C6 B5 A5 E5 F5 A5 C6 -|B5 - D6 - G5 - . .',
  lead:'bell',lead2:'ssaw',bass:'..1...1...1...1.',bassI:'synb',comp:'..x...x...x...x.',compI:'ssaw',pad:'pad',arp:'a.a.a.a.a.a.a.a.',arpI:'pluck',arpO:12,arpIn:['chill'],
  kit:{k:'x...x...x...x...',c:'....x.......x...',oh:'..x...x...x...x.',h:'.o.o.o.o.o.o.o.o'},chill:{k:'x.......x.......',h:'..o...o...o...o.'},party:{tb:'..x...x...x...x.'},
  fx(X,t,p,bar,m,spb){if(m==='chill'||m==='tense')return;const b=bar%8;if(b===7){if(p===0)riser(X,t,spb*16);if(p%2===0||p>=8)DR.s(X,t,.3+p/22)}if(b===0&&p===0)DR.cr(X,t,1);if(m==='party'&&bar%4===2&&p===8)firework(X,t)}},
 winter:{name:'Cozy music box by the fire',bpm:84,chords:['Dmaj7','Bm7','Gmaj7','A6','Dmaj7','F#m7','Em7','Asus4/A'],
  mel:'F#5 - A5 - C#6 - A5 -|D6 - C#6 B5 A5 - F#5 -|B5 - A5 G5 F#5 - D5 -|E5 - F#5 - A5 - - -|F#5 - A5 - D6 - C#6 -|C#6 - A5 - F#5 - E5 -|D5 E5 G5 - B5 - A5 -|A5 - - - . . . .',
  lead:'mbox',lead2:'piano',arp:'a.a.a.a.a.a.a.a.',arpI:'piano',arpV:.45,bass:'1.......5.......',bassI:'up',pad:'pad',padOn:1,
  kit:{ks:'x.......x.......',br:'....x.......x...',sh:'..o...o...o...o.'},chill:{sh:'..o...o...o...o.'},party:{tb:'....x.......x...',ks:'x.....x.x.......'},
  fx(X,t,p){if(Math.random()<.18)crackle(X,t,2,.025)}},
 valentine:{name:'Slow-jam romance',bpm:80,sw:.12,chords:['Fmaj7','Em7/A7','Dm7','Cm7/F7','Bbmaj7','Am7','Gm7','C7sus4/C7'],
  mel:'C6 - A5 - G5 - A5 E5|G5 - E5 D5 E5 - C#6 -|D5 F5 A5 C6 - - A5 -|G5 - Eb5 - Eb5 F5 A5 -|D6 - - C6 A5 - F5 -|E5 - G5 - C6 - A5 -|Bb5 - A5 G5 F5 - D5 -|F5 - G5 - E5 - . .',
  lead:'sax',lead2:'ep',comp:'x.......x.....x.',compI:'ep',compV:.55,bass:'1.........1...5.',bassI:'sub',pad:'str',
  kit:{ks:'x.........x.....',n:'....x.......x...',h:'o.o.o.o.o.o.o.o.'},chill:{n:'....o.......o...'},party:{sh:'.o.o.o.o.o.o.o.o',ks:'x.........x..x..'},
  fx(X,t,p,bar,m,spb,H){if(p===0&&bar%4===0&&m!=='tense')gliss(X,t,H,1)}},
 stpatrick:{name:'Irish jig',bpm:87,L:12,beat:3,mres:1,chords:['D','G','D','A','D','G','D/A','D'],
  mel:'D5 F#5 A5 A5 F#5 A5 B5 A5 F#5 E5 D5 E5|G5 B5 G5 F#5 A5 F#5 E5 F#5 G5 B5 A5 G5|F#5 A5 D6 D6 C#6 B5 A5 F#5 D5 F#5 A5 F#5|E5 F#5 G5 A5 G5 F#5 E5 C#5 A4 E5 - .|D5 F#5 A5 A5 F#5 A5 B5 A5 F#5 E5 D5 E5|G5 A5 B5 D6 B5 G5 A5 F#5 D5 E5 F#5 G5|A5 F#5 D5 F#5 A5 D6 C#6 B5 A5 G5 F#5 E5|D5 - - D5 F#5 A5 D6 - - . . .',
  lead:'whistle',lead2:'fiddle',comp:'x..x..x..x..',compI:'pluck',strum:.012,compV:.7,bass:'1.....5.....',bassI:'up',
  kit:{bo:'X.ox.oX.ox.o'},chill:{bo:'x.....x.....'},party:{tb:'...x.....x..',c:'...x.....x..'},sig:'bo'},
 easter:{name:'Bunny-hop bounce',bpm:120,chords:['G','C','D','G','Em','C','A7/D7','G'],
  mel:'G5 . B5 . D6 . B5 G5|E5 . G5 . C6 - B5 A5|F#5 . A5 . D6 C6 B5 A5|G5 - B5 - G5 - . .|E5 F#5 G5 . B5 . E6 .|E6 D6 C6 . G5 . E5 .|E5 G5 A5 C#6 D6 C6 A5 F#5|G5 . D5 . G5 - . .',
  lead:'bell',lead2:'pizz',comp:'..x...x...x...x.',compI:'pizz',bass:'1...5...1...5...',bassI:'up',pad:'str',
  kit:{ks:'x.......x.......',n:'....x.......x...',wb:'......x.......x.',h:'o.o.o.o.o.o.o.o.'},chill:{wb:'......x.......x.'},party:{tb:'..x...x...x...x.',k:'x...x...x...x...'},
  fx(X,t,p,bar,m){if(m!=='tense'&&p===14&&bar%2===1)boing(X,t)}},
 spring:{name:'Bright marimba morning',bpm:112,chords:['D','A','Bm','G','D','A','G/A','D'],
  mel:'F#5 - A5 - D6 - C#6 B5|C#6 - - A5 E5 - A5 -|B5 - D6 - F#6 - E6 D6|D6 - B5 - G5 - - -|A5 B5 A5 F#5 D5 - F#5 A5|E6 - C#6 - A5 - B5 C#6|D6 - B5 G5 C#6 - A5 E5|D6 - - - . . . .',
  lead:'flute',lead2:'marimba',arp:'a.a.a.a.a.a.a.a.',arpI:'marimba',arpV:.55,bass:'1.....1.5.......',bassI:'up',pad:'str',
  kit:{ks:'x.......x.......',sh:'oxoxoxoxoxoxoxox',n:'....x.......x...'},chill:{sh:'..o...o...o...o.'},party:{c:'....x.......x...',tb:'..x...x...x...x.'},
  fx(X,t,p,bar,m){if(m!=='tense'&&p===6&&bar%2===0&&Math.random()<.7)bird(X,t)}},
 ramadan:{name:'Hijaz with darbuka (maqsum)',bpm:100,chords:['D','D','Cm','D','Gm','Cm','Eb/D','D'],
  mel:'D5 Eb5 F#5 - G5 F#5 Eb5 D5|F#5 G5 A5 - Bb5 A5 G5 F#5|G5 F#5 Eb5 D5 C5 D5 Eb5 -|D5 - - - F#5 Eb5 D5 -|G5 A5 Bb5 - A5 G5 F#5 G5|C6 - Bb5 A5 G5 - Eb5 -|Eb5 - G5 Bb5 A5 G5 F#5 Eb5|D5 - - - . . . .',
  lead:'oud',lead2:'ney',bass:'1.......1...5...',bassI:'up',pad:'str',
  kit:{dm:'x.......x.......',tk:'..x...x.....x...',ka:'...o.o....o..o.o',tb:'o.o.o.o.o.o.o.o.'},chill:{dm:'x.......x.......',tk:'......o.....o...'},party:{c:'....x.......x...',ka:'.o.o.o.o.o.oxo.o'},sig:'tk',
  fx(X,t,p,bar,m){if(m==='chill'&&p===0&&bar%2===0)IN.sub(X,t,38,3,.5)}},
 mothers:{name:'Gentle waltz for Mom',bpm:100,L:12,chords:['G','Em','C','D','G','Bm','C/D','G'],
  mel:'D5 - G5 - B5 -|B5 - A5 G5 E5 -|E5 - G5 - C6 -|B5 - A5 - - -|D5 - G5 - B5 D6|D6 - B5 - F#5 -|E5 G5 C6 B5 A5 F#5|G5 - - - - -',
  lead:'piano',lead2:'flute',comp:'....x...x...',compI:'piano',compV:.5,bass:'1...........',bassI:'up',pad:'str',padOn:1,
  kit:{br:'....o...o...'},chill:{},party:{tb:'....x...x...',ks:'x...........'},
  fx(X,t,p,bar,m,spb,H){if(p===0&&bar%4===0&&m!=='tense')gliss(X,t,H,.9)}},
 summer:{name:'Steel-drum calypso',bpm:118,chords:['F','C','Bb','C','F','Dm','Bb/C','F'],
  mel:'A5 . C6 . A5 C6 . F5|G5 . E5 G5 . C6 - .|D6 . Bb5 . F5 G5 Bb5 .|C6 - G5 . E5 - . .|A5 C6 . A5 F5 . G5 A5|F5 . D5 F5 . A5 - .|Bb5 . D6 . C6 . E6 .|F6 - C6 . A5 - . .',
  lead:'steel',lead2:'marimba',comp:'..x...x...x...x.',compI:'uke',bass:'1..1..5.1..1..5.',bassI:'up',pad:'str',
  kit:{k:'x...x...x...x...',sh:'oxoxoxoxoxoxoxox',rm:'...x..x....x..x.'},chill:{sh:'..o...o...o...o.',rm:'...o..o....o..o.'},party:{tb:'..x...x...x...x.',c:'....x.......x...'},
  fx(X,t,p,bar,m){if(m==='party'&&bar%4===3&&p===12)whistleS(X,t)}},
 beach:{name:'Tropical house with waves',bpm:102,chords:['Gm7','Ebmaj7','Bb','F','Gm7','Ebmaj7','Cm7/F','Bb'],
  mel:'D6 - Bb5 - A5 G5 - F5|G5 - Bb5 - D6 - - -|D6 C6 Bb5 - F5 - D5 -|C6 - A5 F5 G5 A5 - -|Bb5 - D6 - F6 - D6 -|Eb6 - D6 - Bb5 - G5 -|Eb5 G5 Bb5 - A5 - C6 -|Bb5 - - - . . . .',
  lead:'pan',lead2:'steel',comp:'..x...x...x...x.',compI:'uke',bass:'1.....1.....5...',bassI:'sub',pad:'pad',
  kit:{ks:'x...x...x...x...',n:'....x.......x...',sh:'.o.o.o.o.o.o.o.o'},chill:{sh:'..o...o...o...o.'},party:{c:'....x.......x...',tb:'..x...x...x...x.'},
  fx(X,t,p,bar,m,spb){if(m!=='tense'&&p===0&&bar%2===0)wave(X,t,spb*28)}},
 july4:{name:'Stars-and-stripes march',bpm:120,chords:['Bb','Eb','F7','Bb','Bb','Eb','C7/F7','Bb'],
  mel:'F5 - D5 F5 Bb5 - F5 -|G5 - Eb5 G5 C6 - Bb5 -|A5 - F5 A5 C6 - Eb6 -|D6 - Bb5 - F5 - . .|D5 F5 Bb5 F5 D6 - Bb5 -|Eb6 - G5 - C6 - Bb5 -|E5 G5 Bb5 C6 A5 F5 Eb5 C5|Bb4 - D5 - Bb5 - . .',
  lead:'brass',lead2:'pic',comp:'..x...x...x...x.',compI:'stab',compV:.8,bass:'1.......5.......',bassI:'tuba',pad:'str',
  kit:{k:'x.......x.......',s:'X..xX.x.X..xX.xx'},chill:{rm:'x.......x.......'},party:{cy:'x.......x.......'},sig:'s',
  fx(X,t,p,bar,m){if(m==='party'&&bar%4===3&&p===0)firework(X,t)}},
 fall:{name:'Warm stomp-and-clap folk',bpm:96,chords:['Em','C','G','D','Em','C','G/D','Em'],
  mel:'B4 - E5 - G5 - F#5 E5|G5 - E5 - C5 - D5 E5|D5 - G5 - B5 - A5 G5|F#5 - A5 - D5 - - -|G5 - B5 - E6 - D6 B5|C6 - B5 - G5 - E5 -|D5 G5 B5 - A5 F#5 D5 -|E5 - - - . . . .',
  lead:'piano',lead2:'bell',arp:'a.a.a.a.a.a.a.a.',arpI:'pluck',arpV:.7,bass:'1.......5...1...',bassI:'up',pad:'str',
  kit:{k:'x.......x.......',c:'....x.......x...',tb:'..o...o...o...o.'},chill:{sh:'..o...o...o...o.'},party:{k:'x.....x.x.......',tb:'..x...x...x...x.'}},
 thanksgiving:{name:'Front-porch hoedown',bpm:116,sw:.15,chords:['G','C','G','D','G','C','D7','G'],
  mel:'D5 G5 G5 A5 B5 G5 B5 D6|E6 D6 C6 - E5 G5 C6 -|B5 A5 G5 B5 D6 - B5 G5|A5 - F#5 - D5 E5 F#5 A5|G5 - B5 D6 G6 - D6 B5|C6 E6 C6 G5 E5 G5 C6 -|D6 C6 A5 F#5 D5 F#5 A5 C6|B5 - G5 - G4 - . .',
  lead:'fiddle',lead2:'banjo',arp:'aaaaaaaaaaaaaaaa',arpI:'banjo',arpV:.45,arpSeq:[0,2,3,1,4,3,2,4],comp:'....x.......x...',compI:'pluck',bass:'1...5...1...5...',bassI:'up',pad:'str',
  kit:{ks:'x.......x.......',br:'....x.......x...',sh:'x.x.x.x.x.x.x.x.'},chill:{sh:'..o...o...o...o.'},party:{c:'....x.......x...',k:'x...x...x...x...'},
  fx(X,t,p,bar,m){if(m==='party'&&bar%8===7&&p===8)gobble(X,t)}},
 halloween:{name:'Monster organ swing with theremin',bpm:120,sw:.25,chords:['Am','F','Dm','E7','Am','F','Dm/E7','Am'],
  mel:'E5 - - - - - F5 E5|C6 - - - A5 - - -|D5 - F5 - A5 - C6 -|B5 - - G#5 - - E5 -|A5 - - C6 - - E6 -|F6 - - E6 - - C6 -|D6 - A5 - G#5 - B5 -|A5 - - - - - . .',
  lead:'ther',lead2:'harpsi',comp:'..x...x...x...x.',compI:'organ',compD:1.5,compV:.7,arp:'a.a.a.a.a.a.a.a.',arpI:'mbox',arpO:12,arpV:.4,arpIn:['chill'],bass:'1...5...8...5...',bassI:'up',pad:'organ',
  kit:{k:'x.......x.......',n:'....x.......x...',h:'o.o.o.o.o.o.o.o.'},chill:{},party:{tom:'..........x.x.x.',tb:'..x...x...x...x.'},sig:'hb',
  fx(X,t,p,bar,m){if(m==='chill'&&bar%4===2&&p===0)ghost(X,t,2.5);if(m==='party'&&bar%8===7&&p===0)howl(X,t)}},
 hanukkah:{name:'Klezmer freygish dance',bpm:132,chords:['D','Cm','D','D','Gm','Cm','D7','Gm'],
  mel:'A5 Bb5 A5 G5 F#5 G5 A5 -|G5 - Eb5 - C5 Eb5 G5 -|F#5 G5 A5 Bb5 A5 G5 F#5 Eb5|D5 - - - D5 Eb5 F#5 A5|Bb5 - A5 G5 D5 - G5 A5|Eb6 D6 C6 Bb5 G5 - C6 -|D6 C6 Bb5 A5 F#5 - A5 -|G5 - - - D5 - - -',
  lead:'clar',lead2:'fiddle',comp:'..x...x...x...x.',compI:'acc',bass:'1...5...1...5...',bassI:'tuba',pad:'str',
  kit:{ks:'x...x...x...x...',tb:'..x...x...x...x.'},chill:{tb:'..o.......o.....'},party:{tb:'X..X..X.X..X..X.',c:'....x.......x...'},sig:'tb'},
 lunar:{name:'Pentatonic erhu, guzheng and gong',bpm:116,chords:['G','Em','C','D','G','Em','Am/D','G'],
  mel:'G5 - A5 G5 E5 - D5 -|E5 - G5 - A5 B5 A5 -|G5 - E5 - D5 - E5 G5|A5 - - B5 A5 G5 E5 -|D6 - B5 - A5 B5 D6 -|E6 - D6 B5 A5 - G5 -|A5 B5 A5 E5 D5 E5 A5 -|G5 - - - . . . .',
  lead:'erhu',lead2:'zheng',arp:'a.a.a.a.a.a.a.a.',arpI:'zheng',arpO:12,arpV:.4,bass:'1.......5.......',bassI:'up',pad:'str',
  kit:{ks:'x.......x.......',tm:'..x...x...x...x.'},chill:{tm:'......x.......x.'},party:{ld:'X.x.X.x.X.xxX.x.',cy:'x...x...x...x...'},sig:'tm',
  fx(X,t,p,bar,m){if(p===0&&(bar%8===0||(m==='chill'&&bar%4===0)))gong(X,t,m==='tense'?.5:1)}},
 birthday:{name:'Birthday party bounce',bpm:124,chords:['F','Dm','Bb','C','F','Am','Bb/C','F'],
  mel:'A5 . A5 C6 . A5 F5 .|F5 . F5 A5 . F5 D5 .|D6 . D6 C6 Bb5 . F5 .|G5 . E5 . G5 C6 - .|A5 C6 F6 . C6 . A5 C6|E6 . C6 . A5 . C6 E6|D6 . Bb5 . C6 . E6 .|F6 - C6 . F5 . . .',
  lead:'bell',lead2:'chip',comp:'x..x..x.x..x..x.',compI:'uke',bass:'1..8..1.1..8..1.',bassI:'bass',pad:'str',
  kit:{k:'x...x...x...x...',c:'....x.......x...',h:'..x...x...x...x.'},chill:{h:'..o...o...o...o.'},party:{tb:'oxoxoxoxoxoxoxox'},
  fx(X,t,p,bar,m){if(m==='party'&&bar%8===7&&p===8)horn(X,t)}},
 neon:{name:'Dreamy synthwave drive',bpm:100,chords:['Am','Fmaj7','C','G','Am','Fmaj7','Dm7','Esus4/E'],
  mel:'E5 - - - A5 - B5 C6|C6 - - - A5 - E5 -|G5 - - - E5 - G5 C6|D6 - - - B5 - G5 -|E5 - - - A5 - C6 E6|E6 - - - C6 - A5 -|F5 - A5 - C6 - D6 -|A5 - - - G#5 - - -',
  lead:'syn',lead2:'ep',arp:'aaaaaaaaaaaaaaaa',arpI:'sarp',arpO:12,arpV:.6,bass:'1.8.1.8.1.8.1.8.',bassI:'synb',pad:'pad',padOn:1,
  kit:{k:'x.......x.......',gs:'....x.......x...',h:'oxoxoxoxoxoxoxox'},chill:{h:'..o...o...o...o.'},party:{k:'x...x...x...x...',c:'....x.......x...'}}};
/* ---------- compile ---------- */
const VEL={x:.75,X:1,o:.4};
function compile(T){T.L=T.L||16;T.beat=T.beat||4;T.mres=T.mres||2;T.vol=T.vol||1;
 T.ch=T.chords.map(c=>c.split('/').map(chord));
 const toks=T.mel.replace(/\|/g,' ').trim().split(/\s+/),per=T.L/T.mres;T.ev=[];for(let b=0;b<8;b++)T.ev.push({});
 toks.forEach((k,i)=>{const m=nm(k);if(m==null)return;let n=1;while(toks[i+n]==='-')n++;const b=Math.floor(i/per);if(b<8)T.ev[b][(i%per)*T.mres]=[m,n*T.mres]});
 T.ok=toks.length===8*per;
 const bl=(T.bass||'').length?T.bass:'1'+'.'.repeat(T.L-1);T.bassLen=[];for(let p=0;p<T.L;p++){let n=1;while(p+n<T.L&&bl[p+n]==='.'&&n<8)n++;T.bassLen.push(n)}T.bass=bl;
 if(!T.tense){const k='x'+'.'.repeat(T.beat-1),pat=k.repeat(T.L/T.beat);T.tense={ks:pat}}
 return T}
Object.entries({"christmas": 1.06, "newyear": 1.03, "winter": 1.46, "valentine": 0.5, "stpatrick": 1.11, "easter": 1.38, "spring": 1.17, "ramadan": 1.46, "mothers": 1.84, "summer": 1.0, "beach": 0.5, "july4": 1.45, "fall": 1.4, "thanksgiving": 1.53, "halloween": 1.06, "hanukkah": 1.35, "lunar": 1.46, "birthday": 1.07, "neon": 1.51}).forEach(([k,v])=>{TH[k].vol=v});Object.values(TH).forEach(compile);
function bassNote(H,ch){const b=H.b,iv=H.iv;return ch==='1'?b:ch==='3'?b+iv[1]:ch==='5'?b+iv[2]:ch==='8'?b+12:ch==='6'?b+9:ch==='7'?b+10:b}
let CUR=null;
/* ---------- one tick ---------- */
function step(c,out,s,t,spb,mode,scale){const T=CUR;if(!T||!c||!out)return;api.ticks++;try{
 const X=bus(c,out),L=T.L,p=s%L,bar=Math.floor(s/L),b8=bar%8,cyc=Math.floor(bar/8)%2;
 const gv=T.vol*(scale||1)*(mode==='chill'?1.4:mode==='tense'?1.3:1);if(X.g!==gv){X.in.gain.setValueAtTime(gv,t);X.g=gv}
 const dt=Math.min(1.9,spb*3);if(Math.abs(X.dt-dt)>.002&&X.dly.delayTime){X.dly.delayTime.setValueAtTime(dt,t);X.dt=dt}
 const m=mode==='chill'||mode==='tense'||mode==='party'?mode:'play';
 if(T.sw&&L===16&&p%4===2)t+=T.sw*spb*2;
 const hv=T.ch[b8],seg=L/hv.length,hi=Math.min(hv.length-1,Math.floor(p/seg)),H=hv[hi],hStart=p%seg===0;
 /* drums */
 const kit=m==='chill'?T.chill:m==='tense'?T.tense:(m==='party'?Object.assign({},T.kit,T.party):T.kit);
 for(const v in kit){const ch=kit[v][p];if(ch&&ch!=='.'&&DR[v])DR[v](X,t,VEL[ch]||.7)}
 if(m==='party'&&p===0&&bar%4===0)DR.cr(X,t,.8);
 /* bass */
 if(m==='tense'){if(p%2===0)IN.bass(X,t,H.b,spb*1.6,.8)}
 else if(m==='chill'){if(hStart)IN[T.bassI||'bass'](X,t,H.b,spb*Math.min(seg,8)*.9,.75)}
 else{const ch=T.bass[p];if(ch&&ch!=='.')IN[T.bassI||'bass'](X,t,bassNote(H,ch),spb*T.bassLen[p]*.9,m==='party'?1.05:1)}
 /* pad */
 if(T.pad&&hStart&&(m==='chill'||m==='tense'||T.padOn))H.n.forEach(n=>IN[T.pad](X,t,n+(m==='tense'?-12:0),spb*seg,m==='tense'?.7:1));
 /* comp (chord stabs or strums) */
 if(T.comp&&(m==='play'||m==='party')){const ch=T.comp[p];if(ch&&ch!=='.'){const I=IN[T.compI||'pluck'],d=spb*(T.compD||2),v=(T.compV||.6)*(ch==='X'?1.25:1);H.n.forEach((n,i)=>I(X,t+i*(T.strum||0),n,d,v))}}
 /* arpeggio */
 const arpOn=T.arp&&(T.arpIn||['chill','play','party']).includes(m);
 if(arpOn&&T.arp[p]==='a'){const tones=H.n.concat(H.n.map(n=>n+12)),k=Math.floor(p/(T.arp.indexOf('a',1)||1)),seq=T.arpSeq,idx=seq?seq[k%seq.length]:k%tones.length;
  IN[T.arpI||'pluck'](X,t,tones[idx%tones.length]+(T.arpO||0),spb*2,(T.arpV||.5)*(m==='chill'?.8:1))}
 /* tense ostinato */
 if(m==='tense'&&p%2===0){const tones=H.n,o=[0,2,1,2][(p/2)%4];IN[T.tI||T.arpI||'pluck'](X,t,tones[o%tones.length]+12,spb*1.5,.45);if(p%T.beat===0)DR.ck(X,t,.8);if(T.sig&&p%T.beat===T.beat/2&&DR[T.sig])DR[T.sig](X,t,.35)}
 /* melody */
 const e=T.ev[b8][p];
 if(e&&m!=='tense'&&!(m==='chill'&&cyc===1)){const d=spb*e[1]*.92;
  const lead=(cyc===1&&T.lead2&&m!=='chill')?T.lead2:T.lead;IN[lead](X,t,e[0],d,m==='chill'?.75:m==='party'?1.1:1);
  if(m==='party'&&T.lead2){const o=lead===T.lead?T.lead2:T.lead,up=e[0]<84?12:0;IN[o](X,t,e[0]+(o==='ther'?0:up),d,.45)}}
 if(T.fx)T.fx(X,t,p,bar,m,spb,H)}catch(err){}}
const api=window.TGM={themes:TH,IN,DR,step,ticks:0,
 set(k){CUR=TH[k]||null;return CUR},get cur(){return CUR},
 bpm(){return CUR?CUR.bpm:120}};
/* ---------- adapters: plug the engine into each page's own music engine ---------- */
api.install=function(k){if(!api.set(k))return'none';const T=CUR,w=window,SUS={clue:1,think:1,epic:1};let how='none';
 try{
 /* 1) tg-shell.js and the old inline copies: replace beat(), pin the tempo */
 if(typeof beat==='function'&&typeof STYLES==='object'&&typeof A==='object'&&A&&'mode' in A){
  STYLES['tg_'+k]={bpm:T.bpm,prog:[[60,64,67]],bass:[48],mel:[0],lead:'triangle'};
  try{setStyle=function(){A.style=STYLES['tg_'+k];A.bpm=T.bpm}}catch(e){}A.style=STYLES['tg_'+k];A.bpm=T.bpm;
  beat=function(s,t,spb){if(A.ctx&&A.mus)step(A.ctx,A.mus,s,t,spb,A.mode,1)};how='shell'}
 /* 2) Family Feud and Balloon Pop: own play(), A.bpm */
 else if(typeof play==='function'&&typeof A==='object'&&A&&'bpm' in A&&/A\.mus/.test(String(play))){
  A.bpm=T.bpm;play=function(s,t,spb){if(!A.on||A.mode==='off'||!A.ctx)return;step(A.ctx,A.mus,s,t,spb,A.mode==='party'?'party':'play',1)};how='play'}
 /* 3) Jeopardy: suspense moods stay as they are, the groove becomes the theme */
 else if(typeof play16==='function'&&typeof A==='object'&&A&&typeof music==='function'){
  const o16=play16,om=music;
  play16=function(s,t,spb){const m=A.mode;if(SUS[m])return o16(s,t,spb);if(!A.on||m==='off'||!A.ctx)return;step(A.ctx,A.mus,s,t,spb,m==='party'?'party':'play',.85)};
  music=function(m){const r=om.apply(this,arguments);if(!SUS[m])A.bpm=T.bpm*(m==='party'?1.06:1);return r};how='jeopardy'}
 /* 4) Imposter: vote suspense stays, groove and talk become the theme */
 else if(typeof mSched==='function'&&typeof mMode==='string'){
  const oS=mSched;
  mSched=function(){if(mMode==='vote')return oS();if(!mac)return;const spb=60/(T.bpm*(mMode==='talk'?1.12:1))/4;while(mNext<mac.currentTime+.2){step(mac,mBus,mStep,mNext,spb,mMode==='talk'?'tense':'play',.4);mNext+=spb;mStep++}};how='imposter'}
 /* 5) Hub house music: route the house engine to silence, play the theme into its volume control */
 else if(w.TGHouse)how=hookHouse();
 }catch(e){how='error:'+e.message}
 api.how=how;return how};
function hookHouse(){const C0=window.AudioContext||window.webkitAudioContext;if(!C0)return'none';const P=C0.prototype;
 function H(){const c=new C0(...arguments);try{watch(c)}catch(e){}return c}H.prototype=P;
 try{window.AudioContext=H;if(window.webkitAudioContext)window.webkitAudioContext=H}catch(e){return'none'}
 function watch(c){let seq=0,master=null;const wrap=(name,fn)=>{const o=c[name];c[name]=function(){const n=o.apply(c,arguments);try{fn(n)}catch(e){}return n}};
  ['createOscillator','createBiquadFilter','createBufferSource'].forEach(nm=>wrap(nm,()=>{seq++}));
  wrap('createGain',n=>{if(seq===0)master=n;seq++});
  wrap('createDynamicsCompressor',n=>{if(seq===1&&master){const own=n.connect;n.connect=function(d){if(d===master){run(c,master);return d}return own.apply(n,arguments)}}seq++})}
 function run(c,master){let st=0,next=0,lastOn=false;
  const css=document.createElement('style');css.textContent='body.tgHouse.hmBeat h1{animation:none!important}body.tgHouse.tgBeat h1{animation:tgPulse .42s ease-out!important}@keyframes tgPulse{0%{transform:scale(1.035)}100%{transform:scale(1)}}';document.head.appendChild(css);document.body.classList.add('tgHouse');
  setInterval(()=>{const on=window.TGHouse&&window.TGHouse.on&&c.state==='running';if(!on){lastOn=false;return}
   const spb=60/CUR.bpm/4;if(!lastOn||next<c.currentTime){next=c.currentTime+.08;lastOn=true}
   while(next<c.currentTime+.15){step(c,master,st,next,spb,'play',1.35);if(st%CUR.beat===0){const d=(next-c.currentTime)*1000;setTimeout(()=>{const b=document.body;b.classList.remove('tgBeat');void b.offsetWidth;b.classList.add('tgBeat')},Math.max(0,d))}next+=spb;st++}},25)}
 return'house'}
})();
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
function applyMusic(){try{if(window.TGM&&key!=='classic'&&TGM.install(key)!=='none')return}catch(e){}try{if(typeof STYLES==='undefined'||typeof setStyle!=='function'||!th[4])return;Object.assign(STYLES,MORE);const orig=setStyle;setStyle=function(n){orig(th[4])};setStyle(th[4])}catch(e){}}
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
