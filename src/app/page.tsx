import ImageViewer from '@/components/image-viewer'
import { SITE } from '@/config'

export default function HomePage() {
  return (
    <main className="container">
      <h1 className="page-title">{SITE.title}</h1>
      <ImageViewer />
    </main>
  )
}
