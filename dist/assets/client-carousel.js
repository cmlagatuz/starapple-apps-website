/**
 * Responsive, accessible two-client showcase.
 * Native section navigation is untouched; slides use only the horizontal track.
 */
export function initClientCarousel() {
  const carousel=document.querySelector('[data-client-carousel]');
  if (!carousel) return;
  const track=carousel.querySelector('[data-client-track]');
  const slides=[...carousel.querySelectorAll('[data-client-slide]')];
  const dots=[...carousel.querySelectorAll('[data-client-dot]')];
  const counter=carousel.querySelector('[data-client-counter]');
  const progress=carousel.querySelector('[data-client-progress]');
  const prev=carousel.querySelector('[data-client-prev]');
  const next=carousel.querySelector('[data-client-next]');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let current=0;
  let visible=false;
  let hovering=false;
  let focused=false;
  let touched=false;
  let timer=0;
  let pointerStart=null;

  if (!track || slides.length<2 || !prev || !next) return;

  function stop() { window.clearTimeout(timer);timer=0; }
  function schedule() {
    stop();
    if (!visible||hovering||focused||touched||reduced.matches||document.hidden) return;
    timer=window.setTimeout(()=>show(current+1,false),7200);
  }
  function show(index,userInitiated=true) {
    current=((index%slides.length)+slides.length)%slides.length;
    track.style.transform=`translate3d(-${current*100}%,0,0)`;
    slides.forEach((slide,i)=>{
      const active=i===current;
      slide.classList.toggle('is-active',active);
      slide.setAttribute('aria-hidden',String(!active));
      slide.toggleAttribute('inert',!active);
    });
    dots.forEach((dot,i)=>{
      dot.classList.toggle('is-active',i===current);
      dot.setAttribute('aria-pressed',String(i===current));
    });
    counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    progress.style.width=`${100*(current+1)/slides.length}%`;
    if (userInitiated) {
      const heading=slides[current].querySelector('h3')?.textContent || 'client';
      carousel.setAttribute('aria-label',`Featured clients — showing ${heading}`);
    }
    schedule();
  }
  prev.addEventListener('click',()=>show(current-1));
  next.addEventListener('click',()=>show(current+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  carousel.addEventListener('keydown',e=>{
    if (e.key==='ArrowLeft' || e.key==='ArrowRight') {
      e.preventDefault();
      show(current+(e.key==='ArrowRight'?1:-1));
    }
  });
  carousel.addEventListener('pointerenter',()=>{ hovering=true;stop(); });
  carousel.addEventListener('pointerleave',()=>{ hovering=false;schedule(); });
  carousel.addEventListener('focusin',()=>{ focused=true;stop(); });
  carousel.addEventListener('focusout',e=>{
    if (!carousel.contains(e.relatedTarget)) { focused=false;schedule(); }
  });
  carousel.addEventListener('pointerdown',e=>{
    if (e.pointerType==='mouse') return;
    pointerStart={x:e.clientX,y:e.clientY};
    touched=true;
    stop();
  },{passive:true});
  carousel.addEventListener('pointerup',e=>{
    if (pointerStart) {
      const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;
      pointerStart=null;
      if (Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)) show(current+(dx<0?1:-1));
    }
    touched=false;
    schedule();
  },{passive:true});
  carousel.addEventListener('pointercancel',()=>{pointerStart=null;touched=false;schedule();});
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener?.('change',schedule);
  if ('IntersectionObserver' in window) {
    const io=new IntersectionObserver(entries=>{
      visible=Boolean(entries[0]?.isIntersecting);
      schedule();
    },{threshold:.22});
    io.observe(carousel);
  } else visible=true;
  show(0,false);
}
