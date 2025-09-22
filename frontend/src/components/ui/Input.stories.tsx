import type { Meta, StoryObj } from '@storybook/react';
// import { fn } from '@storybook/test';
import { useState } from 'react';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile input component with floating labels, validation states, and Tahoe glass styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'number', 'password'],
      description: 'Input type',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input',
    },
    value: {
      control: { type: 'text' },
      description: 'Input value',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    label: {
      control: { type: 'text' },
      description: 'Floating label text',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message to display',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler function',
    },
    onFocus: {
      action: 'focused',
      description: 'Focus handler function',
    },
    onBlur: {
      action: 'blurred',
      description: 'Blur handler function',
    },
  },
  args: {
    onChange: () => console.log('Input changed'),
    onFocus: () => console.log('Input focused'),
    onBlur: () => console.log('Input blurred'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for controlled inputs
const InteractiveInput = (args: any) => {
  const [value, setValue] = useState(args.value || '');
  return (
    <Input
      {...args}
      value={value}
      onChange={newValue => {
        setValue(newValue);
        args.onChange?.(newValue);
      }}
    />
  );
};

// Default story
export const Default: Story = {
  render: InteractiveInput,
  args: {
    placeholder: 'Enter text...',
  },
};

// With label
export const WithLabel: Story = {
  render: InteractiveInput,
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
  },
};

// Input types
export const TextInput: Story = {
  render: InteractiveInput,
  args: {
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your full name',
  },
};

export const NumberInput: Story = {
  render: InteractiveInput,
  args: {
    type: 'number',
    label: 'Age',
    placeholder: 'Enter your age',
    min: 0,
    max: 120,
  },
};

export const PasswordInput: Story = {
  render: InteractiveInput,
  args: {
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
  },
};

// Sizes
export const Small: Story = {
  render: InteractiveInput,
  args: {
    size: 'sm',
    label: 'Small Input',
    placeholder: 'Small size',
  },
};

export const Medium: Story = {
  render: InteractiveInput,
  args: {
    size: 'md',
    label: 'Medium Input',
    placeholder: 'Medium size',
  },
};

export const Large: Story = {
  render: InteractiveInput,
  args: {
    size: 'lg',
    label: 'Large Input',
    placeholder: 'Large size',
  },
};

// States
export const Disabled: Story = {
  args: {
    value: 'Disabled input',
    label: 'Disabled Input',
    disabled: true,
  },
};

export const WithError: Story = {
  render: InteractiveInput,
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
  },
};

export const WithValue: Story = {
  args: {
    value: 'john.doe@example.com',
    label: 'Email Address',
  },
};

// Form examples
export const LoginForm: Story = {
  render: () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="w-80 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Login Form</h3>
        <Input
          type="text"
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
        />
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
        />
        <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
          Sign In
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete login form using Input components.',
      },
    },
  },
};

export const ContactForm: Story = {
  render: () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');

    return (
      <div className="w-96 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Contact Form</h3>
        <Input
          label="Full Name"
          value={name}
          onChange={setName}
          placeholder="Enter your full name"
        />
        <Input
          type="text"
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
        />
        <Input
          type="text"
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          placeholder="Enter your phone number"
        />
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter your message"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>
        <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
          Send Message
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Contact form with various input types and a textarea.',
      },
    },
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        size="sm"
        label="Small"
        value=""
        onChange={() => {}}
        placeholder="Small input"
      />
      <Input
        size="md"
        label="Medium"
        value=""
        onChange={() => {}}
        placeholder="Medium input"
      />
      <Input
        size="lg"
        label="Large"
        value=""
        onChange={() => {}}
        placeholder="Large input"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All input sizes displayed together for comparison.',
      },
    },
  },
};

// Accessibility showcase
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <h3 className="text-lg font-semibold mb-2">Accessible Inputs</h3>
        <p className="text-sm text-gray-600 mb-4">
          All inputs support keyboard navigation and screen readers.
        </p>
      </div>

      <Input
        label="Required Field"
        value=""
        onChange={() => {}}
        placeholder="This field is required"
        id="required-input"
        aria-required="true"
        aria-describedby="required-help"
      />
      <p id="required-help" className="text-sm text-gray-500">
        This field is required for form submission.
      </p>

      <Input
        label="Email with Validation"
        value=""
        onChange={() => {}}
        placeholder="Enter a valid email"
        type="text"
        error="Please enter a valid email address"
        aria-describedby="email-error"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Inputs with proper accessibility features including ARIA labels and error descriptions.',
      },
    },
  },
};
