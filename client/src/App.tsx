import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Spinner } from './components/ui/Spinner';
import { LoginPage } from './features/auth/LoginPage';
import { GameSelectionScreen } from './features/gameSelection/GameSelectionScreen';
import { CompanionView } from './features/companionView/CompanionView';
import { ProfilePage } from './features/profile/ProfilePage';

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireGuest({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!isInitialized) return <Spinner />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/" element={<RequireAuth><GameSelectionScreen /></RequireAuth>} />
        <Route path="/game/:gamePk" element={<RequireAuth><CompanionView /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
