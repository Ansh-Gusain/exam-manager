import { RouterProvider } from 'react-router';
import { router } from './routes.jsx';
import { StoreProvider } from './lib/store';
import { AuthProvider } from './lib/auth-context';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';

// Replace with your Google OAuth Client ID from https://console.cloud.google.com
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <StoreProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </StoreProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
