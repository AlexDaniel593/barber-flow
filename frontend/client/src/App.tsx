import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import ProtectedRoute from '@/components/ProtectedRoute'
import ClientLayout from '@/components/ClientLayout'
import LoginPage from '@/pages/LoginPage'
import ServicesPage from '@/pages/ServicesPage'
import StylistsPage from '@/pages/StylistsPage'
import BookAppointmentPage from '@/pages/BookAppointmentPage'
import MyAppointmentsPage from '@/pages/MyAppointmentsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<ClientLayout />}>
              <Route path="/" element={<ServicesPage />} />
              <Route path="/stylists" element={<StylistsPage />} />
              <Route path="/book" element={<BookAppointmentPage />} />
              <Route path="/my-appointments" element={<MyAppointmentsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}

export default App
