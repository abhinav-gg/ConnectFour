import { myConfig } from "@/config/env";

export const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
  
    const popup = window.open(
      `${myConfig.BACKEND_URL}/auth/google/start`, // Triggers backend OAuth login
      'GoogleLogin',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  
    const receiveMessage = (event: MessageEvent) => {
      if (event.origin !== myConfig.BACKEND_URL) return;
  
      popup?.close();
      window.removeEventListener('message', receiveMessage);
    
      if (event.data?.type === 'oauth-register') {
        
        const { token } = event.data;
        window.location.href = `/auth/register?jwt=${token}`;

      } else if (event.data?.type === 'oauth-login') {
        
        
        window.location.href = '/profile'
      }
    };
  
    window.addEventListener('message', receiveMessage);
  };