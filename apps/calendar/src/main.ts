// css
import 'styles/dist/index.css';

// Vue
import 'styles';
import { setup as setupAnalytics } from 'analytics';
import { createApp } from 'vue';
import App from '@/App.vue';

createApp(App).mount('#calendar');

setupAnalytics(import.meta.env.VITE_APP_MIXPANEL);
