import type {Order} from '../schema';
import {delivered,range,sum} from './shared';
export function summary(orders:Order[]) {const o=delivered(orders),r=range(o),totalSpend=sum(o.map(v=>v.money.total));return {count:o.length,cancelled:orders.length-o.length,...r,totalSpend,restaurants:new Set(o.map(v=>v.restaurant.id)).size,dishes:new Set(o.flatMap(v=>v.items.map(i=>`${v.restaurant.id}:${i.name}`))).size,averageOrder:o.length?Math.round(totalSpend/o.length):0,ordersPerWeek:r.days?o.length/r.days*7:0};}
