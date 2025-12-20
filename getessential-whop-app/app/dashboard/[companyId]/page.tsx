import { Card, Container, Heading, Text, Badge, Button } from "@whop/react/components";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import TokenListener from '@/components/TokenListener'

type Props = {
  params: { companyId: string };
};

export default async function DashboardPage({ params }: Props) {
  const { companyId } = params;

  // Minimal server-side timeout utility so we never hang in an iframe
  async function withTimeout<T>(p: Promise<T>, ms = 3000): Promise<T> {
    let timeoutId: NodeJS.Timeout
    const timeout = new Promise<never>((_, rej) => {
      timeoutId = setTimeout(() => rej(new Error('verification timeout')), ms)
    })
    try {
      const res = await Promise.race([p, timeout])
      return res as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  try {
    // Verify the user's token from request headers (server-side) with a short timeout
    const hdrs = await headers();
    const { userId } = await withTimeout(whopsdk.verifyUserToken(hdrs), 3000)

    // Check access to the company with a short timeout
    const access = await withTimeout(whopsdk.users.checkAccess(companyId, { id: userId }), 3000)
    if (!access || access.allowed === false) {
      return (
        <Container className="p-4">
          <Card tone="critical">
            <Heading size={5}>No access to this company</Heading>
            <Text className="mt-2">You do not have access to company <strong>{companyId}</strong>.</Text>
            <div className="mt-3 flex gap-2">
              <Button variant="classic" as="a" href="/">Back to app</Button>
            </div>
          </Card>
        </Container>
      );
    }

    return (
      <Container className="p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Heading size={3}>Creator Success Dashboard</Heading>
                <Text className="mt-1 text-gray-500">Company ID: <strong>{companyId}</strong></Text>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone="positive">Access verified</Badge>
                  <Text className="text-sm text-gray-400">User: <strong>{userId}</strong></Text>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="classic" size={2} as="a" href="/">Open App</Button>
              </div>
            </div>

            <div className="mt-6">
              <Text>This page is rendered on the server using Whop SDK verification and access checks.</Text>
            </div>
          </Card>
        </div>
      </Container>
    );
  } catch (err: any) {
    // If verification times out or fails, show a clear fallback and interactive token listener.
    // When embedded inside Whop, prefer showing a read-only preview so the iframe doesn't remain blank.
    const referer = String(hdrs.get('referer') || '')
    const isIframeHeader = hdrs.get('sec-fetch-dest') === 'iframe' || hdrs.get('x-whop-embed') === '1'
    const isEmbed = !!(referer.includes('whop.com') || referer.includes('whop.app') || isIframeHeader || referer.includes('embed=1'))

    if (isEmbed) {
      // Render a static preview read-only dashboard
      return (
        <Container className="p-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Heading size={3}>Creator Success Dashboard</Heading>
                  <Text className="mt-1 text-gray-500">Company ID: <strong>{companyId}</strong></Text>
                  <div className="mt-2">
                    {/* @ts-expect-error server rendering client component */}
                    <div style={{ marginTop: 6 }}><span style={{ padding: '4px 8px', borderRadius: 6, background: '#FFD54F', color: '#000', fontWeight: 600 }}>Embedded preview — read-only</span></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="classic" size={2} as="a" href="/">Open App</Button>
                </div>
              </div>

              <div className="mt-6">
                <Text>This preview shows sample metrics and layout when embedded in Whop.</Text>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900 p-4 rounded-lg">Active Members: <strong>128</strong></div>
                  <div className="bg-zinc-900 p-4 rounded-lg">MRR: <strong>$1,299.00</strong></div>
                  <div className="bg-zinc-900 p-4 rounded-lg">Sales: <strong>412</strong></div>
                </div>

              </div>
            </Card>
          </div>
        </Container>
      );
    }

    return (
      <Container className="p-4">
        <Card tone="critical">
          <Heading size={5}>Authentication required</Heading>
          <Text className="mt-2">Unable to verify your session: {err?.message ?? 'Invalid or missing token'}</Text>

          <div className="mt-4">
            <Text className="mb-2">You can ask the parent to post a token to this iframe, or paste a token below to continue.</Text>
            {/* @ts-expect-error Server Component rendering a client component */}
            <TokenListener />
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" size={2} as="a" href="/test-parent">Open local test</Button>
              <Button variant="classic" size={2} onClick={() => { /* no-op server side */ }} as="a" href="/">Back to app</Button>
            </div>
          </div>
        </Card>
      </Container>
    );
  }
}
