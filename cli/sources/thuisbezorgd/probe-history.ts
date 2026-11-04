import {parseCurl} from '../../curl';
import {politeClient} from '../../http';
import {responseShape} from '../../shape';
try {
const clipboard=Bun.spawn(['pbpaste'],{stdout:'pipe',stderr:'ignore'});
const request=parseCurl(await new Response(clipboard.stdout).text());
request.url='https://rest.api.eu-central-1.production.jet-external.com/consumer/me/orders/nl?ratingsOutOfFive=true';
request.method='GET';delete request.body;
const response=await politeClient()(request),text=await response.text();
await Bun.write('shapes/orders.json',JSON.stringify(responseShape(text,response.headers.get('content-type')??''),null,2));
await Bun.write('data/raw/thuisbezorgd/pages/first.json',text);
process.stdout.write(`History request: ${response.status}. Redacted shape saved.\n`);

} catch(error) { process.stderr.write(`${error instanceof Error ? error.message : 'The history request failed.'}\n`); process.exitCode=1; }
