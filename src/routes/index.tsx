import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  return auth.api.getSession({ headers: request.headers })
})

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession()
    throw redirect({ href: session ? '/dashboard' : '/login' })
  },
})
