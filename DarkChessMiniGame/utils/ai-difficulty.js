// Targets describe AI win rate against a defined opponent pool, not guaranteed outcomes.
// Keep tuning in one place for classic/dark/jieqi and fusion.
const profiles={
 // ms is the wall-clock ceiling; cpu is active search time. Both limits apply.
 easy:{target:.30,ms:100,cpu:40,nodes:350,depth:3,mistake:.58,tolerance:320},
 normal:{target:.60,ms:400,cpu:180,nodes:25000,depth:7,mistake:.08,tolerance:65},
 hard:{target:.80,ms:900,cpu:350,nodes:60000,depth:8,mistake:0,tolerance:0}
};
// Low benchmark devices use the normal profile when hard is requested. This is
// deliberately a profile substitution so all existing callers retain their API.
function effectiveLevel(level,deviceInfo){
 if(level==='hard'){
  let d=deviceInfo;
  if(!d){try{d=typeof wx!=='undefined'&&wx.getDeviceInfo?wx.getDeviceInfo():null;}catch(e){d=null;}}
  if(d&&Number(d.benchmarkLevel)>0&&Number(d.benchmarkLevel)<=10)return 'normal';
 }
 return profiles[level]?level:'normal';
}
function profile(level,deviceInfo){return profiles[effectiveLevel(level,deviceInfo)]||profiles.normal;}
function select(ranked,level,random=Math.random){
 if(!ranked.length)return null;const cfg=profile(level),sorted=ranked.slice().sort((a,b)=>b.v-a.v),best=sorted[0];
 // Always take a known forced win and never deliberately select a known forced loss.
 if(best.v>=99000||cfg.mistake===0||random()>=cfg.mistake)return best.m;
 const alternatives=sorted.filter((r,i)=>i>0&&r.v>-99000&&r.v>=best.v-cfg.tolerance);
 return alternatives.length?alternatives[Math.min(alternatives.length-1,Math.floor(random()*alternatives.length))].m:best.m;
}
module.exports={profiles,profile,effectiveLevel,select};
