/** Status values for milestones and tasks */
export type Status = 'completed' | 'in_progress' | 'not_started' | 'wont_do'

/** Unknown properties from agent-maintained YAML are preserved here */
export type ExtraFields = Record<string, unknown>

export interface ProgressData {
  project: ProjectMetadata
  milestones: Milestone[]
  tasks: Record<string, Task[]> // keyed by milestone_id
  recent_work: WorkEntry[]
  next_steps: string[]
  notes: string[]
  current_blockers: string[]
  documentation: DocumentationStats
  progress: ProgressSummary
}

export interface ProjectMetadata {
  name: string
  version: string
  started: string
  status: Status
  current_milestone?: string
  description: string
  extra: ExtraFields
}

export interface Milestone {
  id: string
  name: string
  status: Status
  progress: number // 0-100
  started: string | null
  completed: string | null
  estimated_weeks: string
  tasks_completed: number
  tasks_total: number
  notes: string
  extra: ExtraFields
}

export interface Task {
  id: string
  name: string
  status: Status
  milestone_id: string
  file: string
  estimated_hours: string
  completed_date: string | null
  notes: string
  extra: ExtraFields
}

export interface WorkEntry {
  date: string
  description: string
  items: string[]
  extra: ExtraFields
}

export interface DocumentationStats {
  design_documents: number
  milestone_documents: number
  pattern_documents: number
  task_documents: number
}

export interface ProgressSummary {
  planning: number
  implementation: number
  overall: number
}
