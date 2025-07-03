import { redirect } from 'next/navigation'

import { useAuthorized } from '@/libs/jwt/guard'

export default async function ProtectedPage() {
  try {
    const auth = await useAuthorized()
    redirect(`/${auth.sub}`)
  } catch (error: any) {
    redirect(`/welcome?msg=${error.message}`)
  }
}
