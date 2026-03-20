import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/artifacts')({
  component: ArtifactsLayout,
})

function ArtifactsLayout() {
  return <Outlet />
}
