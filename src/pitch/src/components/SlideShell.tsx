import type { ReactNode } from 'react';

interface SlideShellProps {
  id: number;
  children: ReactNode;
  background?: ReactNode;
}

export function SlideShell({ id, children, background }: SlideShellProps) {
  return (
    <section
      id={`slide-${id}`}
      className="relative w-full h-screen flex-shrink-0 snap-start snap-always overflow-hidden"
    >
      {background}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-6 md:px-16 lg:px-24">
        {children}
      </div>
    </section>
  );
}
