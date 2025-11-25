import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DefaultLoading, DefaultNotFound } from '@/adapters/react/defaults';
import * as hooks from '@/adapters/react/hooks';

// Mock hooks
vi.mock('@/adapters/react/hooks', () => ({
  useNavigate: vi.fn(),
}));

describe('React Default Components', () => {
  describe('DefaultLoading', () => {
    it('should render loading spinner', () => {
      render(<DefaultLoading />);
      const container = screen.getByText((_content, element) => {
        return element?.className === 'cg-loading-container';
      });
      expect(container).toBeInTheDocument();
      expect(container.querySelector('.cg-spinner')).toBeInTheDocument();
    });

    it('should have correct styles injected', () => {
      render(<DefaultLoading />);
      const styleTag = document.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('.cg-loading-container');
    });
  });

  describe('DefaultNotFound', () => {
    it('should render 404 message', () => {
      render(<DefaultNotFound />);
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('should navigate to home on button click', () => {
      const navigateMock = vi.fn();
      vi.spyOn(hooks, 'useNavigate').mockReturnValue(navigateMock);

      render(<DefaultNotFound />);
      const button = screen.getByText('Go to Home');
      fireEvent.click(button);

      expect(navigateMock).toHaveBeenCalledWith('/', {});
    });
  });
});
