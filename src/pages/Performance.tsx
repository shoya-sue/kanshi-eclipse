import React from 'react'
import PerformanceDashboard from '../components/Performance/PerformanceDashboard'
import ErrorBoundary from '../components/Common/ErrorBoundary'

const Performance: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PerformanceDashboard />
      </div>
    </ErrorBoundary>
  )
}

export default Performance