'use strict';

/* ── Audio ─────────────────────────────────── */
let audioCtx=null;
function getAC(){if(!audioCtx)try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}return audioCtx;}
function playTone(freq=520,dur=0.08,type='sine',gain=0.12){
  try{const ctx=getAC();if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(gain,ctx.currentTime+0.01);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+dur);o.start(ctx.currentTime);o.stop(ctx.currentTime+dur);}catch(e){}
}
function sfxAdd(){playTone(660,.1,'sine');setTimeout(()=>playTone(880,.1,'sine'),80);}
function sfxComplete(){playTone(540,.08,'sine');setTimeout(()=>playTone(720,.12,'sine'),70);setTimeout(()=>playTone(900,.15,'sine'),140);}
function sfxDelete(){playTone(300,.12,'sawtooth');}
function sfxUndo(){playTone(480,.1,'sine');setTimeout(()=>playTone(360,.1,'sine'),80);}

let alarmInterval=null;
function startAlarmSound(){stopAlarmSound();function beep(){playTone(880,.15,'square',.25);setTimeout(()=>playTone(660,.15,'square',.2),180);setTimeout(()=>playTone(880,.15,'square',.25),360);}beep();alarmInterval=setInterval(beep,700);}
function stopAlarmSound(){if(alarmInterval){clearInterval(alarmInterval);alarmInterval=null;}}

/* ── Per-Task Alarm Watcher ────────────────── */
// Checks every 10s if any task's alarmAt has passed
function startTaskAlarmWatcher(){
  setInterval(()=>{
    const now=Date.now();
    state.tasks.forEach(task=>{
      if(task.alarmAt && !task.alarmFired && now>=task.alarmAt){
        task.alarmFired=true;
        saveTasks(state.tasks);
        fireTaskAlarm(task);
      }
    });
  },10000);
}
function fireTaskAlarm(task){
  startAlarmSound();
  // show alarm overlay with task name
  const ov=document.getElementById('alarm-overlay');
  if(ov){
    const title=ov.querySelector('.alarm-title');
    const sub=ov.querySelector('.alarm-subtitle');
    if(title)title.textContent='Task Alarm!';
    if(sub)sub.innerHTML=`Reminder for:<br><strong style="color:var(--text-accent)">${escapeHtml(task.title)}</strong>`;
    ov.classList.add('show');
  }
  spawnMascot(`Reminder: ${task.title.slice(0,20)}...`);
  showToast(`Alarm: "${task.title}"`, 'warning', 8000);
  // Update task card badge
  rerenderList();
}

/* ── Toast ─────────────────────────────────── */
function showToast(msg,type='info',dur=3000){
  const c=document.getElementById('toast-container');
  const ic={success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>',error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>',warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16Z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>'};
  const t=document.createElement('div');t.className=`toast toast-${type}`;t.innerHTML=`${ic[type]||ic.info}<span class="toast-text">${msg}</span>`;c.appendChild(t);
  setTimeout(()=>{t.classList.add('hiding');t.addEventListener('animationend',()=>t.remove(),{once:true});},dur);
}

/* ── Storage ───────────────────────────────── */
const STORE_KEY='taskflow_tasks_v2';
function loadTasks(){try{const r=localStorage.getItem(STORE_KEY);if(r)return JSON.parse(r);}catch(e){}return getDefaultTasks();}
function saveTasks(t){try{localStorage.setItem(STORE_KEY,JSON.stringify(t));}catch(e){}}
function getDefaultTasks(){
  return[
    {id:uid(),title:'Design new landing page',category:'work',priority:'high',dueDate:offsetDate(2),completed:false,createdAt:Date.now()-400000,order:0},
    {id:uid(),title:'Read chapter 3 of Atomic Habits',category:'study',priority:'medium',dueDate:offsetDate(5),completed:false,createdAt:Date.now()-300000,order:1},
    {id:uid(),title:'Morning run 5km',category:'health',priority:'medium',dueDate:offsetDate(1),completed:true,createdAt:Date.now()-200000,order:2},
    {id:uid(),title:'Pay utility bills',category:'finance',priority:'high',dueDate:offsetDate(-1),completed:false,createdAt:Date.now()-100000,order:3},
    {id:uid(),title:'Call mom',category:'personal',priority:'low',dueDate:'',completed:false,createdAt:Date.now()-50000,order:4},
  ];
}
function offsetDate(d){const x=new Date();x.setDate(x.getDate()+d);return x.toISOString().split('T')[0];}
function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36);}

/* ── State ─────────────────────────────────── */
const state={tasks:loadTasks(),filter:'all',category:'all',priority:'all',sort:'order',search:'',theme:localStorage.getItem('taskflow_theme')||'dark'};

/* ── User Profile ──────────────────────────── */
const userProfile={
  name:localStorage.getItem('tf_user_name')||'Task Master',
  emoji:localStorage.getItem('tf_user_emoji')||'🚀',
  device:localStorage.getItem('tf_device')||'pc',
  emojiOpen:false,
};
function saveProfile(){localStorage.setItem('tf_user_name',userProfile.name);localStorage.setItem('tf_user_emoji',userProfile.emoji);localStorage.setItem('tf_device',userProfile.device);}
function applyDeviceView(){document.body.classList.toggle('phone-mode',userProfile.device==='phone');}
function phoneTime(){const n=new Date();return `${n.getHours()}:${String(n.getMinutes()).padStart(2,'0')}`;}

