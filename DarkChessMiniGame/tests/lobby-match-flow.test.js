const test=require('node:test');
const assert=require('node:assert/strict');
const Controller=require('../src/controller');
const G=require('../utils/game-engine');

function client(state,room){
 const c=Object.assign({},Controller,{_alive:true,_mode:'online',_hidden:false,_room:null,_state:null,runtime:null,data:{...Controller.data},_audio:{effect(){}},setData(p){Object.assign(this.data,p);},sync(){},tick(){}});
 c.applyRoom({...room,state});
 return c;
}

test('a stale waiting snapshot cannot reopen the match overlay after pairing',()=>{
 const state=G.newGame(undefined,'classic');
 const c=client(state,{roomId:'r',rev:1,side:'red',red:{nickname:'R'},black:null,waiting:true,serverNow:1,match:true});
 c.applyRoom({roomId:'r',rev:2,side:'red',red:{nickname:'R'},black:{nickname:'B'},waiting:false,state,serverNow:2,match:true});
 c.applyRoom({roomId:'r',rev:2,side:'red',red:{nickname:'R'},black:null,waiting:true,state,serverNow:3,match:true});
 assert.equal(c.data.waiting,false);
 assert.equal(c._room.black.nickname,'B');
});

test('the assigned online side can complete a normal move after pairing',async()=>{
 const state=G.newGame(undefined,'classic'),calls=[];
 const c=client(state,{roomId:'r',rev:1,side:'red',red:{nickname:'R'},black:{nickname:'B'},waiting:false,serverNow:1,match:true});
 c.command=async(action,data)=>calls.push({action,data});
 const pawn=state.pieces.find(p=>p.side==='red'&&p.kind==='pawn');
 await c.onPoint({detail:{point:{x:pawn.x,y:pawn.y},pieceId:pawn.id}});
 await c.onPoint({detail:{point:{x:pawn.x,y:pawn.y-1},pieceId:null}});
 assert.equal(c.data.selectedId,pawn.id);
 assert.deepEqual(calls,[{action:'move',data:{id:pawn.id,to:{x:pawn.x,y:pawn.y-1}}}]);
});

test('logged-in local player identity is used for AI and fake-opponent games',()=>{
 const state=G.newGame(undefined,'classic'),profile={nickname:'微信玩家',avatar:'cloud://wechat-avatar'};
 const c=client(state,{roomId:'',rev:1,side:'red',red:null,black:null,waiting:false,serverNow:1,match:false});
 c.runtime={profile};c._mode='ai';c._fakeOpponent={nickname:'匹配机器人',avatar:''};Controller.sync.call(c);
 assert.equal(c.data.bottomName,'微信玩家');
 assert.equal(c.data.bottomAvatar,'cloud://wechat-avatar');
});

test('fake-opponent stickers use the same thirty-second cooldown',()=>{
 const state=G.newGame(undefined,'classic'),shown=[];
 const c=client(state,{roomId:'',rev:1,side:'red',red:null,black:null,waiting:false,serverNow:1,match:false});
 c.runtime={profile:{nickname:'微信玩家',avatar:'cloud://wechat-avatar'}};c._mode='ai';c._fakeOpponent={nickname:'匹配机器人',avatar:''};c.showSticker=id=>shown.push(id);c.toast=msg=>shown.push(msg);
 c.sendSticker({currentTarget:{dataset:{id:'sticker-1'}}});
 c.sendSticker({currentTarget:{dataset:{id:'sticker-2'}}});
 assert.deepEqual(shown,['sticker-1','表情冷却中，请稍候']);
 c.showFakeSticker('sticker-3');
 c.showFakeSticker('sticker-4');
 assert.deepEqual(shown,['sticker-1','表情冷却中，请稍候','sticker-3']);
});

test('online undo uses a distinct undo action and cannot become restart',()=>{
 const state=G.newGame(undefined,'classic'),calls=[];
 const c=client(state,{roomId:'r',rev:1,side:'red',red:{nickname:'R'},black:{nickname:'B'},waiting:false,serverNow:1,match:false});
 c.command=(...args)=>calls.push(args);
 c.undo();
 assert.deepEqual(calls,[['undo']]);
});
