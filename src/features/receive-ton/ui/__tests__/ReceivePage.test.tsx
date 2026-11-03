import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { ReceivePage } from '../ReceivePage'
import { useWalletStore } from '@/entities/wallet/model/wallet.store'

const ADDRESS = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t'

beforeEach(() => {
  mockNavigate.mockClear()
  useWalletStore.setState({ address: ADDRESS })
})

afterEach(() => {
  useWalletStore.setState({ address: null })
})

describe('ReceivePage', () => {
  it('renders nothing if there is no wallet address', () => {
    useWalletStore.setState({ address: null })
    const { container } = render(<ReceivePage />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the QR code and the full address', () => {
    render(<ReceivePage />)

    expect(document.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText(ADDRESS)).toBeInTheDocument()
    expect(screen.getByText('Copy address')).toBeInTheDocument()
  })

  it('navigates back to the dashboard from Back and Done', () => {
    render(<ReceivePage />)

    fireEvent.click(screen.getByText('← Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')

    fireEvent.click(screen.getByText('Done'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })
})
