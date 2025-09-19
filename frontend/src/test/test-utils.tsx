import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock providers for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-auth-provider">{children}</div>
);

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <MockAuthProvider>{children}</MockAuthProvider>
    </BrowserRouter>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  ...overrides,
});

export const createMockPreset = (overrides = {}) => ({
  id: 1,
  name: 'Test Preset',
  description: 'A test preset',
  parameters: {
    segments: [[1, 2, 3]],
    config: { test: 'config' },
  },
  user_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTendonResult = (overrides = {}) => ({
  segments: [
    [1, 2, 3],
    [4, 5, 6],
  ],
  config: { test: 'config' },
  ...overrides,
});

// Mock API responses
export const mockApiResponses = {
  success: (data: any) => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  }),
  error: (status = 500, message = 'Internal Server Error') => ({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  }),
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock fetch
export const mockFetch = (response: any, shouldReject = false) => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve(response),
  };

  if (shouldReject) {
    return vi.fn().mockRejectedValue(new Error('Network error'));
  }

  return vi.fn().mockResolvedValue(mockResponse);
};

// Test helpers for common assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
