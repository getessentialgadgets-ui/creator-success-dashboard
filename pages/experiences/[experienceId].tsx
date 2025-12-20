import React from 'react'
import { parse } from 'cookie'
import { createWhopClient } from '../../lib/whop'
// Local UI primitives so SSR doesn't import heavier UI packages
const Container = ({ children, className = '' }: any) => <div className={className}>{children}</div>
const Card = ({ children, className = '' }: any) => <div className={`bg-zinc-900 rounded-xl border border-zinc-800 p-4 ${className}`}>{children}</div>
const Heading = ({ children, className = '' }: any) => <h2 className={`text-2xl font-semibold ${className}`}>{children}</h2>
const Text = ({ children, className = '' }: any) => <p className={className}>{children}</p>
const Button = (props: any) => <a className="px-3 py-2 rounded bg-zinc-800 inline-block" {...props}>{props.children}</a>

export default function ExperiencePage({ experience, access, embedPreview }: { experience?: any; access?: any; embedPreview?: boolean }) {
  if (!experience && !embedPreview) {
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

  // If embed preview is enabled but there is no real experience, show a read-only mock experience
  if (!experience && embedPreview) {
    const preview = {
      id: String(Date.now()),
      title: 'Experience (Preview)',
      description: 'This is a read-only preview of the experience to show how content will appear when embedded in Whop.'
    }

    return (
      <Container className="p-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Heading size={4}>{preview.title}</Heading>
              <Text className="text-sm text-gray-500 mt-2">ID: {preview.id}</Text>
            </div>
            <div>
              {/* @ts-expect-error client */}
              <EmbedPreviewBanner text="Embedded preview — read-only" />
            </div>
          </div>

          <div className="mt-4">
            <Text>{preview.description}</Text>
          </div>
          <div className="mt-4">
            <Text>Access: Preview (read-only)</Text>
          </div>
        </Card>
      </Container>
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

  // Detect embed like in dashboard — prefer a read-only preview when embedded
  const referer = (req.headers?.referer || '') as string
  const isIframeHeader = req.headers && (req.headers['sec-fetch-dest'] === 'iframe' || req.headers['x-whop-embed'] === '1')
  const isEmbed = !!(referer.includes('whop.com') || referer.includes('whop.app') || isIframeHeader || (req.url && req.url.includes('embed=1')))

  const cookies = parse(req.headers.cookie || '')
  const token = cookies.whop_token || null
  if (!token) {
    if (isEmbed) {
      const preview = {
        id: experienceId,
        title: 'Experience (Preview)',
        description: 'This is a read-only preview of the experience to show how content will appear when embedded in Whop.'
      }
      return { props: { experience: preview, access: { allowed: false }, embedPreview: true } }
    }

    return { props: { experience: null } }
  }
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
