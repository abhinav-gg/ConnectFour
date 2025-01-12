import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getConfig } from '@/config/env';

const TestAnonymousPage = () => {
  const router = useRouter();
  const config = getConfig();

  useEffect(() => {
    const createAnonymousAccount = async () => {
      try {
        const response = await fetch(`${config.backendUrl}/api/auth/anonymous`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error('Failed to create anonymous account');
        }

        const data = await response.json();
        console.log('Anonymous account created:', data);
        // Redirect to /game after successful account creation
        router.push('/game');
      } catch (error) {
        console.error('Error creating anonymous account:', error);
      }
    };

    createAnonymousAccount();
  }, [router]);

  return <div>Creating anonymous account...</div>;
};

export default TestAnonymousPage;
