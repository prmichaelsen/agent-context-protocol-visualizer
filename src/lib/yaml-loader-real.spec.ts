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
      expect(['completed', 'in_progress', 'not_started']).toContain(m.status)
    }

    console.log(
      `Parsed: ${result.milestones.length} milestones, ${totalTasks} tasks, ${result.recent_work.length} work entries`,
    )
  })
})
