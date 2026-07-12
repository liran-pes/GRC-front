// עץ הזית — ניווט בין מסכים (מוקאפ בלבד, ללא לוגיקה עסקית)

function showScreen(target) {
  var section = document.getElementById('screen-' + target);
  if (!section) return;

  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.classList.toggle('active', b.dataset.screen === target);
  });
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  section.classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(function (btn) {
  btn.addEventListener('click', function () {
    location.hash = btn.dataset.screen;
    showScreen(btn.dataset.screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

window.addEventListener('hashchange', function () {
  showScreen(location.hash.replace('#', '') || 'home');
});

if (location.hash) showScreen(location.hash.replace('#', ''));
