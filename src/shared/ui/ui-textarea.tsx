import clsx from "clsx";
import { ReactNode, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type UiTextAreaProps = {
  className?: string;
  children?: ReactNode;
  textAreaRef?: React.Ref<HTMLDivElement>;
  height?: string;
  contentKey?: string | number;
};

export function UiTextArea({
  className,
  children,
  height,
  contentKey,
}: UiTextAreaProps) {
  const heightProps = height ? height : "h-[40svh]";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentKey === undefined) return;
    if (containerRef.current) {
      const timer = setTimeout(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [contentKey]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        className,
        heightProps,
        "w-[60svw] mx-auto",
        "text-[16px] font-normal bg-[#F1F1F1] pt-3 px-[17px]",
        "shadow-[0px_4px_4px_rgba(0,0,0,0.25)] rounded-[20px]",
        "overflow-y-auto overflow-x-hidden scroll-smooth",
        "flex flex-col",
        "text-justify hyphens-auto"
      )}
    >
      {typeof children === "string" ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Абзац: 1.5 интерлиньяж + отступ первой строки 1.25em
            p: ({ children }) => (
              <p
                className="mb-2 last:mb-0 leading-6" // leading-6 = 24px = 16px × 1.5
                // style={{ textIndent: '1.25em' }}
              >
                {children}
              </p>
            ),

            // Ненумерованный список: отступ слева остаётся, но без text-indent внутри li
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-2">{children}</ul>
            ),

            // Элемент списка: без отступа первой строки (по стандарту)
            li: ({ children }) => (
              <li className="mb-2" style={{ textIndent: "0" }}>
                {children}
              </li>
            ),

            strong: ({ children }) => (
              <strong className="font-bold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {children}
        </ReactMarkdown>
      ) : (
        children
      )}
    </div>
  );
}
