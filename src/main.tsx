import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consumeEmailTokenFromUrl } from './lib/email-token'

// Must run SYNCHRONOUSLY before React renders anything.
// If the URL carries ?token= (email magic-link), this swaps the session to the
// link's recipient BEFORE any component reads localStorage, calls /me, or
// React Router navigates away from the landing path (stripping the token).
consumeEmailTokenFromUrl()

// NOTE: <StrictMode> was removed intentionally — it double-invokes effects in
// dev, firing every API request twice. Production was never affected; this makes
// dev match production (one request per endpoint). No logic was changed.
createRoot(document.getElementById('root')!).render(
  <App />,
)
