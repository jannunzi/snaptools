"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  createContext,
  type ReactNode,
} from "react";
import Link from "next/link";

type ProjectorValue = {
  projector: boolean;
  toggle: () => void;
  exit: () => void;
};

const ProjectorContext = createContext<ProjectorValue>({
  projector: false,
  toggle: () => {},
  exit: () => {},
});

export function useMathLabProjector() {
  return useContext(ProjectorContext);
}

/**
 * Shared projector chrome for Math Labs: full screen and a toolbar row.
 * The lab index is /math-labs.
 */
export function MathLabFrame({
  label,
  toolbar,
  children,
}: {
  label: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [nativeFull, setNativeFull] = useState(false);
  const [cssFull, setCssFull] = useState(false);
  const projector = nativeFull || cssFull;

  useEffect(() => {
    const onChange = () => {
      setNativeFull(document.fullscreenElement === ref.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!cssFull) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cssFull]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    setCssFull(false);
  }, []);

  const toggle = useCallback(() => {
    if (projector) {
      exit();
      return;
    }
    const node = ref.current;
    if (node?.requestFullscreen && document.fullscreenEnabled) {
      const pending = node.requestFullscreen();
      void Promise.resolve(pending).catch(() => setCssFull(true));
      return;
    }
    setCssFull(true);
  }, [exit, projector]);

  return (
    <ProjectorContext.Provider value={{ projector, toggle, exit }}>
      <section
        ref={ref}
        aria-label={label}
        className={`bg-bg ${
          cssFull ? "fixed inset-0 z-50 overflow-auto p-4 sm:p-8" : ""
        } [&:fullscreen]:overflow-auto [&:fullscreen]:bg-bg [&:fullscreen]:p-4 sm:[&:fullscreen]:p-8`}
      >
        <div className="no-print mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="snap-btn shrink-0"
            aria-pressed={projector}
            onClick={toggle}
          >
            {projector ? "Exit full screen" : "Full screen"}
          </button>
          {toolbar}
        </div>
        {children}
        {projector ? null : (
          <p className="no-print mt-6 border-t border-line/70 pt-4 text-sm text-ink-muted">
            <Link href="/math-labs#signup" className="snap-link">
              Classroom math labs — new tools + tell us what to build.
            </Link>
          </p>
        )}
      </section>
    </ProjectorContext.Provider>
  );
}