/* ── Config ────────────────────────────────── */
const CATEGORIES=[
  {id:'all',label:'All',icon:'layers',color:'#8b5cf6'},
  {id:'work',label:'Work',icon:'briefcase',color:'#7c3aed'},
  {id:'personal',label:'Personal',icon:'user',color:'#f43f5e'},
  {id:'study',label:'Study',icon:'book-open',color:'#06b6d4'},
  {id:'health',label:'Health',icon:'heart',color:'#10b981'},
  {id:'finance',label:'Finance',icon:'dollar-sign',color:'#f59e0b'},
  {id:'other',label:'Other',icon:'more-horizontal',color:'#a855f7'},
];
const PRIORITIES=[{id:'low',label:'Low',color:'#10b981'},{id:'medium',label:'Medium',color:'#f59e0b'},{id:'high',label:'High',color:'#f43f5e'}];
function getCat(id){return CATEGORIES.find(c=>c.id===id)||CATEGORIES[0];}

/* ── Timer ─────────────────────────────────── */
const timer={total:0,remaining:0,running:false,panelOpen:false,interval:null,presetMins:25};
const PRESETS=[{l:'5m',m:5},{l:'15m',m:15},{l:'25m',m:25},{l:'45m',m:45},{l:'1h',m:60}];
function timerSet(mins){if(timer.running)timerPause();timer.total=mins*60;timer.remaining=timer.total;timer.presetMins=mins;updateTimerUI();}
function timerStart(){if(timer.remaining<=0||timer.running)return;timer.running=true;timer.interval=setInterval(()=>{timer.remaining--;updateTimerUI();if(timer.remaining<=0)timerAlarm();},1000);updateTimerUI();}
function timerPause(){timer.running=false;if(timer.interval){clearInterval(timer.interval);timer.interval=null;}updateTimerUI();}
function timerReset(){timerPause();timer.remaining=timer.total;updateTimerUI();}
function timerAlarm(){timerPause();startAlarmSound();document.getElementById('alarm-overlay')?.classList.add('show');spawnMascot('Time is up! Great focus!');}
function fmtTime(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function updateTimerUI(){
  const fab=document.getElementById('timer-fab');if(!fab)return;
  fab.querySelector('.timer-fab-time').textContent=fmtTime(timer.remaining);
  fab.className='timer-fab'+(timer.running?' running':'')+(timer.remaining>0&&timer.remaining<=10&&timer.running?' urgent':'');
  const fill=document.getElementById('timer-ring-fill');
  if(fill){const R=54,C=2*Math.PI*R;fill.setAttribute('stroke-dasharray',C);fill.setAttribute('stroke-dashoffset',C*(1-(timer.total>0?timer.remaining/timer.total:1)));}
  const rt=document.getElementById('timer-ring-time');if(rt)rt.textContent=fmtTime(timer.remaining);
  const rl=document.getElementById('timer-ring-label');if(rl)rl.textContent=timer.running?'running':timer.remaining===0?'done':'paused';
  document.querySelectorAll('.timer-preset-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.mins)===timer.presetMins));
  const sb=document.getElementById('timer-start-btn'),pb=document.getElementById('timer-pause-btn');
  if(sb)sb.style.display=timer.running?'none':'flex';
  if(pb)pb.style.display=timer.running?'flex':'none';
}

/* ── Mascot ────────────────────────────────── */
const MSGS=['Keep going!','You are on fire!','Stay focused!','Great work!','Time to work!','Lets boost!'];
let mascotTO=null;
function spawnMascot(msg){
  if(mascotTO)clearTimeout(mascotTO);
  let s=document.getElementById('mascot-stage');
  if(!s){s=document.createElement('div');s.id='mascot-stage';s.className='mascot-stage';document.body.appendChild(s);}
  s.innerHTML='';
  const m=document.createElement('div');m.className='mascot';
  m.innerHTML=mascotSVG();
  const b=document.createElement('div');b.className='mascot-bubble';b.textContent=msg||MSGS[Math.floor(Math.random()*MSGS.length)];
  m.appendChild(b);s.appendChild(m);
  requestAnimationFrame(()=>{m.classList.add('walk-in');setTimeout(()=>b.classList.add('show'),1400);mascotTO=setTimeout(()=>{b.classList.remove('show');s.innerHTML='';},5000);});
}
function mascotSVG(){return `<svg viewBox="0 0 90 130" xmlns="http://www.w3.org/2000/svg" width="90" height="130"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#a855f7"/></linearGradient><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs><ellipse cx="45" cy="127" rx="22" ry="4" fill="rgba(0,0,0,0.2)"/><g class="mascot-body-group"><g class="mascot-leg-l" style="transform-origin:40px 95px"><rect x="33" y="95" width="12" height="22" rx="6" fill="url(#bg)"/><rect x="28" y="113" width="18" height="8" rx="4" fill="#4c1d95"/></g><g class="mascot-leg-r" style="transform-origin:50px 95px"><rect x="45" y="95" width="12" height="22" rx="6" fill="url(#bg)"/><rect x="44" y="113" width="18" height="8" rx="4" fill="#4c1d95"/></g><rect x="22" y="55" width="46" height="45" rx="14" fill="url(#bg)"/><text x="45" y="82" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.7)">+</text><g class="mascot-arm-l" style="transform-origin:22px 62px"><rect x="8" y="60" width="16" height="10" rx="5" fill="url(#bg)"/><circle cx="8" cy="65" r="5" fill="#fbbf24"/></g><g class="mascot-arm-r" style="transform-origin:68px 62px"><rect x="66" y="60" width="16" height="10" rx="5" fill="url(#bg)"/><circle cx="82" cy="65" r="5" fill="#fbbf24"/></g><rect x="39" y="48" width="12" height="10" rx="4" fill="#fbbf24"/><circle cx="45" cy="36" r="22" fill="url(#fg)"/><circle cx="37" cy="33" r="4" fill="white"/><circle cx="53" cy="33" r="4" fill="white"/><circle cx="38" cy="34" r="2.5" fill="#1e1b4b"/><circle cx="54" cy="34" r="2.5" fill="#1e1b4b"/><circle cx="39" cy="33" r="1" fill="white"/><circle cx="55" cy="33" r="1" fill="white"/><path d="M37 42 Q45 49 53 42" stroke="#92400e" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="31" cy="40" rx="5" ry="3" fill="rgba(251,113,133,0.4)"/><ellipse cx="59" cy="40" rx="5" ry="3" fill="rgba(251,113,133,0.4)"/><path d="M25 28 Q30 10 45 14 Q60 10 65 28" fill="#1e1b4b"/><circle cx="45" cy="14" r="5" fill="#7c3aed"/></g></svg>`;}
function maybeMascot(){const done=state.tasks.filter(t=>t.completed).length,total=state.tasks.length;if(total>0&&done===total){spawnMascot('All done! Amazing!');}else if(done>0&&done%3===0){spawnMascot(MSGS[Math.floor(Math.random()*MSGS.length)]);}}

/* ── Helpers ───────────────────────────────── */
function formatDate(s){if(!s)return null;const d=new Date(s+'T00:00:00'),now=new Date();now.setHours(0,0,0,0);const diff=Math.round((d-now)/86400000);if(diff===0)return{label:'Today',overdue:false};if(diff===1)return{label:'Tomorrow',overdue:false};if(diff===-1)return{label:'Yesterday',overdue:true};if(diff<0)return{label:`${Math.abs(diff)}d overdue`,overdue:true};if(diff<=7)return{label:`In ${diff}d`,overdue:false};return{label:d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),overdue:false};}
function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getFilteredTasks(){
  let t=[...state.tasks];
  if(state.filter==='completed')t=t.filter(x=>x.completed);
  if(state.filter==='pending')t=t.filter(x=>!x.completed);
  if(state.category!=='all')t=t.filter(x=>x.category===state.category);
  if(state.priority!=='all')t=t.filter(x=>x.priority===state.priority);
  if(state.search.trim()){const q=state.search.toLowerCase();t=t.filter(x=>x.title.toLowerCase().includes(q));}
  if(state.sort==='priority'){const p={high:0,medium:1,low:2};t.sort((a,b)=>p[a.priority]-p[b.priority]);}
  else if(state.sort==='date'){t.sort((a,b)=>{if(!a.dueDate&&!b.dueDate)return 0;if(!a.dueDate)return 1;if(!b.dueDate)return -1;return a.dueDate.localeCompare(b.dueDate);});}
  else if(state.sort==='created'){t.sort((a,b)=>b.createdAt-a.createdAt);}
  else{t.sort((a,b)=>a.order-b.order);}
  return t;
}

/* ── Icons ─────────────────────────────────── */
function icon(name,size=16){
  const s=`width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const m={
    check:`<svg ${s}><polyline points="20 6 9 17 4 12"/></svg>`,
    plus:`<svg ${s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    trash:`<svg ${s}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    edit:`<svg ${s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    undo:`<svg ${s}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
    grip:`<svg ${s}><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
    search:`<svg ${s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    sun:`<svg ${s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon:`<svg ${s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    menu:`<svg ${s}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    x:`<svg ${s} stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    calendar:`<svg ${s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    zap:`<svg ${s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    layers:`<svg ${s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    briefcase:`<svg ${s}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    user:`<svg ${s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    'book-open':`<svg ${s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    heart:`<svg ${s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    'dollar-sign':`<svg ${s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    'more-horizontal':`<svg ${s}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
    'check-circle':`<svg ${s}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    list:`<svg ${s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    clock:`<svg ${s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    timer:`<svg ${s}><circle cx="12" cy="13" r="8"/><path d="M12 5v-2"/><path d="M9.17 2h5.66"/><polyline points="12 9 12 13 14 15"/></svg>`,
    play:`<svg ${s}><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause:`<svg ${s}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    'rotate-ccw':`<svg ${s}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-8.51"/></svg>`,
    monitor:`<svg ${s}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    smartphone:`<svg ${s}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  };
  return m[name]||m.layers;
}

/* ── Render Helpers ────────────────────────── */
function renderTaskCard(task){
  const cat=getCat(task.category),di=task.dueDate?formatDate(task.dueDate):null,ov=di?.overdue&&!task.completed;
  // Compute remaining alarm time for badge
  let alarmBadge='';
  if(task.alarmAt && !task.alarmFired && !task.completed){
    const rem=Math.max(0,Math.round((task.alarmAt-Date.now())/60000));
    alarmBadge=`<span class="task-badge badge-alarm">⏰ ${rem>0?rem+'m left':'Due now!'}</span>`;
  } else if(task.alarmAt && task.alarmFired && !task.completed){
    alarmBadge=`<span class="task-badge badge-alarm fired">✔️ Alarm fired</span>`;
  }
  return `<div class="task-card ${task.completed?'completed':''}" data-id="${task.id}" data-priority="${task.priority}">
    <div class="task-drag-handle">${icon('grip',16)}</div>
    <div class="task-checkbox ${task.completed?'checked':''}" data-action="toggle" data-id="${task.id}">${task.completed?icon('check',12):''}</div>
    <div class="task-body">
      <div class="task-title" data-edit-title="${task.id}">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="task-badge badge-priority-${task.priority}">${icon('zap',10)} ${task.priority}</span>
        <span class="task-badge badge-cat" style="background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}44;">${icon(cat.icon,10)} ${cat.label}</span>
        ${di?`<span class="task-badge badge-date ${ov?'overdue':''}">${icon('calendar',10)} ${di.label}</span>`:''}
        ${alarmBadge}
      </div>
    </div>
    <div class="task-actions">
      ${task.completed?`<button class="task-action-btn undo" data-action="undo" data-id="${task.id}">${icon('undo',14)}</button>`:''}
      <button class="task-action-btn edit" data-action="edit" data-id="${task.id}">${icon('edit',14)}</button>
      <button class="task-action-btn delete" data-action="delete" data-id="${task.id}">${icon('trash',14)}</button>
    </div>
  </div>`;
}

function renderStats(){
  const total=state.tasks.length,done=state.tasks.filter(t=>t.completed).length,pending=total-done,high=state.tasks.filter(t=>t.priority==='high'&&!t.completed).length;
  const sc=(bg,stroke,val,lbl,p)=>`<div class="stat-card"><div class="stat-icon" style="background:${bg}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.5">${p}</svg></div><div class="stat-info"><div class="stat-value">${val}</div><div class="stat-label">${lbl}</div></div></div>`;
  return `<div class="stats-row">
    ${sc('rgba(124,58,237,0.15)','#7c3aed',total,'Total Tasks','<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12h6"/><path d="M12 9v6"/>')}
    ${sc('rgba(16,185,129,0.15)','#10b981',done,'Completed','<polyline points="20 6 9 17 4 12"/>')}
    ${sc('rgba(245,158,11,0.15)','#f59e0b',pending,'Pending','<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>')}
    ${sc('rgba(244,63,94,0.15)','#f43f5e',high,'High Priority','<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>')}
  </div>`;
}

function renderProgressBar(){
  const total=state.tasks.length,done=state.tasks.filter(t=>t.completed).length,pct=total?Math.round(done/total*100):0;
  return `<div class="sidebar-progress"><div class="progress-label"><span>Progress</span><strong>${done}/${total}</strong></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div></div>`;
}

/* ── User Profile Card ─────────────────────── */
const EMOJIS=['🚀','👤','😎','🦸','🧑‍💻','🎯','⚡','🌟','🔥','🧠','🎮','🦊','🐉','🦋','🌈','⭐'];
function renderUserProfile(){
  const grid=EMOJIS.map(e=>`<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join('');
  return `<div class="user-profile-card">
    <div class="user-profile-banner"></div>
    <div class="user-profile-body">
      <div class="user-avatar-wrap">
        <div class="user-avatar" id="user-avatar">${userProfile.emoji}</div>
        <div class="user-avatar-online"></div>
      </div>
      <div class="emoji-picker hidden" id="emoji-picker">${grid}</div>
      <div class="user-name-row">
        <span class="user-name" id="user-name" title="Click to edit name">${escapeHtml(userProfile.name)}</span>
      </div>
      <div class="user-role">TaskFlow User &middot; ${state.tasks.filter(t=>t.completed).length}/${state.tasks.length} done</div>
      <div class="device-toggle">
        <button class="device-btn ${userProfile.device==='pc'?'active':''}" data-device="pc">${icon('monitor',14)} Desktop</button>
        <button class="device-btn ${userProfile.device==='phone'?'active':''}" data-device="phone">${icon('smartphone',14)} Mobile</button>
      </div>
    </div>
  </div>`;
}

/* ── Timer Panel ───────────────────────────── */
function renderTimerPanel(){
  const R=54,C=2*Math.PI*R,prog=timer.total>0?timer.remaining/timer.total:1;
  return `<div class="timer-panel ${timer.panelOpen?'':'hidden'}" id="timer-panel">
    <div class="timer-panel-header"><span class="timer-panel-title">${icon('timer',16)} Timer</span><button class="timer-panel-close" id="timer-panel-close">${icon('x',15)}</button></div>
    <div class="timer-panel-body">
      <div class="timer-ring-wrap">
        <svg class="timer-ring-svg" viewBox="0 0 120 120"><defs><linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs>
          <circle class="timer-ring-bg" cx="60" cy="60" r="${R}"/>
          <circle class="timer-ring-fill" id="timer-ring-fill" cx="60" cy="60" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-prog)}"/>
        </svg>
        <div class="timer-ring-digits"><span class="timer-ring-time" id="timer-ring-time">${fmtTime(timer.remaining)}</span><span class="timer-ring-label" id="timer-ring-label">paused</span></div>
      </div>
      <div class="timer-presets">${PRESETS.map(p=>`<button class="timer-preset-btn ${p.m===timer.presetMins?'active':''}" data-mins="${p.m}">${p.l}</button>`).join('')}</div>
      <div class="timer-custom-row">
        <label>Custom:</label>
        <input type="number" id="timer-min-input" class="timer-num-input" min="0" max="999" value="${Math.floor(timer.remaining/60)}" placeholder="mm"/>
        <span class="timer-colon">:</span>
        <input type="number" id="timer-sec-input" class="timer-num-input" min="0" max="59" value="${timer.remaining%60}" placeholder="ss"/>
      </div>
      <div class="timer-controls">
        <button class="timer-btn timer-btn-start" id="timer-start-btn" style="${timer.running?'display:none':''}">${icon('play',15)} Start</button>
        <button class="timer-btn timer-btn-pause" id="timer-pause-btn" style="${timer.running?'':'display:none'}">${icon('pause',15)} Pause</button>
        <button class="timer-btn timer-btn-reset" id="timer-reset-btn">${icon('rotate-ccw',15)} Reset</button>
      </div>
    </div>
  </div>`;
}
function renderTimerFab(){return `<button class="timer-fab${timer.running?' running':''}" id="timer-fab">${icon('timer',18)}<span class="timer-fab-time">${fmtTime(timer.remaining)}</span></button>`;}
function renderAlarmOverlay(){return `<div class="alarm-overlay" id="alarm-overlay"><div class="alarm-modal"><span class="alarm-icon">&#9200;</span><div class="alarm-title">Time's Up!</div><div class="alarm-subtitle">Your countdown finished.<br>Great focus session!</div><button class="alarm-dismiss-btn" id="alarm-dismiss-btn">Dismiss Alarm</button></div></div>`;}

/* ── Main Content HTML ─────────────────────── */
function renderMainBody(){
  const tasks=getFilteredTasks();
  const title=state.category!=='all'?getCat(state.category).label:state.filter==='completed'?'Completed':state.filter==='pending'?'Pending':'My Tasks';
  const total=state.tasks.length,done=state.tasks.filter(t=>t.completed).length;
  const sub=total===0?'Add your first task!':`${done} of ${total} completed - ${Math.round(done/total*100)}% done`;
  return `${renderStats()}
    <div class="page-header"><h1 class="page-title">${title}</h1><p class="page-subtitle">${sub}</p></div>
    <section class="add-task-card">
      <div class="add-task-inputs">
        <input type="text" id="new-task-title" class="task-input" placeholder="What needs to be done?" maxlength="200"/>
        <select id="new-task-cat" class="task-input" style="max-width:140px;">${CATEGORIES.slice(1).map(c=>`<option value="${c.id}">${c.label}</option>`).join('')}</select>
        <select id="new-task-pri" class="task-input" style="max-width:140px;">${PRIORITIES.map(p=>`<option value="${p.id}" ${p.id==='medium'?'selected':''}>${p.label}</option>`).join('')}</select>
      </div>
      <div class="add-task-row2">
        <input type="date" id="new-task-date" class="task-input" style="max-width:160px;"/>
        <button class="btn-primary" id="add-task-btn">${icon('plus',16)} Add Task</button>
        <button class="btn-secondary" id="clear-fields-btn">${icon('x',16)} Clear</button>
      </div>
      <!-- Alarm Row -->
      <div class="alarm-row" id="alarm-toggle-row">
        <button class="alarm-toggle-btn" id="alarm-toggle-btn" type="button">
          &#9200; Set Alarm
        </button>
        <div class="alarm-inputs hidden" id="alarm-inputs">
          <div class="alarm-quick-btns">
            <button class="alarm-quick" data-amin="5">5m</button>
            <button class="alarm-quick" data-amin="10">10m</button>
            <button class="alarm-quick" data-amin="15">15m</button>
            <button class="alarm-quick" data-amin="30">30m</button>
            <button class="alarm-quick" data-amin="60">1h</button>
          </div>
          <div class="alarm-custom-wrap">
            <span class="alarm-custom-label">Custom:</span>
            <input type="number" id="task-alarm-mins" class="task-alarm-input" min="1" max="1440" placeholder="min"/>
            <span class="alarm-custom-label">min</span>
          </div>
          <span class="alarm-active-hint" id="alarm-active-hint"></span>
        </div>
      </div>
    </section>
    <div class="filter-bar">
      <div class="filter-tabs">${['all','pending','completed'].map(f=>`<button class="filter-tab ${state.filter===f?'active':''}" data-filter-tab="${f}">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`).join('')}</div>
      <select class="sort-select" id="sort-select">
        <option value="order" ${state.sort==='order'?'selected':''}>Custom Order</option>
        <option value="date" ${state.sort==='date'?'selected':''}>Due Date</option>
        <option value="priority" ${state.sort==='priority'?'selected':''}>Priority</option>
        <option value="created" ${state.sort==='created'?'selected':''}>Date Added</option>
      </select>
    </div>
    <div class="section-label">${icon('list',14)} ${tasks.length} Task${tasks.length!==1?'s':''}</div>
    <div class="task-list" id="task-list" role="list">${tasks.length===0?renderEmptyState():tasks.map(renderTaskCard).join('')}</div>`;
}
function renderEmptyState(){
  const m={all:{title:'No tasks yet!',body:'Add your first task above.'},pending:{title:'All caught up!',body:'No pending tasks. Great work!'},completed:{title:'Nothing completed yet',body:'Complete some tasks first.'}};
  const d=m[state.filter]||m.all;
  return `<div class="empty-state"><div class="empty-icon">${icon('check-circle',36)}</div><h3>${d.title}</h3><p>${d.body}</p></div>`;
}

/* ── Phone Frame Wrapper ───────────────────── */
function wrapPhoneFrame(){
  const outer=document.getElementById('main-outer');
  if(!outer)return;
  if(userProfile.device==='phone'){
    const inner=outer.innerHTML;
    outer.innerHTML=`<div class="phone-shell" id="phone-shell">
      <div class="phone-notch"></div>
      <div class="phone-status-bar">
        <span class="phone-status-time" id="phone-clock">${phoneTime()}</span>
        <div class="phone-status-icons">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.5a13 13 0 0 1 21 0"/><path d="M5 12.5a9 9 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/></svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="16" height="11" rx="2"/><path d="M22 11v3"/></svg>
        </div>
      </div>
      <div class="phone-screen"><div class="phone-inner">${inner}</div></div>
      <div class="phone-home-bar"></div>
    </div>`;
    clearInterval(window._phoneClock);
    window._phoneClock=setInterval(()=>{const c=document.getElementById('phone-clock');if(c)c.textContent=phoneTime();},30000);
  } else {
    clearInterval(window._phoneClock);
  }
}

/* ── Main Render ───────────────────────────── */
function render(){
  const app=document.getElementById('app');
  app.innerHTML=`
  <header class="topbar" role="banner">
    <button class="icon-btn menu-btn" id="menu-btn">${icon('menu',18)}</button>
    <a class="topbar-logo" href="#">
      <div class="logo-icon">${icon('check',18)}</div>
      <span>TaskFlow</span>
    </a>
    <div class="topbar-spacer"></div>
    <div class="topbar-search">
      ${icon('search',16)}
      <input type="text" id="search-input" placeholder="Search tasks..." value="${escapeHtml(state.search)}"/>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" id="theme-toggle">${state.theme==='dark'?icon('sun',18):icon('moon',18)}</button>
    </div>
  </header>
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  <nav class="sidebar" id="sidebar">
    ${renderUserProfile()}
    <div class="sidebar-section-title">Views</div>
    <div class="sidebar-item ${state.filter==='all'?'active':''}" data-filter="all">${icon('layers',17)} All Tasks <span class="count">${state.tasks.length}</span></div>
    <div class="sidebar-item ${state.filter==='pending'?'active':''}" data-filter="pending">${icon('clock',17)} Pending <span class="count">${state.tasks.filter(t=>!t.completed).length}</span></div>
    <div class="sidebar-item ${state.filter==='completed'?'active':''}" data-filter="completed">${icon('check-circle',17)} Completed <span class="count">${state.tasks.filter(t=>t.completed).length}</span></div>
    <div class="sidebar-section-title">Categories</div>
    ${CATEGORIES.map(c=>`<div class="sidebar-item ${state.category===c.id?'active':''}" data-cat="${c.id}">${icon(c.icon,17)} ${c.label} <span class="count">${c.id==='all'?state.tasks.filter(t=>!t.completed).length:state.tasks.filter(t=>t.category===c.id&&!t.completed).length}</span></div>`).join('')}
    <div class="sidebar-section-title">Priority</div>
    <div class="sidebar-item ${state.priority==='all'?'active':''}" data-pri="all">${icon('layers',17)} All <span class="count">${state.tasks.filter(t=>!t.completed).length}</span></div>
    ${PRIORITIES.map(p=>`<div class="sidebar-item ${state.priority===p.id?'active':''}" data-pri="${p.id}"><span class="sidebar-dot" style="background:${p.color}"></span> ${p.label} <span class="count">${state.tasks.filter(t=>t.priority===p.id&&!t.completed).length}</span></div>`).join('')}
    <div class="mt-auto"></div>
    ${renderProgressBar()}
  </nav>
  <main class="main-content" id="main-outer">${renderMainBody()}</main>
  ${renderTimerPanel()}
  ${renderTimerFab()}
  ${renderAlarmOverlay()}`;

  wrapPhoneFrame();
  bindEvents();
  initDragDrop();
  applyTheme();
}

/* ── Events ────────────────────────────────── */
function bindTaskListEvents(list){
  if(!list)return;
  list.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const{action,id}=b.dataset;if(action==='toggle')toggleTask(id);if(action==='delete')deleteTask(id);if(action==='edit')startEdit(id);if(action==='undo')undoComplete(id);});
  list.addEventListener('dblclick',e=>{const t=e.target.closest('[data-edit-title]');if(t)startEdit(t.dataset.editTitle);});
}

function bindEvents(){
  document.getElementById('theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';localStorage.setItem('taskflow_theme',state.theme);render();});
  document.getElementById('menu-btn').addEventListener('click',toggleSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click',closeSidebar);
  document.getElementById('search-input').addEventListener('input',e=>{state.search=e.target.value;rerenderList();});
  document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{state.filter=el.dataset.filter;closeSidebar();render();}));
  document.querySelectorAll('[data-cat]').forEach(el=>el.addEventListener('click',()=>{state.category=el.dataset.cat;closeSidebar();render();}));
  document.querySelectorAll('[data-pri]').forEach(el=>el.addEventListener('click',()=>{state.priority=el.dataset.pri;render();}));
  document.querySelectorAll('[data-filter-tab]').forEach(el=>el.addEventListener('click',()=>{state.filter=el.dataset.filterTab;render();}));
  document.getElementById('sort-select').addEventListener('change',e=>{state.sort=e.target.value;rerenderList();});
  document.getElementById('add-task-btn').addEventListener('click',addTask);
  document.getElementById('new-task-title').addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
  document.getElementById('clear-fields-btn').addEventListener('click',()=>{
    document.getElementById('new-task-title').value='';
    document.getElementById('new-task-date').value='';
    // Reset alarm UI too
    document.getElementById('alarm-inputs')?.classList.add('hidden');
    document.getElementById('alarm-toggle-btn')?.classList.remove('active');
    document.getElementById('alarm-active-hint').textContent='';
    document.getElementById('task-alarm-mins').value='';
  });
  // Alarm toggle
  document.getElementById('alarm-toggle-btn')?.addEventListener('click',()=>{
    const inp=document.getElementById('alarm-inputs');
    const btn=document.getElementById('alarm-toggle-btn');
    inp.classList.toggle('hidden');
    btn.classList.toggle('active');
    if(!inp.classList.contains('hidden')) document.getElementById('task-alarm-mins')?.focus();
  });
  // Quick alarm preset buttons
  document.querySelectorAll('[data-amin]').forEach(b=>{
    b.addEventListener('click',()=>{
      const mins=parseInt(b.dataset.amin);
      document.getElementById('task-alarm-mins').value=mins;
      updateAlarmHint(mins);
      document.querySelectorAll('[data-amin]').forEach(x=>x.classList.remove('sel'));
      b.classList.add('sel');
      playTone(520,.06,'sine');
    });
  });
  document.getElementById('task-alarm-mins')?.addEventListener('input',e=>{
    const v=parseInt(e.target.value);
    if(v>0)updateAlarmHint(v);
    document.querySelectorAll('[data-amin]').forEach(x=>x.classList.remove('sel'));
  });
  bindTaskListEvents(document.getElementById('task-list'));
  const tl=document.getElementById('task-list');
  if(tl){tl.addEventListener('mousemove',handleTilt);tl.addEventListener('mouseleave',resetAllTilt,true);}

  // User profile
  document.getElementById('user-avatar')?.addEventListener('click',e=>{e.stopPropagation();userProfile.emojiOpen=!userProfile.emojiOpen;document.getElementById('emoji-picker')?.classList.toggle('hidden',!userProfile.emojiOpen);});
  document.getElementById('emoji-picker')?.addEventListener('click',e=>{const b=e.target.closest('[data-emoji]');if(!b)return;userProfile.emoji=b.dataset.emoji;userProfile.emojiOpen=false;saveProfile();const av=document.getElementById('user-avatar');if(av)av.textContent=userProfile.emoji;document.getElementById('emoji-picker')?.classList.add('hidden');playTone(660,.07,'sine');});
  document.getElementById('user-name')?.addEventListener('click',()=>{
    const row=document.querySelector('.user-name-row');if(!row)return;
    const inp=document.createElement('input');inp.className='user-name-input';inp.value=userProfile.name;inp.maxLength=20;
    row.querySelector('#user-name').replaceWith(inp);inp.focus();inp.select();
    function save(){const v=inp.value.trim()||userProfile.name;userProfile.name=v;saveProfile();const sp=document.createElement('span');sp.className='user-name';sp.id='user-name';sp.title='Click to edit name';sp.textContent=v;sp.addEventListener('click',()=>document.getElementById('user-name')?.click());inp.replaceWith(sp);}
    inp.addEventListener('blur',save);inp.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='Escape')inp.blur();});
  });
  document.querySelectorAll('[data-device]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      userProfile.device=btn.dataset.device;saveProfile();applyDeviceView();
      showToast(userProfile.device==='phone'?'Mobile view ON (phone frame!)':'Desktop view ON','info',2000);
      playTone(520,.08,'sine');
      render(); // re-render to apply phone frame
    });
  });
  document.addEventListener('click',()=>{if(userProfile.emojiOpen){userProfile.emojiOpen=false;document.getElementById('emoji-picker')?.classList.add('hidden');}});

  // Timer
  document.getElementById('timer-fab').addEventListener('click',()=>{timer.panelOpen=!timer.panelOpen;document.getElementById('timer-panel')?.classList.toggle('hidden',!timer.panelOpen);});
  document.getElementById('timer-panel-close').addEventListener('click',()=>{timer.panelOpen=false;document.getElementById('timer-panel')?.classList.add('hidden');});
  document.getElementById('timer-start-btn').addEventListener('click',()=>{
    if(timer.remaining===0){const m=parseInt(document.getElementById('timer-min-input')?.value)||0,s=parseInt(document.getElementById('timer-sec-input')?.value)||0;const tot=m*60+s;if(tot>0){timer.total=tot;timer.remaining=tot;}else{showToast('Set a time first!','warning');return;}}
    timerStart();
  });
  document.getElementById('timer-pause-btn').addEventListener('click',timerPause);
  document.getElementById('timer-reset-btn').addEventListener('click',timerReset);
  document.querySelectorAll('.timer-preset-btn').forEach(b=>b.addEventListener('click',()=>{timerSet(parseInt(b.dataset.mins));playTone(440,.06,'sine');}));
  document.getElementById('alarm-dismiss-btn').addEventListener('click',()=>{stopAlarmSound();document.getElementById('alarm-overlay')?.classList.remove('show');timerReset();showToast('Alarm dismissed! Great session.','success');});
}

