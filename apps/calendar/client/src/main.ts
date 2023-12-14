// css
import 'styles/dist/index.css';

// Vue
import 'styles';
import { createApp } from 'vue';
import SearchEventView from '@/views/SearchEventView.vue';
import AddEventView from '@/views/AddEventView.vue';

createApp(SearchEventView).mount('#calendar');
createApp(AddEventView).mount('#calendar-add');
