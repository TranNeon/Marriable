import { LoginForm } from '#/components/login-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LoginForm> </LoginForm>
}
