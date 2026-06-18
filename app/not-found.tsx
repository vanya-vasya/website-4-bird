import Footer from '@/components/landing/footer'
import Header from '@/components/landing/header'
import { Button } from '@/components/fastbird'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-surface text-ink">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="font-mono text-eyebrow uppercase text-green">// 404</p>
        <h1 className="font-heading text-h1 font-medium text-ink">Page not found.</h1>
        <p className="max-w-md text-[15px] text-ink-soft">
          That page doesn&apos;t exist — but there&apos;s plenty of data waiting wherever you&apos;re headed.
        </p>
        <Button href="/" variant="primary" size="md">Back to home</Button>
      </div>
      <Footer />
    </main>
  )
}