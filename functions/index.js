'use strict';
const crypto = require('node:crypto');
const Busboy = require('busboy');
const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

initializeApp();
const db = getFirestore();
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 200 * 1024;
const allowedExtensions = new Set(['pdf','doc','docx','jpg','jpeg','png']);
const allowedMimes = new Set(['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','application/octet-stream']);
const scopes = new Set(['Custom App Development','Web Platforms','IT Consulting','Cloud Infrastructure','Something else / Not sure yet']);
const budgets = new Set(['Under $5,000','$5,000–$15,000','$15,000–$50,000','$50,000+','Let\'s discuss']);
const times = new Set(['09:00','11:00','14:00','16:00']);

class RequestError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
const val = (fields,key) => String(fields[key] || '').trim();
function parseMultipart(req) {
  return new Promise((resolve,reject) => {
    const fields=Object.create(null); let attachment=null, error=null, files=0;
    let parser;
    try {parser=Busboy({headers:req.headers,limits:{fileSize:MAX_FILE_SIZE,files:2,fields:24,fieldSize:10000,parts:28}});}
    catch {reject(new RequestError('Use multipart/form-data.'));return;}
    parser.on('field',(name,value,info)=>{
      if(info.nameTruncated || info.valueTruncated){error=new RequestError('A form field exceeded the allowed length.');return;}
      if(!/^[a-zA-Z]{1,32}$/.test(name) || Object.hasOwn(fields,name)){error=new RequestError('Invalid or duplicate form field.');return;}
      fields[name]=value;
    });
    parser.on('file',(name,stream,info)=>{
      files++;
      if(name!=='attachment' || files>1){error=new RequestError('Only one attachment is permitted.');stream.resume();return;}
      const chunks=[];
      stream.on('limit',()=>{error=new RequestError('Attachment must be 5 MB or less.',413);});
      stream.on('data',chunk=>chunks.push(chunk));
      stream.on('end',()=>{attachment={buffer:Buffer.concat(chunks),filename:info.filename||'',mime:info.mimeType||''};});
    });
    parser.on('partsLimit',()=>{error=new RequestError('Too many form fields.');});
    parser.on('filesLimit',()=>{error=new RequestError('Too many files.');});
    parser.on('fieldsLimit',()=>{error=new RequestError('Too many fields.');});
    parser.on('error',reject);
    parser.on('close',()=>error?reject(error):resolve({fields,attachment}));
    parser.end(req.rawBody);
  });
}
function validate(fields,attachment) {
  const kind=val(fields,'kind'), name=val(fields,'name'), email=val(fields,'email'), company=val(fields,'company'), brief=val(fields,'brief');
  if(!['rfq','meeting'].includes(kind))throw new RequestError('Unknown inquiry type.');
  if(name.length<2||name.length>100)throw new RequestError('Enter a name between 2 and 100 characters.');
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new RequestError('Enter a valid email address.');
  if(company.length>120||brief.length>5000)throw new RequestError('One or more fields are too long.');
  if(attachment){
    if(kind!=='rfq')throw new RequestError('Files can only accompany quote requests.');
    const ext=(attachment.filename.split('.').at(-1)||'').toLowerCase();
    if(!allowedExtensions.has(ext)||!allowedMimes.has(attachment.mime)||!attachment.buffer.length)throw new RequestError('Unsupported attachment type.');
    if(attachment.buffer.length>MAX_FILE_SIZE)throw new RequestError('Attachment must be 5 MB or less.',413);
    // Files are kept private and never rendered or executed by this application.
  }
  if(kind==='rfq'){
    if(!scopes.has(val(fields,'scope'))||!budgets.has(val(fields,'budget'))||brief.length<20)throw new RequestError('Complete the project type, budget, and project brief (at least 20 characters).');
    if(val(fields,'consent')!=='on')throw new RequestError('Consent to contact is required.');
    return {kind,name,email,company,brief,scope:val(fields,'scope'),budget:val(fields,'budget')};
  }
  const meetingDate=val(fields,'meetingDate'), meetingTime=val(fields,'meetingTime'), timezone=val(fields,'timezone');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)||!times.has(meetingTime)||timezone!=='Asia/Manila')throw new RequestError('Select a valid meeting date and time.');
  const dt=new Date(`${meetingDate}T00:00:00Z`);
  if(Number.isNaN(dt.getTime())||dt.toISOString().slice(0,10)!==meetingDate||[0,6].includes(dt.getUTCDay()))throw new RequestError('Meeting dates must be a weekday.');
  // Current date in Manila; dates must be in the future and within 90 days.
  const dateParts= new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=t=>dateParts.find(p=>p.type===t)?.value;
  const todayISO=`${part('year')}-${part('month')}-${part('day')}`;
  const todayDate=new Date(`${todayISO}T00:00:00Z`);
  if(meetingDate<=todayISO||dt.getTime()>todayDate.getTime()+90*86400000)throw new RequestError('Choose a future date within the next 90 days.');
  return {kind,name,email,company,brief,meetingDate,meetingTime,timezone};
}
async function limitByIp(req) {
  // Basic best-effort cap. Use managed bot protection/App Check before large public launches.
  const ip=(req.ip || req.socket?.remoteAddress || 'unknown').slice(0,128);
  const date=new Date().toISOString().slice(0,10);
  const hash=crypto.createHash('sha256').update(`${date}/${ip}/${process.env.RATE_LIMIT_SALT||'starapple-change-salt'}`).digest('hex');
  const ref=db.collection('_inquiryRateLimits').doc(hash);
  return db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    const count=snap.exists?(snap.data().count||0):0;
    if(count>=12)return false;
    tx.set(ref,{count:count+1,expiresAt:Timestamp.fromMillis(Date.now()+7*86400000)});
    return true;
  });
}
exports.submitInquiry=onRequest({region:'asia-southeast1',memory:'256MiB',timeoutSeconds:45,maxInstances:5},async(req,res)=>{
  res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.set('Allow','POST');res.status(405).json({error:'Method not allowed.'});return;}
  const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(origins.length && (!req.headers.origin||!origins.includes(req.headers.origin))){res.status(403).json({error:'This website origin is not authorized.'});return;}
  if(!req.is('multipart/form-data')){res.status(415).json({error:'Expected multipart/form-data.'});return;}
  if((req.rawBody?.length||0)>MAX_REQUEST_SIZE){res.status(413).json({error:'Request is too large.'});return;}
  try {
    const {fields,attachment}=await parseMultipart(req);
    if(val(fields,'website')){res.status(200).json({reference:'RECEIVED'});return;}
    const inquiry=validate(fields,attachment);
    if(!(await limitByIp(req))){res.status(429).json({error:'Too many requests from this connection today. Please try again tomorrow.'});return;}
    const doc=db.collection('inquiries').doc();let storedPath=null;
    try {
      if(attachment){
        const safeName=attachment.filename.replace(/[^\w.\-]/g,'_').slice(0,110)||'attachment';
        storedPath=`inquiries/${doc.id}/${crypto.randomUUID()}-${safeName}`;
        await getStorage().bucket().file(storedPath).save(attachment.buffer,{resumable:false,metadata:{contentType:attachment.mime,cacheControl:'private, no-store'}});
      }
      await doc.set({ ...inquiry, status:'new', createdAt:FieldValue.serverTimestamp(), attachment:storedPath?{storagePath:storedPath, originalFilename:attachment.filename,contentType:attachment.mime,size:attachment.buffer.length}:null });
    }catch(err){
      if(storedPath)await getStorage().bucket().file(storedPath).delete({ignoreNotFound:true}).catch(()=>{});
      throw err;
    }
    res.status(201).json({reference:`SAP-${doc.id.slice(0,10).toUpperCase()}`});
  } catch(err){
    if(err instanceof RequestError){res.status(err.status).json({error:err.message});return;}
    logger.error('Inquiry submission failed',err);
    res.status(500).json({error:'Could not store the inquiry. Please try again later.'});
  }
});
