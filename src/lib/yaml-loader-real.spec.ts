import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseProgressYaml } from './yaml-loader'

const PROJECT_ROOT = resolve(__dirname, '../../')

describe('parseProgressYaml with real files', () => {
  it('parses the local project progress.yaml', () => {
    const raw = readFileSync(resolve(PROJECT_ROOT, 'agent/progress.yaml'), 'utf-8')
    const result = parseProgressYaml(raw)

    expect(result.project.name).toBe('agent-context-protocol-visualizer')
    expect(result.milestones.length).toBeGreaterThan(0)
    expect(result.milestones[0].id).toBeTruthy()
  })

  it('parses a large real-world progress.yaml (remember-core)', () => {
    const path = '/home/prmichaelsen/.acp/projects/remember-core/agent/progress.yaml'
    let raw: string
    try {
      raw = readFileSync(path, 'utf-8')
    } catch {
      console.log('Skipping — remember-core progress.yaml not found')
      return
    }

    const result = parseProgressYaml(raw)

    expect(result.project.name).toBe('remember-core')
    expect(result.milestones.length).toBeGreaterThan(0)

    const totalTasks = Object.values(result.tasks).reduce(
      (sum, ts) => sum + ts.length,
      0,
    )
    expect(totalTasks).toBeGreaterThan(0)

    for (const m of result.milestones) {
      expect(['completed', 'in_progress', 'not_started', 'wont_do']).toContain(m.status)
    }

    console.log(
      `Parsed: ${result.milestones.length} milestones, ${totalTasks} tasks, ${result.recent_work.length} work entries`,
    )
  })

  it('parses agentbase.me progress.yaml with inline milestones and standalone tasks', () => {
    const path = '/home/prmichaelsen/.acp/projects/agentbase.me/agent/progress.yaml'
    let raw: string
    try {
      raw = readFileSync(path, 'utf-8')
    } catch {
      console.log('Skipping — agentbase.me progress.yaml not found')
      return
    }

    const result = parseProgressYaml(raw)

    // Should find project metadata
    expect(result.project.name).toBe('agentbase.me')

    // Should find inline milestones (milestone_1_firebase_analytics, etc.)
    expect(result.milestones.length).toBeGreaterThan(0)
    const milestoneIds = result.milestones.map((m) => m.id)
    expect(milestoneIds).toContain('M1')  // from milestone_1_firebase_analytics
    expect(milestoneIds).toContain('M47') // from milestone_47_agent_memory_system

    // Should find standard milestones too
    expect(milestoneIds).toContain('M19') // from milestones: array
    expect(milestoneIds).toContain('M21')

    // Should find tasks from inline milestones
    const m1Tasks = result.tasks['M1'] || []
    expect(m1Tasks.length).toBeGreaterThan(0)
    // Task 79 has wont_do status
    const wontDoTask = m1Tasks.find((t) => String(t.id) === '79')
    if (wontDoTask) {
      expect(wontDoTask.status).toBe('wont_do')
    }

    // Should find standalone/unassigned tasks
    const unassigned = result.tasks['_unassigned'] || []
    expect(unassigned.length).toBeGreaterThan(0)
    // Synthetic milestone should exist
    expect(milestoneIds).toContain('_unassigned')

    const totalTasks = Object.values(result.tasks).reduce(
      (sum, ts) => sum + ts.length,
      0,
    )

    // Should collect next_steps from next_immediate_steps too
    expect(result.next_steps.length).toBeGreaterThan(0)

    console.log(
      `Parsed agentbase.me: ${result.milestones.length} milestones, ${totalTasks} tasks, ${unassigned.length} unassigned`,
    )
  })
})
