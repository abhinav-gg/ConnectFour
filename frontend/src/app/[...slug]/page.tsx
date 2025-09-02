import { redirect, notFound } from 'next/navigation'

const redirectMap: Record<string, string> = {
  login: '/auth/login',
  register: '/auth/register',
  community: 'https://linktr.ee/con4uk',
  home: '/',
  profile: '/',
  game: '/play'
}

export async function generateStaticParams() {
  return Object.keys(redirectMap).map(key => ({ slug: [key] }))
}

export const dynamic = 'force-static'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params
  const slugPath = (resolvedParams.slug || []).join('/')
  const target = redirectMap[slugPath]

  if (!target) return notFound()
  redirect(target)
}
