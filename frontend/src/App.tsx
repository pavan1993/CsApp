import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Analytics from './pages/Analytics'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { AppProvider } from './context/AppContext'

function App() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to monitoring service
    console.error('Application error:', error, errorInfo)
    
    // You can integrate with error reporting services like Sentry here
    // Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  return (
    <ErrorBoundary onError={handleError}>
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
