import { shallowMount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import App from './App.vue';

describe('App.vue', () => {
  test('should render app', () => {
    const wrapper = shallowMount(App, {});
    expect(wrapper).toBeDefined();
  });
});
