import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Always scroll to top on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // use 'smooth' if you want animation
    });
  }, [pathname]);

  return null;
}
