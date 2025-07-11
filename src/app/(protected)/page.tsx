import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { useAuthorized } from '@/libs/actions/guard'

export default async function ProtectedPage() {
  const cookieData = (await cookies()).getAll()
  const auth = await useAuthorized()
  if (auth.sub) {
    redirect(`/${auth.sub}`)
  } else {
    redirect(`/welcome?msg=Unauthorized`)
  }

  return null
}
