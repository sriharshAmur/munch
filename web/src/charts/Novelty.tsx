import {novelty} from '@core/analyze/novelty';
import type {Order} from '@core/schema';
import {percent,plural} from '@/lib/format';
import {Chapter,Figure} from './primitives';
import {LineChart} from './Line';
export function NoveltyChapter({orders,history}:{orders:Order[];history:Order[]}){const data=novelty(orders,history),last=data.at(-1);return <Chapter id="new-or-familiar" title="New or familiar" lede={last?<>{percent(last.share)} of your {last.year} orders were first visits. {plural(last.count-last.newCount,'order')} went to a place you already knew.</>:'Pick a year with orders to see how often you tried somewhere new.'}><Figure caption="A first visit means the first order at that restaurant in your complete history, even when you filter the view." headers={['Year','First visits','All orders','Share']} rows={data.map(d=>[d.year,d.newCount,d.count,percent(d.share)])}>{data.length>1?<LineChart rows={data.map(d=>({label:String(d.year),value:d.share,search:{year:d.year}}))} label="Share of first visits by year" format={percent}/>:<p className="empty-finding">One year in this view. {last?`${last.newCount} first visits from ${last.count} orders.`:''}</p>}</Figure></Chapter>;}
