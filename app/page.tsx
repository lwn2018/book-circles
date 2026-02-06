import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to circles tab (new home)
  redirect('/circles')
}
