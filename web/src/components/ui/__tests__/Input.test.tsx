import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input Component', () => {
  it('renders the input field', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText(/enter text/i)
    expect(input).toBeInTheDocument()
  })

  it('renders the label if provided', () => {
    render(<Input label="Email Address" id="email" />)
    const label = screen.getByText(/email address/i)
    expect(label).toBeInTheDocument()
  })

  it('renders the error message and red borders if error is provided', () => {
    render(<Input error="Invalid email" />)
    const errorMessage = screen.getByText(/invalid email/i)
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveClass('text-red-500')
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
  })

  it('accepts user input', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    
    fireEvent.change(input, { target: { value: 'test value' } })
    expect(input).toHaveValue('test value')
  })
})
