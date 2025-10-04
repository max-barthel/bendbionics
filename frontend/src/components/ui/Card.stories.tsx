import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible card component for displaying content with consistent styling and spacing.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: { type: 'text' },
      description: 'Content to display inside the card',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    children: 'This is a basic card with some content.',
  },
};

// With different content types
export const WithText: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600">
          This is a card with a title and some descriptive text. It demonstrates how the
          card component can contain structured content.
        </p>
      </div>
    ),
  },
};

export const WithList: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-3">Features</h3>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Feature one
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Feature two
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Feature three
          </li>
        </ul>
      </div>
    ),
  },
};

export const WithForm: Story = {
  args: {
    children: (
      <form className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Form</h3>
        <div>
          <label htmlFor="name-input" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name-input"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label htmlFor="email-input" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email-input"
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Submit
        </button>
      </form>
    ),
  },
};

export const WithImage: Story = {
  args: {
    children: (
      <div>
        <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center text-white font-semibold">
          Placeholder Image
        </div>
        <h3 className="text-lg font-semibold mb-2">Image Card</h3>
        <p className="text-gray-600">
          This card contains an image placeholder and some descriptive text below it.
        </p>
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card with Actions</h3>
        <p className="text-gray-600 mb-4">
          This card includes action buttons at the bottom.
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
            Primary Action
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Secondary Action
          </button>
        </div>
      </div>
    ),
  },
};

// Custom styling examples
export const CustomStyling: Story = {
  args: {
    children: 'This card has custom styling applied.',
    className: 'bg-gradient-to-br from-purple-400 to-pink-400 text-white border-0',
  },
};

export const Compact: Story = {
  args: {
    children: 'Compact card with reduced padding.',
    className: 'p-4',
  },
};

export const Large: Story = {
  args: {
    children: 'Large card with extra padding.',
    className: 'p-12',
  },
};

// Multiple cards showcase
export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <Card>
        <h3 className="text-lg font-semibold mb-2">Card 1</h3>
        <p className="text-gray-600">First card content</p>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-2">Card 2</h3>
        <p className="text-gray-600">Second card content</p>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-2">Card 3</h3>
        <p className="text-gray-600">Third card content</p>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple cards displayed in a responsive grid layout.',
      },
    },
  },
};

// Accessibility showcase
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-semibold mb-2">Accessible Card</h3>
        <p className="text-gray-600 mb-4">
          This card demonstrates proper semantic structure and accessibility features.
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-describedby="card-description"
          >
            Accessible Button
          </button>
        </div>
        <p id="card-description" className="sr-only">
          This button performs the primary action for this card
        </p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Card with proper accessibility features including ARIA labels and semantic structure.',
      },
    },
  },
};
