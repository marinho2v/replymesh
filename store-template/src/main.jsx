import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './app/App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Toaster
      position="bottom-center"
      richColors
      offset={24}
      toastOptions={{
        style: {
          marginBottom: 'env(safe-area-inset-bottom)',
        },
      }}
    />
  </>,
)
