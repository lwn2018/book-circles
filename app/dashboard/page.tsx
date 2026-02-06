import { redirect } from 'next/navigation'

export default function Dashboard() {
  // Redirect old dashboard to new circles tab
  redirect('/circles')
}
