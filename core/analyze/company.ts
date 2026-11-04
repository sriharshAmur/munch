import type {Order} from '../schema';
import {delivered,sum} from './shared';
import {rhythm} from './rhythm';
export function company(orders:Order[]) {const o=delivered(orders),group=o.filter(v=>v.group.isGroup),solo=o.filter(v=>!v.group.isGroup),known=group.flatMap(v=>v.group.groupSize===null?[]:[v.group.groupSize]);return {solo:solo.length,group:group.length,groupShare:o.length?group.length/o.length:0,soloAverage:solo.length?Math.round(sum(solo.map(v=>v.money.total))/solo.length):0,groupAverage:group.length?Math.round(sum(group.map(v=>v.money.total))/group.length):0,averageGroupSize:known.length?sum(known)/known.length:0,cells:rhythm(group).cells};}
