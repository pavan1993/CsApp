import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflow } from './useWorkflow'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  global?: boolean
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()
  const { nextStep, previousStep, goToStep } = useWorkflow()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowRight',
      ctrlKey: true,
      action: nextStep,
      description: 'Next step',
      global: true
    },
    {
      key: 'ArrowLeft',
      ctrlKey: true,
      action: previousStep,
      description: 'Previous step',
      global: true
    },
    {
      key: '1',
      ctrlKey: true,
      action: () => goToStep('import'),
      description: 'Go to Data Import',
      global: true
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => goToStep('configuration'),
      description: 'Go to Configuration',
      global: true
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => goToStep('analytics'),
      description: 'Go to Analytics',
      global: true
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/'),
      description: 'Go to Dashboard',
      global: true
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Open command palette (could be implemented later)
        console.log('Command palette shortcut')
      },
      description: 'Open command palette',
      global: true
    },
    {
      key: '?',
      shiftKey: true,
      action: () => {
        // Show keyboard shortcuts help
        showShortcutsHelp()
      },
      description: 'Show keyboard shortcuts',
      global: true
    }
  ]

  const showShortcutsHelp = useCallback(() => {
    const helpText = shortcuts
      .map(shortcut => {
        const keys = []
        if (shortcut.ctrlKey) keys.push('Ctrl')
        if (shortcut.altKey) keys.push('Alt')
        if (shortcut.shiftKey) keys.push('Shift')
        if (shortcut.metaKey) keys.push('Cmd')
        keys.push(shortcut.key)
        return `${keys.join(' + ')}: ${shortcut.description}`
      })
      .join('\n')
    
    alert(`Keyboard Shortcuts:\n\n${helpText}`)
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey
      )
    })

    if (matchingShortcut) {
      event.preventDefault()
      matchingShortcut.action()
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    shortcuts
  }
}
