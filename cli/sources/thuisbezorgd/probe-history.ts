import {parseCurl} from '../../curl';
import {politeClient} from '../../http';
import {responseShape} from '../../shape';

// Read only Sri's explicitly supplied browser request. Credentials stay in memory.
try {
 const copied = await Bun.file('curl.txt').text();
 const request = parseCurl(copied);
 if (request.method !== 'GET') throw Error('The captured request must read order history.');
 const response = await politeClient()(request);
 const text = await response.text();
 const result = responseShape(text, response.headers.get('content-type') ?? '');
 await Bun.write('shapes/orders.json', JSON.stringify(result, null, 2));
 await Bun.write('data/raw/thuisbezorgd/pages/first.json', text);
 process.stdout.write(`History request: ${response.status}. Redacted shape saved.\n`);
} catch (error) {
 process.stderr.write(`${error instanceof Error ? error.message : 'The history request failed.'}\n`);
 process.exitCode = 1;
}
