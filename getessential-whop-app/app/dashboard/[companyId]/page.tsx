import { Card, Container, Heading, Text, Badge, Button } from "@whop/react/components";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import TokenListener from '@/components/TokenListener'

type Props = {
  params: { companyId: string };
};

export default async function DashboardPage({ params }: Props) {
  const { companyId } = params;

  try {
    // Verify the user's token from request headers (server-side)
    const hdrs = await headers();
    const { userId } = await whopsdk.verifyUserToken(hdrs);

    // Check access to the company
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });
    if (!access || access.allowed === false) {
      return (
        <Container className="p-6">
          <Card tone="critical">
            <Heading size={4}>No access to this company</Heading>
            <Text className="mt-2">You do not have access to company <strong>{companyId}</strong>.</Text>
          </Card>
        </Container>
      );
    }

    return (
      <Container className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
    // Fallback UI: server-side verification failed. Provide an interactive client that
    // can receive a token via postMessage or manual paste and exchange it for a server cookie.

    return (
      <Container className="p-6">
        <Card tone="critical">
          <Heading size={4}>Authentication required</Heading>
          <Text className="mt-2">Unable to verify your session: {err?.message ?? 'Invalid or missing token'}</Text>
          {/* Render the client-side token listener */}
          <div className="mt-4">
            {/* @ts-expect-error Server Component rendering a client component */}
            <TokenListener />
          </div>
        </Card>
      </Container>
    );
  }
}
