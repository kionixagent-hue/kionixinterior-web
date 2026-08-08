import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CoverImageField from '@/components/admin/CoverImageField'

describe('CoverImageField', () => {
  it('renders with the initial prompt', () => {
    render(<CoverImageField initialPrompt="A cozy room" onGenerate={jest.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('A cozy room')
  })

  it('generates, shows the image, and flips the button to Regenerate', async () => {
    const onGenerate = jest.fn().mockResolvedValue('https://x/cover.jpg')
    const onGenerated = jest.fn()
    render(<CoverImageField initialPrompt="A cozy room" onGenerate={onGenerate} onGenerated={onGenerated} />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate Cover' }))

    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/cover.jpg'))
    expect(onGenerate).toHaveBeenCalledWith('A cozy room')
    expect(onGenerated).toHaveBeenCalledWith('https://x/cover.jpg')
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument()
  })

  it('shows an alert and re-enables the button when generation fails', async () => {
    const onGenerate = jest.fn().mockRejectedValue(new Error('API down'))
    render(<CoverImageField initialPrompt="A cozy room" onGenerate={onGenerate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate Cover' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('API down'))
    expect(screen.getByRole('button', { name: 'Generate Cover' })).not.toBeDisabled()
  })
})
