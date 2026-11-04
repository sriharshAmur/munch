import type { Order } from '../schema';
import { delivered, local } from './shared';
export type OrderFilter={year?:number;home?:string;restaurant?:string;weekday?:number;hour?:number;month?:string;date?:string;fulfilment?:string;company?:string};
export function applyFilter(orders:Order[],filter:OrderFilter={}) {return delivered(orders).filter(o=>{const p=local(o.placedAt);return (filter.year===undefined||p.year===filter.year)&&(!filter.home||o.home.key===filter.home)&&(!filter.restaurant||o.restaurant.id===filter.restaurant)&&(filter.weekday===undefined||p.weekday===filter.weekday)&&(filter.hour===undefined||p.hour===filter.hour)&&(!filter.month||p.date.startsWith(filter.month))&&(!filter.date||p.date===filter.date)&&(!filter.fulfilment||o.fulfilment===filter.fulfilment)&&(!filter.company||(filter.company==='group')===o.group.isGroup);});}
export const availableYears=(orders:Order[])=>[...new Set(orders.map(o=>local(o.placedAt).year))].sort((a,b)=>a-b);
export const availableHomes=(orders:Order[])=>[...new Map(orders.map(o=>[o.home.key,o.home])).values()];
