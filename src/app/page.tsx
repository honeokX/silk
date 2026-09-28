import ImageViewer from '@/components/image-viewer'
import { site } from '@/config'

export default function HomePage() {
  return (
    <main className="container">
      <h1 className="page-title">{site.title}</h1>
      <ImageViewer />
    </main>
  )
}
