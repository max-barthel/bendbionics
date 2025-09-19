import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with Tahoe glass styling, multiple variants, and loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    children: {
      control: { type: 'text' },
      description: 'Button content',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the button is in loading state',
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler function',
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

// Variants
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

// Sizes
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

// States
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading Button',
    loading: true,
  },
};

export const LoadingWithText: Story = {
  args: {
    children: 'Processing...',
    loading: true,
  },
};

// Interactive examples
export const Interactive: Story = {
  args: {
    children: 'Click me!',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'This button has an interactive click handler. Check the Actions panel to see the click events.',
      },
    },
  },
};

// Button types
export const SubmitButton: Story = {
  args: {
    children: 'Submit',
    type: 'submit',
  },
};

export const ResetButton: Story = {
  args: {
    children: 'Reset',
    type: 'reset',
  },
};

// With icons (placeholder for future icon integration)
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <span>🚀</span>
        Launch
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Button with an icon. In a real implementation, you would use proper icon components.',
      },
    },
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together for comparison.',
      },
    },
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes displayed together for comparison.',
      },
    },
  },
};

// Accessibility showcase
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Keyboard Navigation</h3>
        <p className="text-sm text-gray-600 mb-4">
          All buttons support keyboard navigation with Tab and Enter/Space keys.
        </p>
        <div className="flex gap-2">
          <Button>First Button</Button>
          <Button>Second Button</Button>
          <Button>Third Button</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Screen Reader Support</h3>
        <p className="text-sm text-gray-600 mb-4">
          Buttons have proper ARIA labels and semantic HTML.
        </p>
        <Button aria-label="Close dialog">×</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features and keyboard navigation support.',
      },
    },
  },
};
