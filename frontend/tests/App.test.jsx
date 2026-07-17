import { describe, expect,it } from 'vitest'
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { ThemeProvider } from '../src/contexts/ThemeContext'
import { ThreeDMarqueeBg } from '../src/pages/HomePage'

describe('HomePage component', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ThreeDMarqueeBg />
        </ThemeProvider>
      </MemoryRouter>
    )
    
    // Check if the main heading is rendered
    const heading = screen.getByText(/VoxBiz/i)
    expect(heading).toBeInTheDocument()
  })
})