/* ── Tilt ──────────────────────────────────── */
function handleTilt(e){const card=e.target.closest('.task-card');if(!card)return;const r=card.getBoundingClientRect();card.style.setProperty('--tilt-x',`${-(e.clientY-r.top-r.height/2)/(r.height/2)*4}deg`);card.style.setProperty('--tilt-y',`${(e.clientX-r.left-r.width/2)/(r.width/2)*4}deg`);}
function resetAllTilt(){document.querySelectorAll('.task-card').forEach(c=>{c.style.setProperty('--tilt-x','0deg');c.style.setProperty('--tilt-y','0deg');});}

/* ── Sidebar ───────────────────────────────── */
function toggleSidebar(){const sb=document.getElementById('sidebar'),ov=document.getElementById('sidebar-overlay');if(sb.classList.contains('open')){closeSidebar();}else{sb.classList.add('open');ov.classList.add('show');}}
function closeSidebar(){document.getElementById('sidebar')?.classList.remove('open');document.getElementById('sidebar-overlay')?.classList.remove('show');}

/* ── Task Actions ──────────────────────────── */
function updateAlarmHint(mins){
  const h=document.getElementById('alarm-active-hint');
  if(!h)return;
  const t=new Date(Date.now()+mins*60000);
  h.textContent=`Alarm at ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}`;
}

