import type { ReactNode, CSSProperties } from "react";

interface ContainerProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const Container = ({ children, style, className = "" }: ContainerProps) => {
  return (
    <div
      className={`w-full max-w-[95vw] md:max-w-[90vw] xl:max-w-[85vw] mx-auto px-0 md:px-6 py-6 md:py-8 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export { Container };
