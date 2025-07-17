import { myConfig } from "@/config/env";

const handleGoogleLogin = () => {
  const GOOGLE_CLIENT_ID = myConfig.GOOGLE_CLIENT_ID!;
  const redirectUri = "http://localhost:3001/auth/google/callback"; // Update to your backend OAuth2 callback URL
  const scope = "email profile";
  const responseType = "code";
  const state = encodeURIComponent("some-random-string-or-csrf");

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

  window.location.href = oauthUrl;
};