"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import type { ProductImage } from "@/features/products/types";
import { cn } from "@/lib/utils/cn";

type ProductGalleryProps = {
  images: readonly ProductImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) {
    return null;
  }

  return (
    <div>
      <div className="bg-surface border-border/70 relative aspect-square overflow-hidden rounded-xl border">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeImage.src}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              priority={activeIndex === 0}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 ? (
        <div className="mt-4 grid [scrollbar-width:none] auto-cols-[5.25rem] grid-flow-col justify-start gap-3 overflow-x-auto pb-1 sm:auto-cols-[6.5rem] [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              className={cn(
                "bg-surface border-border relative aspect-square min-h-20 overflow-hidden rounded-md border transition-[border-color,opacity] duration-500 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
                index === activeIndex
                  ? "border-primary opacity-100"
                  : "hover:border-muted-foreground opacity-65 hover:opacity-100",
              )}
              aria-label={`نمای ${index + 1} از ${productName}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <Image
                src={image.src}
                alt=""
                fill
                sizes="104px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
