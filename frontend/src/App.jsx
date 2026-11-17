import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Menu from "./pages/Menu"
import Admin from "./pages/Admin"
import Sales from "./pages/Sales"
import Rewards from "./pages/Rewards"
import Offers from "./pages/Offers"

import Footer from "./components/Footer"
import CartPanel from "./components/CartPanel"
import Toast from "./components/Toast"
import { getKitchenStatus } from "./api"
import { NotificationProvider } from "./context/NotificationContext"
import CustomerOrderReadyPopup from "./components/notifications/CustomerOrderReadyPopup"
import OrderInMakingPopup from "./components/notifications/OrderInMakingPopup"
import { joinOrderRoom, leaveOrderRoom } from "./services/socketClient"

// Customer website only — no admin links anywhere
function CustomerSite({ notify }) {
  const [currentPage, setCurrentPage] = useState("home")
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderInMaking, setOrderInMaking] = useState(false)

  // Kitchen status — "open" or "closed"
  const [kitchenOpen, setKitchenOpen] = useState(false)

  // Rejoin this browser's order room on load/refresh so the customer
  // keeps receiving "order ready" notifications for their last order.
  useEffect(() => {
    const currentOrderId = localStorage.getItem("currentOrderId")
    if (currentOrderId) joinOrderRoom(currentOrderId)
    return () => {
      if (currentOrderId) leaveOrderRoom(currentOrderId)
    }
  }, [])

  // Fetch kitchen status on mount and every 3 seconds
  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await getKitchenStatus()
        setKitchenOpen(data.status === "open")
      } catch {
        // If fetch fails, default to closed (safe default)
        setKitchenOpen(false)
      }
    }

    fetchStatus()
    const timer = setInterval(fetchStatus, 3000)

    // Listen for instant BroadcastChannel updates from admin panel
    const kitchenChannel = new BroadcastChannel("kitchen-updates")
    kitchenChannel.onmessage = () => { fetchStatus() }

    // Listen for localStorage cross-tab updates
    function handleStorage(e) {
      if (e.key === "kitchenUpdated") { fetchStatus() }
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      clearInterval(timer)
      kitchenChannel.close()
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  function goToMenu() {
    setCurrentPage("menu")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((row) => row.id === item.id)
      if (existing) {
        return prev.map((row) =>
          row.id === item.id
            ? { ...row, quantity: row.quantity + 1 }
            : row
        )
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]
    })
    notify(`${item.name} added to cart`)
  }

  function updateQty(id, quantity) {
    if (quantity < 1) {
      setCart((prev) => prev.filter((row) => row.id !== id))
      return
    }
    setCart((prev) =>
      prev.map((row) => (row.id === id ? { ...row, quantity } : row))
    )
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((row) => row.id !== id))
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      {currentPage === "home" && <Home onViewMenu={goToMenu} />}
      {currentPage === "menu" && <Menu onAddToCart={addToCart} kitchenOpen={kitchenOpen} />}
      {currentPage === "offers" && <Offers />}
      {currentPage === "rewards" && <Rewards />}

      <Footer />

      <CartPanel
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onClear={() => setCart([])}
        onNotify={notify}
        onOrderPlaced={() => setOrderInMaking(true)}
        kitchenOpen={kitchenOpen}
      />

      {orderInMaking && (
        <OrderInMakingPopup onClose={() => setOrderInMaking(false)} />
      )}

      <CustomerOrderReadyPopup />
    </div>
  )
}

function App() {
  const [toast, setToast] = useState({ message: "", type: "success" })

  useEffect(() => {
    if (!toast.message) return
    const timer = setTimeout(() => {
      setToast({ message: "", type: "success" })
    }, 4500)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function handleAdminToast(e) {
      const { message, type } = e.detail
      setToast({ message: message || "", type: type || "success" })
    }
    window.addEventListener("admin-toast", handleAdminToast)
    return () => window.removeEventListener("admin-toast", handleAdminToast)
  }, [])

  function notify(message, type = "success") {
    setToast({ message, type })
  }

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          {/* Owner-only URLs — not linked from the customer site */}
          <Route
            path="/admin"
            element={
              <div className="flex min-h-screen flex-col">
                <Admin onNotify={notify} />
              </div>
            }
          />
          <Route
            path="/sales"
            element={
              <div className="flex min-h-screen flex-col">
                <Sales />
              </div>
            }
          />

          {/* Customer website */}
          <Route path="/*" element={<CustomerSite notify={notify} />} />
        </Routes>

        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      </BrowserRouter>
    </NotificationProvider>
  )
}

export default App
