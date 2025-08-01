'use client'

import { notFound, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import React from 'react';

const redirectMap: Record<string, string> = {
  'login': '/auth/login',
  'register': '/auth/register',
  'community': 'https://linktr.ee/con4uk',
  'home': '/',
};

export default function SlugPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const { slug = [] } = React.use(params as unknown as Promise<{ slug?: string[] }>);
    const slugPath = slug.join('/');
    const target = redirectMap[slugPath];

    useEffect(() => {
        if (!target) {
            console.error(target)
            notFound();
        }
        router.replace(target);
      });
    
  return <></>;
}
