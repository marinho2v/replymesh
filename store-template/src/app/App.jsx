import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import AppVersionWatcher from '../components/shared/AppVersionWatcher'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppVersionWatcher />
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
