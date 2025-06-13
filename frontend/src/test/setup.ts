import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:5000',
    VITE_API_TIMEOUT: '10000',
    VITE_APP_NAME: 'Customer Success Analytics',
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock window.location
const locationMock = {
  href: '',
  reload: vi.fn(),
}
vi.stubGlobal('location', locationMock)
