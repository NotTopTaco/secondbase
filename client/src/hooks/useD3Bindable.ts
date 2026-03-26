import { useRef, useEffect, useState, useCallback, type DependencyList } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

type DrawFunction = (
  container: SVGSVGElement,
  dimensions: Dimensions,
) => void | (() => void);

interface UseD3BindableResult {
  containerRef: React.RefObject<SVGSVGElement | null>;
  dimensions: Dimensions;
}

export function useD3Bindable(
  draw: DrawFunction,
  deps: DependencyList,
): UseD3BindableResult {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  const drawRef = useRef(draw);
  drawRef.current = draw;

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions((prev) => {
        if (prev.width === rect.width && prev.height === rect.height) return prev;
        return { width: rect.width, height: rect.height };
      });
    }
  }, []);

  useEffect(() => {
    // Delay initial measure to ensure layout has completed
    const raf = requestAnimationFrame(() => {
      measure();
    });

    const el = containerRef.current?.parentElement;
    if (!el) return () => cancelAnimationFrame(raf);

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    try {
      const cleanup = drawRef.current(containerRef.current, dimensions);
      return () => {
        if (cleanup) cleanup();
      };
    } catch (e) {
      console.error('[useD3Bindable] draw error:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, ...deps]);

  return { containerRef, dimensions };
}
