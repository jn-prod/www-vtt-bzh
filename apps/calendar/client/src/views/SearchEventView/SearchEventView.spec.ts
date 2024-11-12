import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';
// import { axe, toHaveNoViolations } from 'jest-axe';
import SearchEventView from './SearchEventView.vue';

const createWrapper = () => mount(SearchEventView);

describe('SearchEventView', () => {
  test('render', async () => {
    const vm = createWrapper();
    // expect(await axe(vm.html())).toHaveNoViolations();
    await Promise.all(vm.findAll('input').map((input) => input.setValue(new Date('2024-01-01'))));
    expect(vm.html()).toMatchSnapshot();
  });
});
