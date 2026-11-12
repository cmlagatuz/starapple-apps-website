import { fillBrandMarks } from './brand.js';
import { initMotion } from './motion.js';
import { initForms } from './forms.js';

document.documentElement.classList.add('has-js');
fillBrandMarks();
initMotion();
initForms();
document.getElementById('year').textContent=String(new Date().getFullYear());
const email=window.STARAPPLE_CONFIG?.contactEmail;
if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  const a=document.getElementById('footer-email');a.hidden=false;a.href=`mailto:${email}`;
}
const menu=document.getElementById('nav-links'), toggle=document.getElementById('nav-toggle');
toggle?.addEventListener('click',()=>{
  const open=menu.classList.toggle('open');
  toggle.classList.toggle('is-open',open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  menu.classList.remove('open'); toggle.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');
}));

const inquiryDialogs = [...document.querySelectorAll('.inquiry-dialog')];
document.querySelectorAll('[data-open-dialog]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const dialog = document.getElementById(trigger.dataset.openDialog);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    dialog.showModal();
  });
});
inquiryDialogs.forEach(dialog => {
  dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
});

const dialog=document.getElementById('legal-dialog');
const legalContent={
  privacy:{title:'Privacy information',html:`<p><strong>Website privacy summary — customize and review before public launch.</strong></p><h3>Information collected</h3><p>When you request a meeting or quotation, we collect your name, email, optional organization, the project details you provide, and any attached file. We also process limited technical data to detect abusive submissions.</p><h3>How it is used</h3><p>Submissions are stored in private Firebase Cloud Firestore records. Optional attachments are stored in a private Cloud Storage bucket. The site operator uses this information to respond to your request and plan a potential project. It is not published in the public GitHub showcase.</p><h3>Access and retention</h3><p>Data is accessible to authorized administrators in the connected Firebase project. The operator must establish a deletion and retention schedule before launch. You can ask about access or deletion through the site contact channel.</p><h3>Third-party services</h3><p>The site uses Google Firebase for hosting and submissions, Google Fonts for typography, a third-party video host for the homepage's cinematic backdrop, and the jsDelivr CDN to load the animation (GSAP) and 3D (three.js) libraries. Service providers may process technical data under their own terms.</p><p><em>This is an implementation starter, not a jurisdiction-specific legal privacy policy. Replace or obtain legal review before accepting production submissions.</em></p>`},
  terms:{title:'Website terms',html:`<p><strong>Terms draft — review and customize before public launch.</strong></p><h3>Information, not an offer</h3><p>Content on this website describes potential technology services. Sending a meeting or quotation request does not establish a contract, guarantee a price, or reserve a meeting time.</p><h3>Submissions</h3><p>Only submit information and files you are authorized to share. Do not include passwords, payment-card data, medical records, or other unnecessary sensitive information.</p><h3>Intellectual property</h3><p>The site's original visual design and written content are intended for StarApple Apps LLC. GitHub repository content remains subject to the license specified in each repository.</p><p><em>These starter terms require appropriate legal and company-specific review before public use.</em></p>`}
};
for(const [selector,section] of [['.privacy-trigger','privacy'],['.terms-trigger','terms']]) {
  document.querySelectorAll(selector).forEach(anchor=>anchor.addEventListener('click',event=>{
    event.preventDefault();document.getElementById('legal-title').textContent=legalContent[section].title;
    document.getElementById('legal-body').innerHTML=legalContent[section].html;
    if(typeof dialog.showModal==='function')dialog.showModal();
  }));
}
document.getElementById('legal-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
