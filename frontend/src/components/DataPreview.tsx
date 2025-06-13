import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Download, Filter } from 'lucide-react'

interface DataPreviewProps {
  data: any[]
  title?: string
  maxRows?: number
  onClose?: () => void
}

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  title = 'Data Preview',
  maxRows = 100,
  onClose
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState('')

  const columns = useMemo(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }, [data])

  const filteredData = useMemo(() => {
    if (!filterText) return data.slice(0, maxRows)
    
    return data.slice(0, maxRows).filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    )
  }, [data, filterText, maxRows])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  const visibleColumns = columns.filter(col => !hiddenColumns.has(col))

  const toggleColumnVisibility = (column: string) => {
    const newHiddenColumns = new Set(hiddenColumns)
    if (newHiddenColumns.has(column)) {
      newHiddenColumns.delete(column)
    } else {
      newHiddenColumns.add(column)
    }
    setHiddenColumns(newHiddenColumns)
  }

  const getColumnStats = (column: string) => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '')
    const total = data.length
    const filled = values.length
    const unique = new Set(values).size
    
    return {
      filled,
      fillRate: ((filled / total) * 100).toFixed(1),
      unique,
      uniqueRate: ((unique / filled) * 100).toFixed(1)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      visibleColumns.join(','),
      ...filteredData.map(row => 
        visibleColumns.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_export.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <p>No data to preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              Showing {filteredData.length} of {data.length} rows
              {maxRows < data.length && ` (limited to first ${maxRows})`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Filter and Column Controls */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter data..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Columns:</span>
            <div className="flex flex-wrap gap-1">
              {columns.slice(0, 5).map(column => (
                <button
                  key={column}
                  onClick={() => toggleColumnVisibility(column)}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    hiddenColumns.has(column)
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {hiddenColumns.has(column) ? (
                    <EyeOff className="h-3 w-3 mr-1" />
                  ) : (
                    <Eye className="h-3 w-3 mr-1" />
                  )}
                  {column}
                </button>
              ))}
              {columns.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{columns.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">Total Rows:</span>
            <span className="ml-1 text-gray-600">{data.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Columns:</span>
            <span className="ml-1 text-gray-600">{columns.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Visible:</span>
            <span className="ml-1 text-gray-600">{visibleColumns.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Filtered:</span>
            <span className="ml-1 text-gray-600">{filteredData.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map(column => {
                const stats = getColumnStats(column)
                return (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div>
                      <div className="font-semibold">{column}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {stats.fillRate}% filled, {stats.unique} unique
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {visibleColumns.map(column => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    <div className="max-w-xs truncate" title={String(row[column] || '')}>
                      {row[column] || <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataPreview
