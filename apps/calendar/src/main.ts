// css
import 'styles/dist/index.css';
import '@/styles/cookies.scss';

// js
import './utils/analytics';

// Vue
import 'styles';
import { createApp } from 'vue';
import App from '@/App.vue';

createApp(App).mount('#calendar');
