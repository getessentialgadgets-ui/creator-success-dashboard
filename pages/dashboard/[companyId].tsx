import React from 'react'
import Dashboard from '../dashboard'

export default function CompanyDashboard() {
  // Reuse the existing dashboard page UI — Whop will request /dashboard/:companyId
  // The page itself reads environment vars (NEXT_PUBLIC_WHOP_COMPANY_ID) or the whop session.
  return <Dashboard />
}
