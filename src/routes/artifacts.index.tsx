import { createFileRoute } from '@tanstack/react-router'
import { DocumentList } from '../components/DocumentList'

export const Route = createFileRoute('/artifacts/')({
  component: ArtifactsPage,
})

function ArtifactsPage() {
  return <DocumentList title="Artifacts" dirPath="agent/artifacts" baseTo="/artifacts" />
}
