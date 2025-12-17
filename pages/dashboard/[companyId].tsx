import React from 'react'
import { parse } from 'cookie'
import { createWhopClient } from '@/lib/whop'
import TokenListener from '../../getessential-whop-app/components/TokenListener'
import { Card, Heading, Text, Container, Badge, Button } from '@whop/react/components'

// Ensure this page always renders server-side, shows a clear loading/fallback UI,
// and attempts a best-effort verification using whop token cookie when present.

export default function CompanyDashboard({ companyId, accessVerified, userId }: { companyId: string; accessVerified: boolean; userId?: string }) {
  return (
    <Container className="p-4">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading size={3}>Creator Success Dashboard</Heading>
              <Text className="text-sm text-gray-500">Company ID: <strong>{companyId}</strong></Text>
            </div>
            <div className="flex items-center gap-2">
              {accessVerified ? <Badge tone="positive">Access verified</Badge> : <Badge tone="caution">Not verified</Badge>}
            </div>
          </div>

          {accessVerified ? (
            <Text>Welcome back, user <strong>{userId}</strong>. Your dashboard content will load here.</Text>
          ) : (
            <div>
              <Text className="mb-2">You are not authenticated. Use the token postMessage from the parent or paste a token below to continue.</Text>
              {/* @ts-expect-error Client component */}
              <TokenListener />
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button variant="ghost" as="a" href="/">Back to app</Button>
            <Button variant="classic" as="a" href="/test-parent">Local test</Button>
          </div>
        </div>
      </Card>
    </Container>
  )
}

export async function getServerSideProps({ req, params }: any) {
  const { companyId } = params || {}

  function withTimeout(p: Promise<any>, ms = 3000) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
  }

  try {
    const cookies = parse(req.headers.cookie || '')
    const token = cookies.whop_token || null
    if (!token) return { props: { companyId, accessVerified: false } }

    const client = createWhopClient(token)
    if (!client) return { props: { companyId, accessVerified: false } }

    // Attempt to get user and check access with a short timeout
    const user = await withTimeout(client.auth?.getUser?.())
    const userId = user?.id || user?.userId || user?.sub || null
    if (!userId) return { props: { companyId, accessVerified: false } }

    const access = await withTimeout(client.users?.checkAccess?.(companyId, { id: userId }))
    if (!access || access.allowed === false) return { props: { companyId, accessVerified: false } }

    return { props: { companyId, accessVerified: true, userId } }
  } catch (err) {
    return { props: { companyId, accessVerified: false } }
  }
}
