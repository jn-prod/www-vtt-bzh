// fonts
import './assets/fonts/Roboto_Condensed/RobotoCondensed-Regular.ttf';
import './assets/fonts/Roboto_Condensed/RobotoCondensed-Bold.ttf';

// css
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './assets/css/cookies.scss';
import './assets/css/global.scss';

// Vue
import Vue from 'vue';
import App from './App.vue';

// js
import 'jquery';
import 'popper.js';
import 'bootstrap';
import 'cookieconsent';
import '@fortawesome/fontawesome-free/js/all';
import './utils/cookies';

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
