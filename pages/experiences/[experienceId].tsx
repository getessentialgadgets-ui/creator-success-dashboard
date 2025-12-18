import React from 'react'
import { parse } from 'cookie'
import { createWhopClient } from '@/lib/whop'
import { Container, Card, Heading, Text, Button } from '@whop/react/components'

export default function ExperiencePage({ experience, access }: { experience?: any; access?: any }) {
  if (!experience) {
    return (
      <div className="min-h-screen bg-[#071018] text-zinc-100 flex items-center justify-center">
        <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
          <h1 className="text-2xl font-semibold">Experience</h1>
          <p className="text-zinc-400 mt-2">Experience not found or you do not have access.</p>
          <div className="mt-4">
            <Button variant="classic" as="a" href="/">Back to app</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Container className="p-6">
      <Card>
        <Heading size={4}>{experience?.title ?? 'Experience'}</Heading>
        <Text className="text-sm text-gray-500 mt-2">ID: {experience?.id}</Text>
        <div className="mt-4">
          <Text>{experience?.description ?? 'No description available.'}</Text>
        </div>
        <div className="mt-4">
          <Text>Access: {access?.allowed ? 'Allowed' : 'Not allowed'}</Text>
        </div>
      </Card>
    </Container>
  )
}

export async function getServerSideProps({ req, params }: any) {
  const { experienceId } = params || {}
  const cookies = parse(req.headers.cookie || '')
  const token = cookies.whop_token || null
  if (!token) return { props: { experience: null } }
  const client = createWhopClient(token)
  if (!client) return { props: { experience: null } }

  try {
    const [experience, user] = await Promise.all([
      client.experiences.retrieve(experienceId),
      client.auth?.getUser?.(),
    ])
    const userId = user?.id || user?.userId || null
    const access = await client.users.checkAccess(experienceId, { id: userId })
    return { props: { experience, access } }
  } catch (err) {
    return { props: { experience: null } }
  }
}
