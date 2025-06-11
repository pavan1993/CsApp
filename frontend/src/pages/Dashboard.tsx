import React from 'react'
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react'

const Dashboard: React.FC = () => {
  const stats = [
    {
      name: 'Total Customers',
      value: '2,651',
      change: '+4.75%',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Customer Health Score',
      value: '8.2/10',
      change: '+0.3',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      name: 'Monthly Revenue',
      value: '$405,091',
      change: '+54.02%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Churn Rate',
      value: '2.1%',
      change: '-0.5%',
      changeType: 'positive',
      icon: Target,
    },
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
              >
                <dt>
                  <div className="absolute bg-primary-500 rounded-md p-3">
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {item.value}
                  </p>
                  <p
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'positive'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {item.change}
                  </p>
                </dd>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
