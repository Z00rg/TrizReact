/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

type UiScrollImgProps = {
  img: string[];
  className?: string;
  onIndexChange?: (index: number) => void;
  height?: string;
};

export function UiScrollImg({
  img,
  className,
  onIndexChange,
  height,
}: UiScrollImgProps) {
  const heightProps = height ? height : "h-[35svh]";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [imageWidth, setImageWidth] = useState(375);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // ——— 1. Измеряем ширину контейнера ———
  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setImageWidth(scrollContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const id = setTimeout(updateWidth, 50);
    window.addEventListener("resize", updateWidth);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // ——— 2. Обработка скролла ———
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const newIndex = Math.round(scrollLeft / imageWidth);
    const clampedIndex = Math.min(Math.max(0, newIndex), img.length - 1);
    onIndexChange?.(clampedIndex);
  };

  // ——— 3. Управление модалкой ———
  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isModalOpen]);

  return (
    <>
      {/* Скролл-контейнер */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={clsx(
          className,
          "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden",
          "scrollbar-hide scroll-smooth",
          "mx-auto w-full",
          heightProps
        )}
      >
        {img.map((src, index) => (
          <div
            key={"img-" + index}
            className={clsx(
              "flex-shrink-0 items-center snap-center cursor-zoom-in w-full",
              heightProps
            )}
            onClick={() => openModal(index)}
          >
            <Image
              src={src}
              alt={`Image ${index + 1}`}
              width={375}
              height={200}
              className={clsx("object-scale-down w-full h-full")}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Модалка — универсальная для ЛЮБЫХ пропорций */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeModal}
        >
          <div
            className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Крестик */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white text-3xl font-light hover:text-gray-300 z-10"
              aria-label="Закрыть"
            >
              &times;
            </button>

            {/* Изображение — fill + object-contain */}
            <div className="relative w-full h-full">
              {/* Изображение — через <img> с object-contain (без next/image fill) */}
              <img
                src={img[modalImageIndex]}
                alt={`Fullscreen ${modalImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="eager"
                draggable="false"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
