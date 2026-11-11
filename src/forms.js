import { initCalendar } from './calendar.js';
import { burstConfetti } from './motion.js';
const $ = id => document.getElementById(id);
const fileMax = 5 * 1024 * 1024;
function showMessage(el, message, type = '') {
  el.textContent = message; el.className = `form-message ${type}`;
}
function validateInputs(parent) {
  for (const el of parent.querySelectorAll('input:not([type="hidden"]),select,textarea')) {
    if (!el.checkValidity()) { el.reportValidity(); el.focus(); return false; }
  }
  return true;
}
async function submit(formData) {
  const url = window.STARAPPLE_CONFIG?.apiEndpoint || '/api/inquiries';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { method: 'POST', body: formData, signal: controller.signal });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json().catch(() => ({})) : {};
    if (response.status === 404 || response.status === 502 || response.status === 503 || !isJson)
      throw new Error('Our contact service is temporarily unavailable. Please try again later.');
    if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Your request could not be submitted. Please try again later.');
    if (typeof payload.reference !== 'string' || !/^SAP-[A-Z0-9]{10}$/.test(payload.reference))
      throw new Error('We could not confirm your request. Please contact us before submitting again.');
    return payload.reference;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    if (err instanceof TypeError) throw new Error('Network unavailable. Check your connection or Firebase API deployment.');
    throw err;
  } finally { clearTimeout(timer); }
}
async function withSubmitting(button, fn) {
  button.disabled = true;
  const label = button.innerHTML;
  button.textContent = 'Sending securely…';
  try { await fn(); } finally { button.disabled = false; button.innerHTML = label; }
}
export function initForms() {
  const calendar = initCalendar();
  const meetingForm = $('meeting-form'), meetingMessage = $('meeting-message');
  meetingForm.addEventListener('submit', async event => {
    event.preventDefault(); showMessage(meetingMessage, '');
    if (!validateInputs(meetingForm)) return;
    const {date,time,timezone} = calendar.getSelection();
    if (!date || !time) { showMessage(meetingMessage, 'Please choose both a preferred date and a time.', 'error'); return; }
    const fd = new FormData(meetingForm);
    fd.set('kind','meeting'); fd.set('meetingDate',date); fd.set('meetingTime',time); fd.set('timezone',timezone);
    await withSubmitting(meetingForm.querySelector('[type="submit"]'), async () => {
      try {
        const ref = await submit(fd);
        showMessage(meetingMessage, `Received! Your request reference is ${ref}. A meeting is not confirmed until we reply.`, 'success');
        meetingForm.reset(); calendar.reset(); burstConfetti();
      } catch (err) { showMessage(meetingMessage, err.message, 'error'); }
    });
  });

  const rfqForm=$('rfq-form'), steps=Array.from(document.querySelectorAll('[data-step]'));
  const back=$('rfq-back'), next=$('rfq-next'), send=$('rfq-submit'), message=$('rfq-message');
  let step=0;
  function setStep(num) {
    step=num;
    steps.forEach((el, index) => el.hidden=index!==step);
    $('step-counter').textContent=`STEP 0${step+1} OF 03`;
    $('step-progress-fill').style.width=`${((step+1)/3)*100}%`;
    back.hidden=step===0; next.hidden=step===2; send.hidden=step!==2;
    showMessage(message, '');
    if (step===2) {
      const values=new FormData(rfqForm);
      $('rfq-review').textContent=`${values.get('name') || 'Your name'} · ${values.get('email') || 'Email'}\n${values.get('scope') || 'Project type'} · ${values.get('budget') || 'Budget'}\n${String(values.get('brief') || '').slice(0,180)}${String(values.get('brief') || '').length>180?'…':''}`;
      $('rfq-review').style.whiteSpace='pre-line';
    }
  }
  next.addEventListener('click', () => {if (validateInputs(steps[step])) {setStep(Math.min(2,step+1));}});
  back.addEventListener('click', () => setStep(Math.max(0,step-1)));
  document.querySelectorAll('[data-service]').forEach(card => card.addEventListener('click', event => {
    $('rfq-scope').value = card.dataset.service;
    const dialog = $('rfq-dialog');
    if (dialog && typeof dialog.showModal === 'function') {
      event.preventDefault();
      if (!dialog.open) dialog.showModal();
    }
  }));
  const file=$('rfq-file');
  file.addEventListener('change', () => {
    const selected=file.files?.[0];
    $('upload-filename').textContent=selected ? `${selected.name} (${(selected.size/1024/1024).toFixed(2)} MB)` : 'No file selected';
    if (selected && selected.size>fileMax) {showMessage(message,'The attachment must be 5 MB or less.','error');file.value='';$('upload-filename').textContent='No file selected';}
    else showMessage(message,'');
  });
  rfqForm.addEventListener('submit', async event => {
    event.preventDefault(); showMessage(message,'');
    for (let i=0;i<steps.length;i++) if (!validateInputs(steps[i])) { setStep(i); validateInputs(steps[i]); return; }
    if (file.files?.[0]?.size>fileMax) {showMessage(message,'Maximum file size is 5 MB.','error');return;}
    const fd=new FormData(rfqForm);fd.set('kind','rfq');
    await withSubmitting(send, async () => {
      try {
        const ref=await submit(fd);
        rfqForm.reset(); $('upload-filename').textContent='No file selected'; setStep(0);
        showMessage(message, `Success — your quotation request is saved. Reference: ${ref}. We'll reach out using your email address.`, 'success');
        burstConfetti();
      } catch (err) {showMessage(message,err.message,'error');}
    });
  });
  setStep(0);
}