function addTask(){
  const te=document.getElementById('new-task-title'),title=te.value.trim();
  if(!title){te.focus();te.style.borderColor='var(--priority-high)';te.style.boxShadow='0 0 0 3px rgba(244,63,94,0.2)';setTimeout(()=>{te.style.borderColor='';te.style.boxShadow='';},1200);showToast('Enter a task title!','warning');return;}
  // Read alarm
  const alarmMins=parseInt(document.getElementById('task-alarm-mins')?.value)||0;
  const alarmActive=!document.getElementById('alarm-inputs')?.classList.contains('hidden')&&alarmMins>0;
  const task={
    id:uid(),title,
    category:document.getElementById('new-task-cat').value,
    priority:document.getElementById('new-task-pri').value,
    dueDate:document.getElementById('new-task-date').value,
    completed:false,createdAt:Date.now(),order:0,
    alarmAt: alarmActive ? Date.now()+alarmMins*60000 : null,
    alarmFired: false,
  };
  state.tasks.unshift(task);state.tasks.forEach((t,i)=>t.order=i);saveTasks(state.tasks);
  te.value='';document.getElementById('new-task-date').value='';
  // Reset alarm UI
  document.getElementById('alarm-inputs')?.classList.add('hidden');
  document.getElementById('alarm-toggle-btn')?.classList.remove('active');
  if(document.getElementById('task-alarm-mins'))document.getElementById('task-alarm-mins').value='';
  if(document.getElementById('alarm-active-hint'))document.getElementById('alarm-active-hint').textContent='';
  document.querySelectorAll('[data-amin]').forEach(x=>x.classList.remove('sel'));
  sfxAdd();
  if(alarmActive){
    const at=new Date(task.alarmAt);
    showToast(`Task added with alarm at ${at.getHours()}:${String(at.getMinutes()).padStart(2,'0')}`,'success',4000);
  } else {
    showToast(`Added: "${title}"`,'success');
  }
  render();
  setTimeout(()=>document.querySelector('.task-card')?.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
}
function toggleTask(id){const task=state.tasks.find(t=>t.id===id);if(!task)return;task.completed=!task.completed;saveTasks(state.tasks);if(task.completed){sfxComplete();showToast(`Completed!`,'success');maybeMascot();}render();}
function undoComplete(id){const task=state.tasks.find(t=>t.id===id);if(!task)return;task.completed=false;saveTasks(state.tasks);sfxUndo();showToast('Marked as pending','info');render();}
function deleteTask(id){
  const task=state.tasks.find(t=>t.id===id);if(!task)return;
  const card=document.querySelector(`.task-card[data-id="${id}"]`);
  if(card){card.classList.add('removing');card.addEventListener('animationend',()=>{state.tasks=state.tasks.filter(t=>t.id!==id);saveTasks(state.tasks);sfxDelete();showToast('Task deleted','error');render();},{once:true});}
  else{state.tasks=state.tasks.filter(t=>t.id!==id);saveTasks(state.tasks);render();}
}
function startEdit(id){
  const task=state.tasks.find(t=>t.id===id);if(!task)return;
  const titleEl=document.querySelector(`.task-title[data-edit-title="${id}"]`);if(!titleEl)return;
  const input=document.createElement('input');input.type='text';input.value=task.title;input.className='task-title-input';input.maxLength=200;
  titleEl.replaceWith(input);input.focus();input.select();
  function save(){const v=input.value.trim();if(v&&v!==task.title){task.title=v;saveTasks(state.tasks);showToast('Task updated','info');}render();}
  input.addEventListener('blur',save);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur();}if(e.key==='Escape')render();});
}

