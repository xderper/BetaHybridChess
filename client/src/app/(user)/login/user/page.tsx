import LoginForm from '@/components/LoginForm'

export default function UserLoginPage() {
  return <LoginForm role="user" redirectPath="/profile" />
}