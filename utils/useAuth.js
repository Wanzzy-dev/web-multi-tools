import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json.success) {
          setUser(json.user);
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [router]);

  return { user, setUser, loading };
}
