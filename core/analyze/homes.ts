import type {Order} from '../schema';
import {delivered,groups,typical} from './shared';
import {summary} from './summary';
import {regulars} from './regulars';
export function homes(orders:Order[]) {return [...groups(delivered(orders),v=>v.home.key)].map(([key,rows])=>({key,city:rows[0]?.home.city??'',...summary(rows),restaurant:regulars(rows).places[0]?.name??'',cuisine:[...groups(rows,v=>v.restaurant.cuisines[0]??'Other')].sort((a,b)=>b[1].length-a[1].length)[0]?.[0]??'',typical:typical(rows)}));}
