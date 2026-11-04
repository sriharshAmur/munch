import {mkdir,rename} from 'node:fs/promises';
import {normalizeDetail} from './normalize';
import {OrdersFileSchema,type Order} from '../../../core/schema';

export async function build(){
 const paths=[...new Bun.Glob('*.json').scanSync('data/raw/thuisbezorgd/orders')].map(name=>`data/raw/thuisbezorgd/orders/${name}`);
 const probe='data/raw/thuisbezorgd/probes/order-detail.json';
 if(!paths.length&&await Bun.file(probe).exists())paths.push(probe);
 if(!paths.length)throw Error('No stored orders yet. Run munch fetch first.');
 const orders:Order[]=[];
 const problems=new Map<string,number>();
 for(const path of paths){try{const input:unknown=await Bun.file(path).json();orders.push(normalizeDetail(input));}catch(error){const message=error instanceof Error?error.message:'Could not parse a stored order.';problems.set(message,(problems.get(message)??0)+1);}}
 if(problems.size){process.stdout.write(`Orders parsed: ${orders.length}. Problems: ${paths.length-orders.length}.\n`);for(const [message,count]of problems)process.stdout.write(`${count} orders: ${message}\n`);throw Error('Build stopped. The previous orders file was kept.');}
 const unique=[...new Map(orders.map(o=>[o.id,o])).values()].sort((a,b)=>Date.parse(a.placedAt)-Date.parse(b.placedAt));
 const homeKeys=new Map<string,string>();
 for(const order of unique){const area=`${order.home.postcode}:${order.home.city.toLocaleLowerCase('nl-NL')}`;let key=homeKeys.get(area);if(!key){key=String(homeKeys.size+1);homeKeys.set(area,key);}order.home.key=key;}
 const file=OrdersFileSchema.parse({version:1,source:'thuisbezorgd',generatedAt:new Date().toISOString(),orders:unique});
 await mkdir('data',{recursive:true});await Bun.write('data/orders.next.json',JSON.stringify(file));await rename('data/orders.next.json','data/orders.json');
 process.stdout.write(`Built ${unique.length} orders.\n`);
}
