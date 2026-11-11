const MANILA_TIMEZONE = 'Asia/Manila';
const toISO = date => `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
const makeUTC = (year, month, day = 1) => new Date(Date.UTC(year, month, day));
function manilaToday() {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:MANILA_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get = type => Number(parts.find(p => p.type === type)?.value);
  return makeUTC(get('year'), get('month')-1, get('day'));
}
export function initCalendar() {
  const today = manilaToday();
  const start = makeUTC(today.getUTCFullYear(), today.getUTCMonth());
  const last = new Date(today.getTime() + 90 * 86400000);
  let offset = 0, selectedDate = '', selectedTime = '';
  const daysHost = document.getElementById('calendar-days');
  const monthLabel = document.getElementById('cal-month');
  const prev = document.getElementById('cal-prev');
  const next = document.getElementById('cal-next');
  const slots = document.querySelectorAll('#time-slots button');
  const maxOffset = (last.getUTCFullYear()-start.getUTCFullYear())*12+last.getUTCMonth()-start.getUTCMonth();
  function render() {
    const month = makeUTC(start.getUTCFullYear(), start.getUTCMonth()+offset);
    const y = month.getUTCFullYear(), m = month.getUTCMonth();
    monthLabel.textContent = month.toLocaleDateString('en-US', { month:'long',year:'numeric',timeZone:'UTC' });
    prev.disabled = offset === 0; next.disabled = offset >= maxOffset;
    daysHost.replaceChildren();
    const mondayIndex = (month.getUTCDay() + 6) % 7;
    for (let i=0;i<mondayIndex;i++){ const gap = document.createElement('span'); gap.className='blank'; daysHost.appendChild(gap); }
    for (let day=1;day<=makeUTC(y,m+1,0).getUTCDate();day++) {
      const dt = makeUTC(y,m,day), dayOfWeek=dt.getUTCDay(), iso=toISO(dt);
      const button = document.createElement('button'); button.type='button'; button.textContent=String(day);
      button.setAttribute('aria-label', dt.toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric',year:'numeric'}));
      button.disabled = dt <= today || dt > last || dayOfWeek === 0 || dayOfWeek === 6;
      button.classList.toggle('is-selected', iso === selectedDate);
      button.setAttribute('aria-pressed', String(iso === selectedDate));
      if (dt.getTime() === today.getTime()) button.classList.add('is-today');
      button.addEventListener('click', () => { selectedDate=iso; render(); });
      daysHost.appendChild(button);
    }
  }
  prev.addEventListener('click', () => { offset=Math.max(0,offset-1); render(); });
  next.addEventListener('click', () => { offset=Math.min(maxOffset,offset+1); render(); });
  slots.forEach(button => button.addEventListener('click', () => {
    selectedTime = button.dataset.time;
    slots.forEach(b => { b.classList.toggle('is-selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  }));
  render();
  return { getSelection: () => ({date:selectedDate,time:selectedTime,timezone:MANILA_TIMEZONE}), reset: () => {selectedDate='';selectedTime='';slots.forEach(b => {b.classList.remove('is-selected');b.setAttribute('aria-pressed','false');});render();} };
}
