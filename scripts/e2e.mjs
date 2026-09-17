import { io } from 'socket.io-client';
import assert from 'node:assert/strict';
const url=process.env.TEST_URL||'http://localhost:3001';
const client=()=>io(url,{transports:['websocket'],forceNew:true});
const request=(s,event,payload={})=>new Promise((resolve,reject)=>s.emit(event,payload,a=>a?.ok?resolve(a.data):reject(Error(a?.error||`${event} failed`))));
const waitState=(s,test)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{s.off('state',handler);reject(Error('Timed out waiting for state'))},3000);const handler=v=>{if(test(v)){clearTimeout(timer);s.off('state',handler);resolve(v)}};s.on('state',handler)});
const host=client(),guest=client();await Promise.all([new Promise(r=>host.on('connect',r)),new Promise(r=>guest.on('connect',r))]);
const created=await request(host,'create',{nickname:'E2E Host'});const joined=await request(guest,'join',{code:created.code,nickname:'E2E Guest'});assert.equal(joined.state.players.length,2);
await request(host,'start');let state=await request(host,'resume',{token:created.token});assert.equal(state.phase,'question');assert.equal(state.reveal,null);const firstQuestion=state.question.id;
await assert.rejects(request(guest,'join',{code:created.code,nickname:'Late'}),/started/);
for(let round=1;round<=10;round++){
  const revealPromise=waitState(host,v=>v.phase==='reveal'&&v.round===round);
  await request(host,'answer',{round,choice:0});
  if(round===1)await assert.rejects(request(host,'answer',{round,choice:1}),/locked/);
  const before=await request(guest,'resume',{token:joined.token});assert.equal(before.reveal,null);
  await request(guest,'answer',{round,choice:0});const reveal=await revealPromise;assert.equal(reveal.reveal.answers[reveal.selfId],0);
  await request(host,'advance');
}
state=await request(host,'resume',{token:created.token});assert.equal(state.phase,'finished');assert.equal(state.winners.length,2);
host.disconnect();const restored=client();await new Promise(r=>restored.on('connect',r));const restoredState=await request(restored,'resume',{token:created.token});assert.equal(restoredState.selfId,created.state.selfId);
await request(restored,'lobby');await request(restored,'start');state=await request(restored,'resume',{token:created.token});assert.equal(state.phase,'question');assert.notEqual(state.question.id,firstQuestion);
host.close();guest.close();restored.close();console.log('PASS: two independent clients completed 10 rounds, tied, restored host session, and started a fresh replay.');
