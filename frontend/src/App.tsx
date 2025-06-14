import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Analytics from './pages/Analytics'
import Import from './pages/Import'
import Configuration from './pages/Configuration'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/import" element={<Import />} />
        <Route path="/configuration" element={<Configuration />} />
      </Routes>
    </Layout>
  )
}

export default App
