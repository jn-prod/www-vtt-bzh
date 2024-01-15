import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';
// import { axe, toHaveNoViolations } from 'jest-axe';
import SearchEventView from './SearchEventView.vue';

const createWrapper = () => mount(SearchEventView);

describe('SearchEventView', () => {
  test('render', async () => {
    const vm = createWrapper();
    // expect(await axe(vm.html())).toHaveNoViolations();
    expect(vm.html()).toMatchSnapshot();
  });
});
