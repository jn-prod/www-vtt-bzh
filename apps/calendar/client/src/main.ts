// css
import 'styles/dist/index.css';

// Vue
import 'styles';
import { createApp } from 'vue';
import SearchEventView from '@/views/SearchEventView/SearchEventView.vue';
import AddEventView from '@/views/AddEventView/AddEventView.vue';

createApp(SearchEventView).mount('#calendar');
createApp(AddEventView).mount('#calendar-add');
