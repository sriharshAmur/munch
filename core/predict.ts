import type {Order} from './schema';
import {DAY,local,median,sorted,sum} from './analyze/shared';
export function predict(orders:Order[],now:string) {
 const timestamp=Date.parse(now),history=sorted(orders).filter(o=>Date.parse(o.placedAt)<timestamp);
 const latest=history.at(-1);
 if(history.length<10||!latest)return null;
 const weighted=history.map(o=>({order:o,parts:local(o.placedAt),weight:Math.pow(.5,(timestamp-Date.parse(o.placedAt))/DAY/120)}));
 const gaps=history.slice(1).map((o,i)=>(Date.parse(o.placedAt)-Date.parse(history[i]?.placedAt??o.placedAt))/DAY);
 const typicalGap=Math.max(.5,median(gaps));
 const candidates=Array.from({length:168},(_,i)=>{const time=new Date(Math.ceil(timestamp/3600000)*3600000+i*3600000).toISOString(),p=local(time);const rate=sum(weighted.map(w=>{const hourDistance=Math.min(Math.abs(w.parts.hour-p.hour),24-Math.abs(w.parts.hour-p.hour));return w.weight*(w.parts.weekday===p.weekday?1:.06)*Math.exp(-hourDistance*hourDistance/2);}));const gap=(Date.parse(time)-Date.parse(latest.placedAt))/DAY;const gapFactor=(1-Math.exp(-gap/typicalGap))*Math.exp(-i/96);return {time,...p,score:rate*gapFactor};});
 const window=[...candidates].sort((a,b)=>b.score-a.score)[0];
 if(!window)return null;
 const scores=new Map<string,{id:string;name:string;score:number}>();
 for(const w of weighted){const r=w.order.restaurant;const context=(w.parts.weekday===window.weekday?1:.2)*(Math.floor(w.parts.hour/4)===Math.floor(window.hour/4)?1:.2);const score=w.weight*(.12+context);const previous=scores.get(r.id);scores.set(r.id,{id:r.id,name:r.name,score:(previous?.score??0)+score});}
 const total=sum([...scores.values()].map(v=>v.score));
 return {window,restaurants:[...scores.values()].sort((a,b)=>b.score-a.score).slice(0,4).map(v=>({...v,score:v.score/total})),sample:history.length};
}
export function backtest(orders:Order[],limit=100) {
 const history=sorted(orders);let top1=0,top3=0,day=0,tested=0;
 for(let i=Math.max(10,history.length-limit);i<history.length;i++){const target=history[i],previous=history[i-1];if(!target||!previous)continue;const result=predict(history.slice(0,i),new Date(Date.parse(previous.placedAt)+60000).toISOString());if(!result)continue;tested++;if(result.restaurants[0]?.id===target.restaurant.id)top1++;if(result.restaurants.slice(0,3).some(r=>r.id===target.restaurant.id))top3++;if(local(target.placedAt).date===result.window.date)day++;}
 return {tested,top1,top3,day,top1Rate:tested?top1/tested:0,top3Rate:tested?top3/tested:0,dayRate:tested?day/tested:0};
}
