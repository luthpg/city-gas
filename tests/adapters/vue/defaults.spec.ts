import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import * as composables from '@/adapters/vue/composables';
import { DefaultLoading, DefaultNotFound } from '@/adapters/vue/defaults';

// Mock composables
vi.mock('@/adapters/vue/composables', () => ({
  useNavigate: vi.fn(),
}));

describe('Vue Default Components', () => {
  describe('DefaultLoading', () => {
    it('should render loading spinner', () => {
      const wrapper = mount(DefaultLoading);
      expect(wrapper.find('.cg-loading-container').exists()).toBe(true);
      expect(wrapper.find('.cg-spinner').exists()).toBe(true);
    });

    it('should have correct styles injected', () => {
      const wrapper = mount(DefaultLoading);
      const styleTag = wrapper.find('style');
      expect(styleTag.exists()).toBe(true);
      expect(styleTag.text()).toContain('.cg-loading-container');
    });
  });

  describe('DefaultNotFound', () => {
    it('should render 404 message', () => {
      const wrapper = mount(DefaultNotFound);
      expect(wrapper.text()).toContain('404');
      expect(wrapper.text()).toContain('Page Not Found');
    });

    it('should navigate to home on button click', async () => {
      const navigateMock = vi.fn();
      vi.spyOn(composables, 'useNavigate').mockReturnValue(navigateMock);

      const wrapper = mount(DefaultNotFound);
      const button = wrapper.find('button');
      await button.trigger('click');

      expect(navigateMock).toHaveBeenCalledWith('/', {});
    });
  });
});
