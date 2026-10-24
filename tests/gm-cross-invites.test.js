// Run: node --test tests/*.test.js
const test=require('node:test'),assert=require('node:assert');
const {pick}=require('../gm-cross-invites.js');

const NOW=Date.parse('2026-10-24T12:00:00Z');
const inv=(id,o)=>Object.assign({id,app:'lostempires',app_name:'Lost Empires',join_url:'https://lost-empires.onrender.com/?room=AB12',
  from_name:'Ann',status:'pending',created_at:'2026-10-24T11:58:00Z',expires_at:'2026-10-24T12:10:00Z'},o);
const ctx=o=>Object.assign({app:'fliptide',busy:false,now:NOW,answered:new Map()},o);

test('nothing to show',()=>{
  assert.strictEqual(pick([],ctx()),null);
  assert.strictEqual(pick(null,ctx()),null);
});
test('a pending invite outside a match: Join and No thanks',()=>{
  const c=pick([inv('a')],ctx());
  assert.strictEqual(c.inv.id,'a');assert.strictEqual(c.kind,'offer');assert.deepStrictEqual(c.actions,['now','decline']);
});
test('a pending invite mid-match also offers After this game',()=>{
  assert.deepStrictEqual(pick([inv('a')],ctx({busy:true})).actions,['now','later','decline']);
});
test('ignores this game, non-https links, expired and answered invites',()=>{
  assert.strictEqual(pick([inv('a',{app:'fliptide'})],ctx()),null);
  assert.strictEqual(pick([inv('a',{join_url:'http://lost-empires.onrender.com/'})],ctx()),null);
  assert.strictEqual(pick([inv('a',{join_url:'javascript:alert(1)'})],ctx()),null);
  assert.strictEqual(pick([inv('a',{expires_at:'2026-10-24T11:59:59Z'})],ctx()),null);
  assert.strictEqual(pick([inv('a')],ctx({answered:new Map([['a','done']])})),null);
});
test('After this game: hidden during the match, back as "waiting" when it ends',()=>{
  const rows=[inv('a',{status:'later'})];
  assert.strictEqual(pick(rows,ctx({busy:true})),null);
  const c=pick(rows,ctx({busy:false}));
  assert.strictEqual(c.kind,'waiting');assert.deepStrictEqual(c.actions,['now','decline']);
});
test('a local "later" answer applies before the next poll',()=>{
  const answered=new Map([['a','later']]);
  assert.strictEqual(pick([inv('a')],ctx({busy:true,answered})),null);
  assert.strictEqual(pick([inv('a')],ctx({answered})).kind,'waiting');
});
test('mid-match, a new invite still shows while another waits for later',()=>{
  const rows=[inv('a',{status:'later'}),inv('b',{app:'silentdepths',app_name:'Silent Depths'})];
  assert.strictEqual(pick(rows,ctx({busy:true})).inv.id,'b');
  assert.strictEqual(pick(rows,ctx()).inv.id,'a');
});
test('newest invite first',()=>{
  const rows=[inv('old',{created_at:'2026-10-24T11:50:00Z'}),inv('new',{created_at:'2026-10-24T11:59:00Z'})];
  assert.strictEqual(pick(rows,ctx()).inv.id,'new');
});
