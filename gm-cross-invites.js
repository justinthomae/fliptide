// Grudge Match cross-game invites: a friend invites you to another Grudge Match game (Lost Empires, Silent Depths...).
//
//   "Ann invites you to Lost Empires"  [Join now]  [After this game]  [x]
// "Join now" accepts and opens the game. "After this game" (only mid-match) accepts for later: when the match ends the
// card comes back as "Ann is waiting for you in Lost Empires" [Join] [No thanks]. Outside a match: [Join] [No thanks].
//
// Backend (shared Supabase project, already live; not on realtime, so this polls every 9 s while signed in and visible):
//   rpc('gm_my_invites')                                          -> public.gm_cross_invites rows ('pending'|'later', not expired)
//   rpc('gm_respond_invite',{p_invite,p_choice:'now'|'later'|'decline',p_from_app}) -> join_url
//
// Use:
//   GMCrossInvites.init({ supabase, app: 'fliptide', isBusy: () => inAMatch });
(function(root){
  'use strict';
  const POLL_MS=9000,TICK_MS=1000;
  const isHttps=u=>{try{return new URL(String(u)).protocol==='https:'}catch(e){return false}};
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Which invite card to show, if any (pure, so it can be tested).
  //   invites:  rows from gm_my_invites
  //   app:      this game's own key (its invites are ignored here)
  //   busy:     true while a match is being played
  //   now:      Date.now()
  //   answered: Map id -> status set locally ('later' | 'done') before the next poll catches up
  // Returns {inv, kind:'offer'|'waiting', actions:[...]} or null.
  function pick(invites,{app,busy,now,answered}){
    const seen=answered||new Map();
    const rows=(Array.isArray(invites)?invites:[]).filter(r=>r&&r.id&&r.app!==app&&isHttps(r.join_url)&&
      new Date(r.expires_at||0).getTime()>now&&seen.get(r.id)!=='done');
    const status=r=>seen.get(r.id)==='later'?'later':r.status;
    const newest=list=>list.slice().sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0];
    // someone is waiting for you and your match is over: that comes first
    if(!busy){
      const w=newest(rows.filter(r=>status(r)==='later'));
      if(w)return {inv:w,kind:'waiting',actions:['now','decline']};
    }
    const p=newest(rows.filter(r=>status(r)==='pending'));
    if(p)return {inv:p,kind:'offer',actions:busy?['now','later','decline']:['now','decline']};
    return null;
  }

  let sb=null,opt={},uid=null,rows=[],answered=new Map(),pollT=null,tickT=null,el=null,shownKey='',authSub=null,inflight=false;
  const busy=()=>{try{return !!(opt.isBusy&&opt.isBusy())}catch(e){return false}};

  // ---------- look ----------
  function css(){
    if(document.getElementById('gmx-css'))return;
    const s=document.createElement('style');s.id='gmx-css';
    s.textContent=`
.gmx{position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147482999;width:min(400px,calc(100vw - 32px));box-sizing:border-box;
  background:#1c2036;color:#eef0fa;border:1px solid #3a4066;border-radius:14px;padding:10px 10px 10px 14px;box-shadow:0 10px 28px rgba(0,0,0,.4);
  font:500 14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;animation:gmx-in .2s ease-out}
.gmx p{margin:0 30px 8px 0}.gmx:not(:has(.gmx-x)) p{margin-right:0}.gmx b{color:#fff}
.gmx .gmx-row{display:flex;gap:8px;flex-wrap:wrap}
.gmx button{font:inherit;font-weight:700;border:0;border-radius:10px;min-height:40px;padding:0 12px;cursor:pointer;flex:1 1 auto;background:#2c3254;color:#eef0fa}
.gmx button.gmx-go{background:#f7c548;color:#2a1e05}
.gmx button.gmx-x{position:absolute;right:6px;top:6px;flex:none;width:32px;min-height:32px;padding:0;background:transparent;color:#9aa1c4;font-size:18px}
.gmx button:disabled{opacity:.6;cursor:default}
@keyframes gmx-in{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
@media (prefers-reduced-motion:reduce){.gmx{animation:none}}`;
    document.head.appendChild(s);
  }
  function hide(){if(el){el.remove();el=null}shownKey=''}
  function show(){
    const c=uid?pick(rows,{app:opt.app,busy:busy(),now:Date.now(),answered}):null;
    const key=c?c.inv.id+'|'+c.kind+'|'+c.actions.join(','):'';
    if(key===shownKey)return;
    hide();if(!c)return;
    css();shownKey=key;
    const i=c.inv,who=`<b>${esc(i.from_name||'A friend')}</b>`,game=`<b>${esc(i.app_name||i.app)}</b>`;
    // mid-match: [Join now] [After this game] and an x; otherwise [Join] [No thanks]
    const mid=c.actions.includes('later'),label={now:mid?'Join now':'Join',later:'After this game',decline:'No thanks'};
    el=document.createElement('div');el.className='gmx';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML=`<p>${c.kind==='waiting'?`${who} is waiting for you in ${game}`:`${who} invites you to ${game}`}</p>
      <div class="gmx-row">${c.actions.filter(a=>!(mid&&a==='decline')).map(a=>
        `<button type="button" data-a="${a}"${a==='now'?' class="gmx-go"':''}>${label[a]}</button>`).join('')}</div>
      ${mid?'<button class="gmx-x" type="button" data-a="decline" aria-label="No thanks">×</button>':''}`;
    el.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)respond(i,b.dataset.a)});
    document.body.appendChild(el);
  }

  // ---------- talking to the backend ----------
  async function respond(inv,choice){
    if(el)el.querySelectorAll('button').forEach(b=>b.disabled=true);
    answered.set(inv.id,choice==='later'?'later':'done');
    let url=null;
    try{const {data,error}=await sb.rpc('gm_respond_invite',{p_invite:inv.id,p_choice:choice,p_from_app:opt.app});if(!error)url=data}catch(e){}
    if(choice==='now'){
      const go=isHttps(url)?url:isHttps(inv.join_url)?inv.join_url:null;
      if(go){location.assign(go);return}
    }
    show();
  }
  async function poll(){
    if(!uid||inflight||document.visibilityState==='hidden')return;
    inflight=true;
    try{const {data,error}=await sb.rpc('gm_my_invites');if(!error){rows=Array.isArray(data)?data:[];
      // forget local answers the server no longer lists
      const ids=new Set(rows.map(r=>r.id));answered.forEach((v,id)=>{if(!ids.has(id))answered.delete(id)})}}catch(e){}
    inflight=false;show();
  }
  function setUser(u){
    const id=u&&u.id||null;if(id===uid)return;
    uid=id;rows=[];answered.clear();hide();
    clearInterval(pollT);pollT=null;
    if(uid){poll();pollT=setInterval(poll,POLL_MS)}
  }
  async function init(o){
    opt=Object.assign({},o||{});sb=opt.supabase;if(!sb||!opt.app||typeof document==='undefined')return;
    try{const {data}=await sb.auth.getSession();setUser(data&&data.session&&data.session.user)}catch(e){}
    try{if(authSub)authSub.unsubscribe();const r=sb.auth.onAuthStateChange((ev,s)=>setUser(s&&s.user));authSub=r&&r.data&&r.data.subscription}catch(e){}
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')poll()});
    // the match ending (or starting) changes what the card offers; no network needed for that
    clearInterval(tickT);tickT=setInterval(show,TICK_MS);
  }
  const api={init,pick,isHttps};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root&&!root.GMCrossInvites)root.GMCrossInvites=api;
})(typeof window!=='undefined'?window:globalThis);
