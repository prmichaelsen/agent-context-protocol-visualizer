import { createFileRoute } from '@tanstack/react-router'
import { DocumentDetail } from '../components/DocumentDetail'

export const Route = createFileRoute('/artifacts/$slug')({
  component: ArtifactDetailPage,
})

function ArtifactDetailPage() {
  const { slug } = Route.useParams()
  return (
    <DocumentDetail
      slug={slug}
      dirPath="agent/artifacts"
      sectionLabel="Artifacts"
      sectionHref="/artifacts"
    />
  )
}
