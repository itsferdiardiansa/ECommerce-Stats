import Link from 'next/link'
import { Button } from '@rufieltics/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-muted-foreground text-7xl font-bold tracking-tight sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold">
        This page pulled a disappearing act.
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        We looked everywhere - under the sofa, behind the server rack, even in
        the audit log. It&apos;s just not here.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  )
}