/* ── Drag & Drop ───────────────────────────── */
function initDragDrop(){
  const list=document.getElementById('task-list');if(!list||!window.Sortable)return;
  Sortable.create(list,{handle:'.task-drag-handle',animation:200,ghostClass:'sortable-ghost',dragClass:'sortable-drag',delay:100,delayOnTouchOnly:true,
    onEnd(){[...list.querySelectorAll('.task-card')].forEach((el,i)=>{const t=state.tasks.find(t=>t.id===el.dataset.id);if(t)t.order=i;});state.sort='order';saveTasks(state.tasks);}});
}

/* ── Partial Re-render ─────────────────────── */
function rerenderList(){
  const tasks=getFilteredTasks(),list=document.getElementById('task-list');
  if(!list){render();return;}
  list.innerHTML=tasks.length===0?renderEmptyState():tasks.map(renderTaskCard).join('');
  bindTaskListEvents(list);initDragDrop();
}

/* ── Theme ─────────────────────────────────── */
function applyTheme(){document.documentElement.setAttribute('data-theme',state.theme);}

/* ── Boot ──────────────────────────────────── */
function showSkeleton(){
  const d=document.createElement('div');d.style.cssText='padding:80px 2rem 2rem calc(var(--sidebar-w)+2rem)';
  d.innerHTML=[1,2,3].map(()=>'<div class="skeleton skeleton-card"></div>').join('');
  document.body.appendChild(d);setTimeout(()=>{d.remove();render();},600);
}
applyTheme();
applyDeviceView();
startTaskAlarmWatcher();
showSkeleton();

