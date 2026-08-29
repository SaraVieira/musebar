import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { LogOut } from 'lucide-react'
import { auth } from '#/lib/auth'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/pouf/Button'

const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  return auth.api.getSession({ headers: request.headers })
})

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ href: '/login' })
    return { session }
  },
  component: Dashboard,
})

function Dashboard() {
  const { session } = Route.useRouteContext()
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    await router.invalidate()
    router.navigate({ href: '/login' })
  }

  return (
    <div>
      <header className="flex items-center justify-between p-4 border-b">
        <span className="text-sm text-muted">{session.user.email}</span>
        <Button variant="quiet" onClick={signOut}>
          <LogOut aria-hidden />
          Log out
        </Button>
      </header>
      <main className="p-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
      </main>
    </div>
  )
}
