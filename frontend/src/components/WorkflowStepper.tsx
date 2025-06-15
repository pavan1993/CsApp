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
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${
                    step.isComplete ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                </div>
              )}

              {/* Step button */}
              <button
                onClick={() => handleStepClick(step)}
                disabled={!step.isAccessible}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
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
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    step.isActive ? 'bg-blue-600' : 'bg-transparent'
                  }`} />
                )}
              </button>

              {/* Step label */}
              {showLabels && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-center">
                  <div className={`text-xs font-medium ${
                    step.isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 max-w-20">
                    {step.description}
                  </div>
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
