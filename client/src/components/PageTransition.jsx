import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

/**
 * Fades + lifts each route's content in on navigation. Keying the wrapper on
 * the pathname forces a full remount on every route change (query-param-only
 * changes within the same page do not remount), which is what gives GSAP a
 * fresh element to animate from — there is no matching exit animation, since
 * that needs the old page kept mounted during the transition (e.g. via
 * react-transition-group), which this app doesn't otherwise depend on.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const nodeRef = useRef(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !nodeRef.current) return;

    gsap.fromTo(
      nodeRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
    );
  }, [location.pathname]);

  return (
    <div ref={nodeRef} key={location.pathname}>
      {children}
    </div>
  );
}
