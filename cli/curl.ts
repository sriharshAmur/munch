export type BrowserRequest={method:string;url:string;headers:Record<string,string>;body?:string};
export function shellWords(input:string):string[] {
 const words:string[]=[];let word='',quote:'single'|'double'|'ansi'|null=null,started=false;
 input=input.replace(/\\\r?\n/g,'');
 for(let i=0;i<input.length;i++){const c=input[i]??'',next=input[i+1]??'';
  if(quote==='single'){if(c==="'")quote=null;else word+=c;continue;}
  if(quote==='ansi'){if(c==="'"){quote=null;continue;}if(c==='\\'){const escapes:Record<string,string>={n:'\n',r:'\r',t:'\t',"'":"'",'\\':'\\'};if(next==='x'){const hex=input.slice(i+2,i+4);if(/^[\da-f]{2}$/i.test(hex)){word+=String.fromCharCode(parseInt(hex,16));i+=3;continue;}}word+=escapes[next]??next;i++;}else word+=c;continue;}
  if(quote==='double'){if(c==='"')quote=null;else if(c==='\\'&&['"','\\','$','`'].includes(next)){word+=next;i++;}else word+=c;continue;}
  if(c==='$'&&next==="'"){quote='ansi';started=true;i++;continue;}if(c==="'"||c==='"'){quote=c==="'"?'single':'double';started=true;continue;}if(c==='\\'){word+=next;started=true;i++;continue;}if(/\s/.test(c)){if(started){words.push(word);word='';started=false;}}else{word+=c;started=true;}
 }
 if(quote)throw Error('The copied cURL has an unfinished quote. Copy it again.');if(started)words.push(word);return words;
}
export function parseCurl(input:string):BrowserRequest {
 const words=shellWords(input);if(words[0]!=='curl')throw Error('Copy the request as cURL (bash), then run the command again.');let method='GET',url='',body:string|undefined;const headers:Record<string,string>={};
 for(let i=1;i<words.length;i++){const word=words[i]??'',take=()=>words[++i]??'';
  if(word==='-H'||word==='--header'){const value=take(),colon=value.indexOf(':');if(colon>0)headers[value.slice(0,colon).trim().toLowerCase()]=value.slice(colon+1).trim();}
  else if(word==='-b'||word==='--cookie')headers.cookie=take();
  else if(word==='-X'||word==='--request')method=take().toUpperCase();
  else if(['--data','--data-raw','--data-binary','--data-ascii','-d'].includes(word)){body=take();if(method==='GET')method='POST';}
  else if(word==='--url')url=take();else if(/^https?:\/\//.test(word))url=word;
 }
 let parsed:URL;try{parsed=new URL(url);}catch{throw Error('The copied cURL has no valid website URL. Copy it again.');}if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(parsed.hostname))throw Error('The request must use HTTPS.');
 return {method,url:parsed.href,headers,...(body===undefined?{}:{body})};
}
export function redactedSummary(request:BrowserRequest){const auth:string[]=[];if(request.headers.authorization)auth.push(request.headers.authorization.toLowerCase().startsWith('bearer ')?'bearer token':'authorization');if(request.headers.cookie)auth.push(`${request.headers.cookie.split(';').filter(v=>v.trim()).length} cookies`);return auth.join(', ')||'no session headers';}
