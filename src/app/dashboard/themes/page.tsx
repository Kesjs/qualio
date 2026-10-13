import { redirect } from 'next/navigation'

// Thèmes n'est plus une page : c'est un filtre de la liste des avis (doc 6, point 6).
export default function Page() {
  redirect('/dashboard/feedback')
}
