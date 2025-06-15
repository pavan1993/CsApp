import { useState, useCallback, useEffect } from 'react'
import { Notification, NotificationType } from '../components/NotificationSystem'

let notificationId = 0

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      duration?: number
      action?: {
        label: string
        onClick: () => void
      }
    }
  ) => {
    const id = `notification-${++notificationId}`
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration: options?.duration ?? 5000,
      action: options?.action
    }

    setNotifications(prev => [...prev, notification])

    // Auto-remove after duration (unless duration is 0)
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: any) => {
    return addNotification('success', title, message, options)
  }, [addNotification])

  const error = useCallback((title: string, message?: string, options?: any) => {
    return addNotification('error', title, message, options)
  }, [addNotification])

  const warning = useCallback((title: string, message?: string, options?: any) => {
    return addNotification('warning', title, message, options)
  }, [addNotification])

  const info = useCallback((title: string, message?: string, options?: any) => {
    return addNotification('info', title, message, options)
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  }
}

// Global notification instance for use outside of React components
let globalNotifications: ReturnType<typeof useNotifications> | null = null

export const setGlobalNotifications = (notifications: ReturnType<typeof useNotifications>) => {
  globalNotifications = notifications
}

export const notify = {
  success: (title: string, message?: string, options?: any) => {
    globalNotifications?.success(title, message, options)
  },
  error: (title: string, message?: string, options?: any) => {
    globalNotifications?.error(title, message, options)
  },
  warning: (title: string, message?: string, options?: any) => {
    globalNotifications?.warning(title, message, options)
  },
  info: (title: string, message?: string, options?: any) => {
    globalNotifications?.info(title, message, options)
  }
}
