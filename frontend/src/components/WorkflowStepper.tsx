import React from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { useWorkflow } from '../hooks/useWorkflow'

export interface WorkflowStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  path: string
  isComplete: boolean
  isActive: boolean
  isAccessible: boolean
}

interface WorkflowStepperProps {
  className?: string
  showLabels?: boolean
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ 
  className = '', 
  showLabels = true 
}) => {
  const { steps, currentStep, goToStep } = useWorkflow()

  const handleStepClick = (step: WorkflowStep) => {
    if (step.isAccessible) {
      goToStep(step.id)
    }
  }

  return (
    <div className={`workflow-stepper ${className}`}>
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center space-x-8">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className="flex items-center">
              {/* Step content */}
              <div className="flex items-center">
                {/* Step button */}
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={!step.isAccessible}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    step.isComplete
                      ? 'border-blue-600 bg-blue-600 hover:bg-blue-700'
                      : step.isActive
                      ? 'border-blue-600 bg-white'
                      : step.isAccessible
                      ? 'border-gray-300 bg-white hover:border-gray-400'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  aria-current={step.isActive ? 'step' : undefined}
                >
                  <span className="sr-only">{step.title}</span>
                  {step.isComplete ? (
                    <Check className="h-4 w-4 text-white" aria-hidden="true" />
                  ) : (
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      step.isActive ? 'bg-blue-600' : 'bg-transparent'
                    }`} />
                  )}
                </button>

                {/* Step label */}
                {showLabels && (
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      step.isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {step.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div className="ml-8 flex items-center">
                  <ChevronRight className={`h-4 w-4 ${
                    step.isComplete ? 'text-blue-600' : 'text-gray-300'
                  }`} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}

export default WorkflowStepper
