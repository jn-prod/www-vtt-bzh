import { shallowMount } from '@vue/test-utils';
import App from '@/App.vue';

describe('App.vue', () => {
  it('should render app', () => {
    const wrapper = shallowMount(App, {});
    expect(wrapper).toBeDefined();
  });
});
