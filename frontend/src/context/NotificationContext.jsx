import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { onSocketEvent } from "../services/socketClient"
import {
  genId,
  initAudioUnlock,
  playAdminBell,
  playCustomerDing,
} from "../services/notificationService"

const ADMIN_TOAST_MS = 6000
const CUSTOMER_READY_MS = 8000
const MAX_BELL_NOTIFICATIONS = 30

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [adminToasts, setAdminToasts] = useState([])
  const [bellNotifications, setBellNotifications] = useState([])
  const [unreadBell, setUnreadBell] = useState(0)
  const [customerReady, setCustomerReady] = useState(null)

  // Guards so the customer site never shows admin toasts (and vice versa),
  // even if the shared socket happens to sit in the "admins" room.
  const adminModeRef = useRef(false)
  const seenRef = useRef(new Set())
  const readyTimerRef = useRef(null)

  useEffect(() => {
    initAudioUnlock()
  }, [])

  const pushAdminToast = useCallback((notification) => {
    setAdminToasts((prev) => [...prev, notification])
    window.setTimeout(() => {
      setAdminToasts((prev) => prev.filter((t) => t.id !== notification.id))
    }, ADMIN_TOAST_MS)
  }, [])

  const dismissAdminToast = useCallback((id) => {
    setAdminToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissCustomerReady = useCallback(() => {
    setCustomerReady(null)
  }, [])

  const markBellAllRead = useCallback(() => {
    setUnreadBell(0)
    setBellNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const setAdminMode = useCallback((enabled) => {
    adminModeRef.current = enabled
  }, [])

  useEffect(() => {
    const offNewOrder = onSocketEvent("newOrder", (data) => {
      if (!adminModeRef.current || !data || !data.orderId) return
      const key = `order:${data.orderId}`
      if (seenRef.current.has(key)) return
      seenRef.current.add(key)

      const notification = {
        id: genId(),
        data,
        read: false,
        createdAt: new Date().toISOString(),
      }
      pushAdminToast(notification)
      setBellNotifications((prev) => [notification, ...prev].slice(0, MAX_BELL_NOTIFICATIONS))
      setUnreadBell((n) => n + 1)
      playAdminBell()
    })

    const offOrderReady = onSocketEvent("orderReady", (data) => {
      if (adminModeRef.current || !data || !data.orderId) return
      const currentOrderId = localStorage.getItem("currentOrderId")
      if (data.orderId !== currentOrderId) return
      const key = `ready:${data.orderId}`
      if (seenRef.current.has(key)) return
      seenRef.current.add(key)

      setCustomerReady(data)
      playCustomerDing()
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current)
      readyTimerRef.current = window.setTimeout(() => {
        setCustomerReady(null)
        readyTimerRef.current = null
      }, CUSTOMER_READY_MS)
    })

    return () => {
      offNewOrder()
      offOrderReady()
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current)
        readyTimerRef.current = null
      }
    }
  }, [pushAdminToast])

  const value = {
    adminToasts,
    dismissAdminToast,
    bellNotifications,
    unreadBell,
    markBellAllRead,
    customerReady,
    dismissCustomerReady,
    setAdminMode,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return ctx
}
