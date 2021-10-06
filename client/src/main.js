// fonts
import './assets/fonts/RobotoCondensed-Regular.ttf';
import './assets/fonts/RobotoCondensed-Bold.ttf';

// images
import './assets/images/banner-min.jpg';

// css
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './assets/css/cookies.scss';
import './assets/css/global.scss';

// Vue
import { createApp } from 'vue';
import App from './App.vue';

// js
import 'jquery';
import 'popper.js';
import 'bootstrap';
import 'cookieconsent';
import '@fortawesome/fontawesome-free/js/all';
import './utils/cookies';

createApp(App).mount('#app');
