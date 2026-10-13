import { redirect } from 'next/navigation'

// Actions n'est plus une page : les recommandations et leur historique sont dans « Cette semaine ».
export default function Page() {
  redirect('/dashboard')
}
