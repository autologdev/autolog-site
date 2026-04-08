function toggleFaq(btn) {
  var item = btn.parentElement;
  while (item && !item.classList.contains('faq-item')) {
    item = item.parentElement;
  }
  if (!item) return;
  var isOpen = item.classList.contains('open');
  var all = document.querySelectorAll('.faq-item');
  for (var i = 0; i < all.length; i++) { all[i].classList.remove('open'); }
  if (!isOpen) item.classList.add('open');
}

(function() {
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    var open = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', function(e) {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  var links = mobileNav.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function() {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  }
})();
