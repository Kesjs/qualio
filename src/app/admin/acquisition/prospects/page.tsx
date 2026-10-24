import { redirect } from 'next/navigation'

/** Ancienne page : tout le flux de prospection tient maintenant sur /admin/acquisition. */
export default function Page() { redirect('/admin/acquisition') }
