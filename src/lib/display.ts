import type { Milestone, Task } from './types'

/**
 * Extract milestone number from ID (e.g., "M1" -> "1", "milestone_1" -> "1")
 */
export function getMilestoneNumber(id: string): string {
  // Handle M1, M2, M3... format
  if (/^M\d+$/.test(id)) {
    return id.substring(1)
  }
  // Handle milestone_1, milestone_2... format
  if (/^milestone_\d+$/.test(id)) {
    return id.replace('milestone_', '')
  }
  // Fallback: try to extract any number
  const match = id.match(/\d+/)
  return match ? match[0] : id
}

/**
 * Extract task number from ID (e.g., "task_1" -> "1", "79" -> "79")
 */
export function getTaskNumber(id: string): string {
  // Handle task_1, task_2... format
  if (/^task_\d+$/.test(id)) {
    return id.replace('task_', '')
  }
  // Handle numeric IDs
  if (/^\d+$/.test(id)) {
    return id
  }
  // Fallback: try to extract any number
  const match = id.match(/\d+/)
  return match ? match[0] : id
}

/**
 * Format milestone display name with prefix (e.g., "M1 — Project Setup")
 */
export function formatMilestoneName(milestone: Milestone): string {
  const num = getMilestoneNumber(milestone.id)
  return `M${num} — ${milestone.name}`
}

/**
 * Format task display name with prefix (e.g., "T1 — Install dependencies")
 */
export function formatTaskName(task: Task): string {
  const num = getTaskNumber(task.id)
  return `T${num} — ${task.name}`
}
