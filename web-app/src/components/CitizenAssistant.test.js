import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CitizenAssistant from './CitizenAssistant';

// Mock react-router-dom
let mockLocation = { pathname: '/submit' };
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate
}));

// Mock auth store
let mockUser = { id: 'u1', role: 'citizen' };
jest.mock('../hooks/useAuthStore', () => () => ({
  user: mockUser
}));

// Mock Onee component for shallow rendering tests
jest.mock('./onee/Onee.jsx', () => {
  return function MockOnee({ animation, size }) {
    return <span data-testid="mock-onee" data-animation={animation} data-size={size} />;
  };
});

describe('CitizenAssistant Component', () => {
  beforeEach(() => {
    mockLocation = { pathname: '/submit' };
    mockUser = { id: 'u1', role: 'citizen' };
    // matchMedia mock
    window.matchMedia = window.matchMedia || function() {
      return {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
    };
  });

  test('does NOT render when user is an officer (Constraint #6)', () => {
    mockUser = { id: 'o1', role: 'officer' };
    const html = renderToStaticMarkup(<CitizenAssistant />);
    expect(html).toBe('');
  });

  test('does NOT render when user is an admin (Constraint #6)', () => {
    mockUser = { id: 'a1', role: 'admin' };
    const html = renderToStaticMarkup(<CitizenAssistant />);
    expect(html).toBe('');
  });

  test('does NOT render when location is an officer route', () => {
    mockUser = { id: 'u1', role: 'citizen' };
    mockLocation = { pathname: '/officer/dashboard' };
    const html = renderToStaticMarkup(<CitizenAssistant />);
    expect(html).toBe('');
  });

  test('does NOT render when location is an admin route', () => {
    mockUser = { id: 'u1', role: 'citizen' };
    mockLocation = { pathname: '/admin/complaints' };
    const html = renderToStaticMarkup(<CitizenAssistant />);
    expect(html).toBe('');
  });

  test('does NOT render on /submit page (yields to in-page OneeCompanion)', () => {
    mockUser = { id: 'u1', role: 'citizen' };
    mockLocation = { pathname: '/submit' };
    const html = renderToStaticMarkup(<CitizenAssistant />);
    expect(html).toBe('');
  });

  test('renders small unobtrusive floating Onee mascot for citizen on other pages', () => {
    mockUser = { id: 'u1', role: 'citizen' };
    mockLocation = { pathname: '/track' };
    const html = renderToStaticMarkup(<CitizenAssistant />);
    expect(html).toContain('aria-label="Onee Citizen Guide"');
    expect(html).toContain('data-testid="mock-onee"');
    expect(html).toContain('data-animation="idle"');
    // Confirms NO chatbot input or large panels
    expect(html).not.toContain('placeholder="How can I help?"');
    expect(html).not.toContain('Admin Hub');
    expect(html).not.toContain('Report Crime');
  });
});
