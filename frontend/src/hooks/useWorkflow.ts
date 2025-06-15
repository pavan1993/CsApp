import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, Settings, BarChart3 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { WorkflowStep } from '../components/WorkflowStepper'

export interface WorkflowState {
  currentStepId: string
  completedSteps: Set<string>
  stepData: Record<string, any>
}

const WORKFLOW_STEPS = [
  {
    id: 'import',
    title: 'Data Import',
    description: 'Upload tickets & usage data',
    icon: FileText,
    path: '/import',
  },
  {
    id: 'configuration',
    title: 'Configuration',
    description: 'Set up mappings & thresholds',
    icon: Settings,
    path: '/configuration',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Review insights & debt analysis',
    icon: BarChart3,
    path: '/analytics',
  },
]

export const useWorkflow = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState } = useAppContext()
  
  const [workflowState, setWorkflowState] = useState<WorkflowState>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('workflow-state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          completedSteps: new Set(parsed.completedSteps || [])
        }
      } catch (e) {
        console.warn('Failed to parse saved workflow state')
      }
    }
    
    return {
      currentStepId: 'import',
      completedSteps: new Set<string>(),
      stepData: {}
    }
  })

  // Save workflow state to localStorage
  useEffect(() => {
    const stateToSave = {
      ...workflowState,
      completedSteps: Array.from(workflowState.completedSteps)
    }
    localStorage.setItem('workflow-state', JSON.stringify(stateToSave))
  }, [workflowState])

  // Update current step based on route
  useEffect(() => {
    const currentPath = location.pathname
    const matchingStep = WORKFLOW_STEPS.find(step => step.path === currentPath)
    if (matchingStep && matchingStep.id !== workflowState.currentStepId) {
      setWorkflowState(prev => ({
        ...prev,
        currentStepId: matchingStep.id
      }))
    }
  }, [location.pathname, workflowState.currentStepId])

  // Check step completion status
  const isStepComplete = useCallback((stepId: string): boolean => {
    switch (stepId) {
      case 'import':
        // Check if both tickets and usage data have been uploaded
        return workflowState.stepData.ticketsUploaded && workflowState.stepData.usageUploaded
      case 'configuration':
        // Check if basic configuration is complete
        return workflowState.stepData.mappingsConfigured && workflowState.stepData.thresholdsConfigured
      case 'analytics':
        // Analytics is complete when user has reviewed the data
        return workflowState.stepData.analyticsReviewed
      default:
        return workflowState.completedSteps.has(stepId)
    }
  }, [workflowState.stepData, workflowState.completedSteps])

  // Check if step is accessible
  const isStepAccessible = useCallback((stepId: string): boolean => {
    const stepIndex = WORKFLOW_STEPS.findIndex(step => step.id === stepId)
    if (stepIndex === 0) return true // First step is always accessible
    
    // Check if previous steps are complete
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepComplete(WORKFLOW_STEPS[i].id)) {
        return false
      }
    }
    return true
  }, [isStepComplete])

  // Generate steps with current state
  const steps: WorkflowStep[] = WORKFLOW_STEPS.map(step => ({
    ...step,
    isComplete: isStepComplete(step.id),
    isActive: step.id === workflowState.currentStepId,
    isAccessible: isStepAccessible(step.id)
  }))

  const currentStep = steps.find(step => step.isActive)

  const goToStep = useCallback((stepId: string) => {
    const step = WORKFLOW_STEPS.find(s => s.id === stepId)
    if (step && isStepAccessible(stepId)) {
      navigate(step.path)
    }
  }, [navigate, isStepAccessible])

  const nextStep = useCallback(() => {
    const currentIndex = WORKFLOW_STEPS.findIndex(step => step.id === workflowState.currentStepId)
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      const nextStepId = WORKFLOW_STEPS[currentIndex + 1].id
      if (isStepAccessible(nextStepId)) {
        goToStep(nextStepId)
      }
    }
  }, [workflowState.currentStepId, goToStep, isStepAccessible])

  const previousStep = useCallback(() => {
    const currentIndex = WORKFLOW_STEPS.findIndex(step => step.id === workflowState.currentStepId)
    if (currentIndex > 0) {
      const prevStepId = WORKFLOW_STEPS[currentIndex - 1].id
      goToStep(prevStepId)
    }
  }, [workflowState.currentStepId, goToStep])

  const markStepComplete = useCallback((stepId: string, data?: any) => {
    setWorkflowState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, stepId]),
      stepData: {
        ...prev.stepData,
        ...data
      }
    }))
  }, [])

  const updateStepData = useCallback((stepId: string, data: any) => {
    setWorkflowState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        [`${stepId}Data`]: data,
        ...data
      }
    }))
  }, [])

  const resetWorkflow = useCallback(() => {
    setWorkflowState({
      currentStepId: 'import',
      completedSteps: new Set(),
      stepData: {}
    })
    localStorage.removeItem('workflow-state')
  }, [])

  const getProgress = useCallback(() => {
    const completedCount = steps.filter(step => step.isComplete).length
    return Math.round((completedCount / steps.length) * 100)
  }, [steps])

  return {
    steps,
    currentStep,
    workflowState,
    goToStep,
    nextStep,
    previousStep,
    markStepComplete,
    updateStepData,
    resetWorkflow,
    getProgress,
    isStepComplete,
    isStepAccessible
  }
}
