// עץ הזית — ניווט בין מסכים (מוקאפ בלבד, ללא לוגיקה עסקית)

document.querySelectorAll('.nav-item').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    var target = btn.dataset.screen;
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    document.getElementById('screen-' + target).classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
