import React, { useState } from 'react'
import { Plus, Building2, Users, Calendar, Edit2, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiService } from '../services/api'

interface Customer {
  id: string
  name: string
  email?: string
  company?: string
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL'
  createdAt: string
  lastActivity?: string
}

const Customers: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    status: 'ACTIVE' as const
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Mock customers data - in real app this would come from API
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'admin@acme.com',
      company: 'Acme Corporation',
      status: 'ACTIVE',
      createdAt: '2024-01-15T10:00:00Z',
      lastActivity: '2024-06-10T14:30:00Z'
    },
    {
      id: '2', 
      name: 'TechStart Inc',
      email: 'contact@techstart.com',
      company: 'TechStart Inc',
      status: 'TRIAL',
      createdAt: '2024-03-20T09:15:00Z',
      lastActivity: '2024-06-12T11:45:00Z'
    }
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Organization name is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      if (editingCustomer) {
        // Update existing customer
        const updatedCustomer = {
          ...editingCustomer,
          ...formData,
          updatedAt: new Date().toISOString()
        }
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updatedCustomer : c))
      } else {
        // Create new customer/organization
        const newCustomer: Customer = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString()
        }
        setCustomers(prev => [...prev, newCustomer])
        
        // Add to organizations list in context
        const newOrg = { id: newCustomer.id, name: newCustomer.name }
        dispatch({ type: 'SET_ORGANIZATIONS', payload: [...state.organizations, newOrg] })
      }

      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      company: customer.company || '',
      status: customer.status
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setError(null)
      setCustomers(prev => prev.filter(c => c.id !== id))
      
      // Remove from organizations list in context
      const updatedOrgs = state.organizations.filter(org => org.id !== id)
      dispatch({ type: 'SET_ORGANIZATIONS', payload: updatedOrgs })
      
      // If deleted org was selected, clear selection
      if (state.selectedOrganization?.id === id) {
        dispatch({ type: 'SET_SELECTED_ORGANIZATION', payload: null })
      }
      
      setDeleteConfirm(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      status: 'ACTIVE'
    })
    setEditingCustomer(null)
    setShowAddForm(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'TRIAL': return 'bg-yellow-100 text-yellow-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (state.isLoading) {
    return <LoadingSpinner text="Loading customers..." />
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {state.error && (
        <div className="mb-6 border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Connection Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{state.error}</p>
                <p className="mt-1">Using local data for demonstration.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Organizations</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage customer organizations and their configurations
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Organizations</p>
              <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter(c => c.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Trial</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter(c => c.status === 'TRIAL').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingCustomer ? 'Edit Organization' : 'Add New Organization'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@acme.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Organizations ({customers.length})
          </h3>
        </div>
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first organization.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          {customer.company && customer.company !== customer.name && (
                            <div className="text-sm text-gray-500">{customer.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.lastActivity ? formatDate(customer.lastActivity) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Organization</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this organization? This action cannot be undone and will remove all associated data.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
