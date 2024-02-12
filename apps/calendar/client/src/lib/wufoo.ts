/* eslint-disable no-empty */
/* eslint-disable no-undef */
var q1llzwkr1sa7rtj;
(function (d, t) {
  var s = d.createElement(t),
    options = {
      userName: 'vttbzh',
      formHash: 'q1llzwkr1sa7rtj',
      autoResize: true,
      height: '963',
      async: true,
      host: 'wufoo.com',
      header: 'show',
      ssl: true,
    };
  s.src = ('https:' == d.location.protocol ? 'https://' : 'http://') + 'secure.wufoo.com/scripts/embed/form.js';
  s.onload = s.onreadystatechange = function () {
    var rs = this.readyState;
    if (rs) if (rs != 'complete') if (rs != 'loaded') return;
    try {
      q1llzwkr1sa7rtj = new WufooForm();
      q1llzwkr1sa7rtj.initialize(options);
      q1llzwkr1sa7rtj.display();
    } catch (e) {}
  };
  var scr = d.getElementsByTagName(t)[0],
    par = scr.parentNode;
  par.insertBefore(s, scr);
})(document, 'script');
