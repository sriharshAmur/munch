import {useMemo} from 'react';
import {Link} from '@tanstack/react-router';
import {useData} from '@/data/provider';
import {useFilters} from '@/lib/search';
import {summary} from '@core/analyze/summary';
import {rhythm} from '@core/analyze/rhythm';
import {regulars} from '@core/analyze/regulars';
import {dishes} from '@core/analyze/dishes';
import {applyFilter} from '@core/analyze/filter';
import {weekdays} from '@core/analyze/shared';
import {month,number,percent,time} from '@/lib/format';
import {Plate} from '@/charts/Plate';
import {Figure} from '@/charts/primitives';
export function Story(){const {state}=useData(),filters=useFilters();const history=state.kind==='ready'?state.file.orders:[];const orders=useMemo(()=>applyFilter(history,filters),[history,filters]);const findings=useMemo(()=>({summary:summary(orders),rhythm:rhythm(orders),regulars:regulars(orders),dishes:dishes(orders,history)}),[orders,history]);const s=findings.summary,r=findings.rhythm,top=findings.dishes.cuisineRank[0];return <article className="story" data-source={state.kind==='ready'?(state.demo?'demo':'local'):'empty'} data-order-count={orders.length}><section className="story-hero"><div className="hero-copy"><h1 className="text-display">{number(s.count)} orders<br/>since {s.first?month(s.first):'the beginning'}.</h1><p className="text-lede">{s.count<5?`${s.count} orders so far. A little more history will tell a fuller story.`:<>Mostly {weekdays[r.peak.weekday]?.toLowerCase()}s around {time(r.peak.hour)}, a taste for {top?.toLowerCase()??'your usual'}, and {percent(findings.regulars.topThreeShare)} of your orders from just three places.</>}</p><div className="hero-meta"><span>{s.restaurants} restaurants</span><span>{new Set(orders.map(o=>o.home.key)).size} {new Set(orders.map(o=>o.home.key)).size===1?'home':'homes'}</span><span>One dot, one dinner.</span></div></div><div className="hero-figure"><Figure caption="Time of day around the rim. Your first order at the centre, your latest at the edge." headers={['Date','Restaurant','Total']} rows={orders.map(o=>[o.placedAt,o.restaurant.name,(o.money.total/100).toFixed(2)])}><Plate orders={orders}/><div className="legend"><span><i/>On your own</span><span><i className="group"/>Group order</span></div></Figure></div></section><nav className="story-index" aria-label="In your story"><a href="#your-week">Your week</a><a href="#the-years">The years</a><a href="#your-regulars">Your regulars</a><a href="#the-cost">The cost</a><a href="#next-order">Next order</a><Link to="/orders" search={filters}>Every order</Link></nav><div id="chapters"/><p className="story-end"><Link to="/orders" search={filters}>Every order is in the explorer.</Link></p></article>;}
