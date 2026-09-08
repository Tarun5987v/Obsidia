document.addEventListener('DOMContentLoaded', function(){
  const wrap = document.querySelector('.filters-wrap');
  if(!wrap) return;
  const scroller = wrap.querySelector('#filters');
  const prev = wrap.querySelector('.filters-btn.prev');
  const next = wrap.querySelector('.filters-btn.next');
  const SCROLL_AMOUNT = 220;

  function updateButtons(){
    if(!scroller) return;
    prev.style.display = scroller.scrollLeft > 8 ? 'flex' : 'none';
    next.style.display = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 8 ? 'flex' : 'none';
  }

  // position next button to avoid overlapping the tax toggle (if present)
  const taxToggle = wrap.querySelector('.tax-toggle');
  function positionButtons(){
    const baseOffset = 6; // default inset
    if(taxToggle && next){
      const pad = baseOffset + taxToggle.offsetWidth + 18; // increased gap to avoid overlap
      next.style.right = pad + 'px';
    } else if(next){
      next.style.right = baseOffset + 'px';
    }
    if(prev) prev.style.left = baseOffset + 'px';
  }

  let scrollInterval;
  function startScroll(direction){
    stopScroll();
    scrollInterval = setInterval(()=>{
      scroller.scrollBy({ left: direction * 20, behavior: 'smooth' });
    }, 60);
  }
  function stopScroll(){ if(scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; }}

  prev.addEventListener('click', ()=>{ scroller.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' }); });
  next.addEventListener('click', ()=>{ scroller.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' }); });

  // support press-and-hold
  prev.addEventListener('mousedown', ()=> startScroll(-1));
  next.addEventListener('mousedown', ()=> startScroll(1));
  document.addEventListener('mouseup', stopScroll);
  prev.addEventListener('mouseleave', stopScroll);
  next.addEventListener('mouseleave', stopScroll);

  scroller.addEventListener('scroll', updateButtons);
  window.addEventListener('resize', updateButtons);
  window.addEventListener('resize', positionButtons);
  updateButtons();
  positionButtons();

  // make individual filters keyboard accessible
  scroller.querySelectorAll('.filter').forEach(el => {
    el.setAttribute('tabindex','0');
    el.setAttribute('role','button');
    el.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); el.click();
      }
    });
  });

  // Tax toggle behavior (persist in localStorage)
  const taxSwitch = document.querySelector('.tax-switch');
  if(taxSwitch){
    const STATE_KEY = 'display_total_before_taxes';
    // initialize from storage
    const stored = localStorage.getItem(STATE_KEY);
    if(stored === 'true') taxSwitch.setAttribute('aria-checked','true');

    const taxLabel = document.querySelector('.tax-label');
    const gstNodes = document.querySelectorAll('.gst_p');

    function applyTaxUI(checked){
      if(checked){
        if(taxLabel) taxLabel.textContent = 'Display total before taxes';
        gstNodes.forEach(n => n.style.display = 'inline');
      } else {
        if(taxLabel) taxLabel.textContent = 'Display total after taxes';
        gstNodes.forEach(n => n.style.display = 'none');
      }
    }
    // initialize UI state
    const initialChecked = taxSwitch.getAttribute('aria-checked') === 'true';
    applyTaxUI(initialChecked);

    function toggleTaxState(next){
      const is = typeof next === 'boolean' ? next : taxSwitch.getAttribute('aria-checked') === 'true';
      const newState = !is;
      taxSwitch.setAttribute('aria-checked', String(newState));
      localStorage.setItem(STATE_KEY, String(newState));
      // dispatch event for other code to react
      taxSwitch.dispatchEvent(new CustomEvent('taxchange', { detail: { checked: newState } }));
    }

    taxSwitch.addEventListener('click', ()=> toggleTaxState());
    taxSwitch.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTaxState(); } });
    taxSwitch.addEventListener('taxchange', (e)=> applyTaxUI(Boolean(e.detail && e.detail.checked)));
  }
});