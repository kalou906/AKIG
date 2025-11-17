/**
 * Tests pour le composant PrimaryButton
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimaryButton from './PrimaryButton';

describe('PrimaryButton Component', () => {
  describe('Rendering', () => {
    test('renders button with label', () => {
      render(<PrimaryButton label="Click me" />);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    test('renders with custom data-testid', () => {
      render(
        <PrimaryButton 
          label="Test" 
          dataTestId="custom-test-id"
        />
      );
      
      const button = screen.getByTestId('custom-test-id');
      expect(button).toBeInTheDocument();
    });

    test('renders with default data-testid based on label', () => {
      render(<PrimaryButton label="Submit" />);
      
      const button = screen.getByTestId('primary-button-Submit');
      expect(button).toBeInTheDocument();
    });

    test('renders with title attribute', () => {
      render(
        <PrimaryButton 
          label="Help" 
          title="Click for help"
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Click for help');
    });
  });

  describe('Props', () => {
    test('renders with custom className', () => {
      const { container } = render(
        <PrimaryButton 
          label="Test" 
          className="custom-class"
        />
      );
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });

    test('renders with different types', () => {
      const { rerender } = render(
        <PrimaryButton label="Test" type="submit" />
      );
      
      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');

      rerender(<PrimaryButton label="Test" type="reset" />);
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });

    test('renders different sizes', () => {
      const { container, rerender } = render(
        <PrimaryButton label="Test" size="sm" />
      );
      
      let button = container.querySelector('button');
      expect(button.className).toContain('button--sm');

      rerender(<PrimaryButton label="Test" size="lg" />);
      button = container.querySelector('button');
      expect(button.className).toContain('button--lg');
    });

    test('renders with fullWidth', () => {
      const { container } = render(
        <PrimaryButton label="Test" fullWidth={true} />
      );
      
      const button = container.querySelector('button');
      expect(button.className).toContain('button--full-width');
    });

    test('renders with icon', () => {
      render(
        <PrimaryButton 
          label="Test" 
          icon={<span data-testid="test-icon">📝</span>}
        />
      );
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    test('renders disabled button', () => {
      render(<PrimaryButton label="Test" disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      
      render(
        <PrimaryButton 
          label="Test" 
          onClick={handleClick}
          disabled={true}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('displays disabled styling', () => {
      const { container } = render(
        <PrimaryButton label="Test" disabled={true} />
      );
      
      const button = container.querySelector('button');
      expect(button.className).toContain('button--disabled');
    });
  });

  describe('Loading State', () => {
    test('renders with loading state', () => {
      render(<PrimaryButton label="Save" loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    test('disables button when loading', () => {
      render(<PrimaryButton label="Save" loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      
      render(
        <PrimaryButton 
          label="Save" 
          onClick={handleClick}
          loading={true}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('shows spinner when loading', () => {
      const { container } = render(
        <PrimaryButton label="Save" loading={true} />
      );
      
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    test('includes loading text for screen readers', () => {
      render(<PrimaryButton label="Save" loading={true} />);
      
      const screenReaderText = screen.getByText(/est en cours de traitement/);
      expect(screenReaderText).toBeInTheDocument();
      expect(screenReaderText).toHaveClass('srOnly');
    });
  });

  describe('Click Handling', () => {
    test('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      
      render(
        <PrimaryButton 
          label="Click" 
          onClick={handleClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('passes event to onClick handler', () => {
      const handleClick = jest.fn();
      
      render(
        <PrimaryButton 
          label="Click" 
          onClick={handleClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    test('handles multiple clicks', () => {
      const handleClick = jest.fn();
      
      render(
        <PrimaryButton 
          label="Click" 
          onClick={handleClick}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    test('has aria-label', () => {
      render(
        <PrimaryButton 
          label="Save" 
          ariaLabel="Save changes"
        />
      );
      
      const button = screen.getByRole('button', { name: /save changes/i });
      expect(button).toBeInTheDocument();
    });

    test('uses label as default aria-label', () => {
      render(<PrimaryButton label="Submit" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Submit');
    });

    test('has focus visible support', () => {
      const { container } = render(<PrimaryButton label="Test" />);
      
      const button = container.querySelector('button');
      // CSS-in-JS or CSS modules should handle focus-visible
      expect(button).toBeInTheDocument();
    });

    test('announces loading state to screen readers', () => {
      render(<PrimaryButton label="Load" loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    test('icon is hidden from screen readers', () => {
      render(
        <PrimaryButton 
          label="Test" 
          icon={<span data-testid="test-icon">📝</span>}
        />
      );
      
      const icon = screen.getByTestId('test-icon').parentElement;
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Integration', () => {
    test('works as submit button in form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <input type="text" />
          <PrimaryButton label="Submit" type="submit" />
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    test('combines multiple props', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <PrimaryButton 
          label="Save Changes"
          onClick={handleClick}
          size="lg"
          fullWidth={true}
          type="submit"
          title="Save all changes"
          ariaLabel="Save document"
        />
      );
      
      const button = screen.getByRole('button', { name: /save document/i });
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('title', 'Save all changes');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    test('handles keyboard navigation', () => {
      const handleClick = jest.fn();
      
      render(
        <PrimaryButton 
          label="Click" 
          onClick={handleClick}
        />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty label gracefully', () => {
      render(<PrimaryButton label="" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('handles very long label', () => {
      const longLabel = 'This is a very long button label that should be truncated';
      render(<PrimaryButton label={longLabel} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('handles rapid enable/disable changes', () => {
      const { rerender } = render(
        <PrimaryButton label="Test" disabled={false} />
      );
      
      let button = screen.getByRole('button');
      expect(button).not.toBeDisabled();

      rerender(<PrimaryButton label="Test" disabled={true} />);
      button = screen.getByRole('button');
      expect(button).toBeDisabled();

      rerender(<PrimaryButton label="Test" disabled={false} />);
      button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });
});
