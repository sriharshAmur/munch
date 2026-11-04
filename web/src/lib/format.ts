export const number=(n:number)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:0}).format(n);
export const euros=(cents:number,whole=false)=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:whole?0:2,maximumFractionDigits:whole?0:2}).format(cents/100);
export const percent=(share:number)=>`${Math.round(share*100)}%`;
export const date=(iso:string,long=false)=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Amsterdam',...(long?{day:'numeric',month:'long',year:'numeric'}:{weekday:'short',day:'numeric',month:'short'})}).format(new Date(iso));
export const month=(iso:string)=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Amsterdam',month:'long',year:'numeric'}).format(new Date(iso));
export const time=(hour:number)=>`${String(hour%24).padStart(2,'0')}:00`;
export const plural=(count:number,word:string)=>`${number(count)} ${word}${count===1?'':'s'}`;
