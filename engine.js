/* Touchline Manager — original offline game engine. No network or dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Touchline = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMATIONS = {
    '4-3-1-2': ['GK','LB','CB','CB','RB','CM','CM','CM','SS','CF','CF'],
    '4-4-2': ['GK','LB','CB','CB','RB','LM','CM','CM','RM','CF','CF'],
    '4-3-3': ['GK','LB','CB','CB','RB','CM','CM','CM','LW','CF','RW'],
    '3-5-2': ['GK','CB','CB','CB','LM','CM','CM','CM','RM','CF','CF']
  };
  const NAMES = ['Ari Vale','Milo Stone','Theo Finch','Jules Okoro','Sami Vega','Eli Rowan','Nico Lake','Kofi Arden','Remy Bell','Ayo Rivers','Luca Moss','Ivo North','Noah Dune','Tari Cole','Finn Ember','Zane Porter'];
  const POS = ['GK','LB','CB','CB','RB','CM','CM','CM','SS','CF','CF','GK','CB','CM','CF','RM'];
  const TEAMS = ['Touchline FC','Cedar Athletic','Harbor Rovers','Kingsmere','Orchard City','Northbridge'];
  const TRAIN = {
    technical: { label:'Technical', cost:12, stats:['attack','defense'], gain:2 },
    conditioning: { label:'Conditioning', cost:10, stats:['stamina'], gain:3 },
    recovery: { label:'Recovery', cost:0, stats:[], gain:0 }
  };
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function hash(x){let h=2166136261; for (const c of String(x)) {h ^= c.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0;}
  function rng(seed){let x=seed>>>0;return function(){x=(x+0x6D2B79F5)|0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function integer(r,a,b){return a+Math.floor(r()*(b-a+1));}
  function player(id,name,pos,r,boost=0){
    const off=['CF','SS','LW','RW'].includes(pos), def=['GK','LB','CB','RB'].includes(pos);
    return {id,name,pos,attack:clamp(integer(r,46,62)+(off?10:0)+boost,1,95),defense:clamp(integer(r,46,62)+(def?10:0)+boost,1,95),stamina:clamp(integer(r,54,70)+boost,1,95),fitness:100,wage:integer(r,2,4),trainedWeek:''};
  }
  function fixtures(){
    let a=[0,1,2,3,4,5], rounds=[];
    for(let r=0;r<5;r++){
      const games=[];for(let i=0;i<3;i++){let home=a[i],away=a[5-i];if((r+i)%2)[home,away]=[away,home];games.push({home,away,score:null});}
      rounds.push(games);a=[a[0],a[5],...a.slice(1,5)];
    }
    return rounds.concat(rounds.map(round=>round.map(g=>({home:g.away,away:g.home,score:null}))));
  }
  function create(seed=20261117){
    const r=rng(seed), roster=NAMES.map((n,i)=>player('p'+i,n,POS[i],r));
    return {version:1,seed,season:1,round:0,club:TEAMS[0],cash:180,roster,formation:'4-3-1-2',lineup:roster.slice(0,11).map(p=>p.id),training:3,marketBought:[],fixtures:fixtures(),lastMatch:null,history:[],tactic:'balanced'};
  }
  function valid(s){return !!(s && s.version===1 && Number.isInteger(s.round)&&s.round>=0&&s.round<=10 && Number.isInteger(s.season)&&s.season>=1 && Number.isFinite(s.cash) && Array.isArray(s.roster)&&s.roster.length>=11&&s.roster.length<=20&&s.roster.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.pos==='string'&&['attack','defense','stamina','fitness','wage'].every(k=>Number.isFinite(p[k])))&&FORMATIONS[s.formation]&&Array.isArray(s.lineup)&&s.lineup.length===11&&new Set(s.lineup).size===11&&s.lineup.every(id=>s.roster.some(p=>p.id===id))&&Array.isArray(s.fixtures)&&s.fixtures.length===10&&s.fixtures.every(round=>Array.isArray(round)&&round.length===3)&&Array.isArray(s.marketBought)&&Array.isArray(s.history)&&Number.isInteger(s.training)&&['balanced','attacking','defensive'].includes(s.tactic));}
  function group(pos){if(pos==='GK')return 'g';if(['LB','CB','RB'].includes(pos))return 'd';if(['LM','CM','RM'].includes(pos))return 'm';return 'a';}
  function fit(pos,slot){if(pos===slot)return 1;if(pos==='GK'||slot==='GK')return 0.38;if(group(pos)===group(slot))return 0.86;if((pos==='SS'&&slot==='CM')||(pos==='CM'&&slot==='SS'))return 0.79;return 0.62;}
  function rating(p){return Math.round((p.attack+p.defense+p.stamina)/3);}
  function changeFormation(s,name){if(!FORMATIONS[name])return 'Unknown formation.';s.formation=name;return null;}
  function assign(s,index,id){if(!Number.isInteger(index)||index<0||index>=11||!s.roster.some(p=>p.id===id))return 'Invalid player or position.';const old=s.lineup[index], other=s.lineup.indexOf(id);s.lineup[index]=id;if(other>=0)s.lineup[other]=old;return null;}
  function train(s,id,type){const p=s.roster.find(x=>x.id===id), t=TRAIN[type];if(!p||!t)return 'Choose a valid player and session.';if(s.round>=10)return 'Start the next season first.';if(s.training<1)return 'No sessions left this matchweek.';const week=s.season+':'+s.round;if(p.trainedWeek===week)return 'This player already trained this matchweek.';if(type==='recovery'&&p.fitness>=100)return 'Fitness is already full.';if(t.cost && p.fitness<t.cost+20)return 'Player needs more fitness first.';if(t.stats.length && t.stats.every(k=>p[k]>=99))return 'These skills are already at their maximum.';s.training--;p.trainedWeek=week;if(type==='recovery')p.fitness=clamp(p.fitness+25,0,100);else{p.fitness-=t.cost;t.stats.forEach(k=>p[k]=clamp(p[k]+t.gain,1,99));}return null;}
  function market(s){let r=rng(hash('market:'+s.seed+':'+s.season+':'+s.round));let first=['Omar','Jay','Tobi','Enzo','Kai','Idris','Leon','Ravi','Nia','Sol','Yuri','Dara','Zeki','Alex','Kian','Ash'];let last=['Sands','Wells','Bright','Alder','Marsh','Banks','Gray','Wilder','Frost','Hale','Sage','Reed','Blake','West','Day','Brook'];let positions=['GK','LB','CB','RB','CM','LM','RM','SS','CF','LW','RW'];return Array.from({length:6},(_,i)=>{let pos=positions[integer(r,0,positions.length-1)];let p=player('m'+s.season+'-'+s.round+'-'+i,first[integer(r,0,first.length-1)]+' '+last[integer(r,0,last.length-1)],pos,r,integer(r,-1,8));p.fee=Math.round((rating(p)*1.4+integer(r,0,15))/5)*5;p.wage=Math.max(2,Math.round(rating(p)/17));return p;}).filter(p=>!s.marketBought.includes(p.id));}
  function buy(s,id){if(s.round>=10)return 'Start the next season first.';if(s.roster.length>=20)return 'Squad is full (20 players).';const p=market(s).find(x=>x.id===id);if(!p)return 'Player is no longer available.';if(s.cash<p.fee)return 'Not enough cash for this transfer.';s.cash-=p.fee;s.marketBought.push(id);delete p.fee;s.roster.push(p);return null;}
  function lineupStrength(s){let attack=0,defense=0,fitness=0;FORMATIONS[s.formation].forEach((slot,i)=>{let p=s.roster.find(x=>x.id===s.lineup[i]), f=fit(p.pos,slot)*(0.55+0.45*p.fitness/100);attack+=(p.attack*.7+p.stamina*.3)*f;defense+=(p.defense*.7+p.stamina*.3)*f;fitness+=p.fitness;});attack/=11;defense/=11;if(s.tactic==='attacking'){attack*=1.1;defense*=0.91;}if(s.tactic==='defensive'){attack*=0.91;defense*=1.1;}return {attack,defense,fitness:fitness/11};}
  function poisson(r,mean){let n=0,p=1,limit=Math.exp(-mean);do{n++;p*=r();}while(p>limit&&n<10);return n-1;}
  function standings(s){const rows=TEAMS.map((name,id)=>({id,name,played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));s.fixtures.flat().forEach(g=>{if(!g.score)return;let [a,b]=g.score,h=rows[g.home],v=rows[g.away];h.played++;v.played++;h.gf+=a;h.ga+=b;v.gf+=b;v.ga+=a;if(a>b){h.w++;v.l++;h.pts+=3;}else if(a<b){v.w++;h.l++;v.pts+=3;}else{h.d++;v.d++;h.pts++;v.pts++;}});return rows.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.id-b.id);}
  function match(s){if(s.round>=10)return 'Season complete. Start a new season.';const r=rng(hash('match:'+s.seed+':'+s.season+':'+s.round));const strength=lineupStrength(s), ai=[0,58,61,64,60,62];let userResult=null;for(const g of s.fixtures[s.round]){let h=g.home===0?strength:{attack:ai[g.home],defense:ai[g.home]},a=g.away===0?strength:{attack:ai[g.away],defense:ai[g.away]};let hg=poisson(r,clamp(1.35+(h.attack-a.defense)*.045+.2,.25,3.5)),ag=poisson(r,clamp(1.25+(a.attack-h.defense)*.045,.25,3.5));g.score=[hg,ag];if(g.home===0||g.away===0){let us=g.home===0?hg:ag,them=g.home===0?ag:hg;userResult={opponent:TEAMS[g.home===0?g.away:g.home],home:g.home===0,us,them,outcome:us>them?'Win':us<them?'Loss':'Draw',attack:Math.round(strength.attack),defense:Math.round(strength.defense)};}}
    const wages=s.roster.reduce((n,p)=>n+p.wage,0),income=75+(userResult.outcome==='Win'?25:userResult.outcome==='Draw'?12:0);s.cash+=income-wages;s.roster.forEach(p=>{let starting=s.lineup.includes(p.id);p.fitness=clamp(p.fitness-(starting?Math.max(12,Math.round(25-p.stamina/10)):0)+(starting?9:25),0,100);});s.round++;s.training=3;s.marketBought=[];s.lastMatch={...userResult,income,wages,net:income-wages,round:s.round,season:s.season};return null;
  }
  function nextSeason(s){if(s.round<10)return 'Finish the current season first.';const place=standings(s).findIndex(x=>x.id===0)+1;const prize=[150,110,80,60,45,30][place-1];s.cash+=prize;s.history.unshift({season:s.season,place,prize});s.history=s.history.slice(0,20);s.season++;s.round=0;s.fixtures=fixtures();s.marketBought=[];s.training=3;s.roster.forEach(p=>{p.fitness=100;p.trainedWeek='';});return null;}
  return {FORMATIONS,TEAMS,TRAIN,create,valid,fit,rating,changeFormation,assign,train,market,buy,lineupStrength,standings,match,nextSeason};
});
