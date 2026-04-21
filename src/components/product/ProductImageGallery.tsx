"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImage = {
  image_url: string;
  is_thumbnail: boolean | null;
  sort_order: number | null;
};

type Props = {
  images: ProductImage[];
  productName: string;
  isSoldOut: boolean;
};

export default function ProductImageGallery({ images, productName, isSoldOut }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const mainImage = images[selectedIndex]?.image_url ?? "/placeholder.png";

  return (
    <div className="space-y-3">
      {/* 메인 이미지 */}
      <div className="overflow-hidden rounded-3xl bg-white border border-[#E8E6E1]">
        <div className="relative aspect-square">
          <Image
            src={mainImage}
            alt={productName}
            fill
            className={`object-cover transition-all duration-300 ${isSoldOut ? "opacity-60" : ""}`}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="badge-sold-out text-sm px-4 py-1.5">품절</span>
            </div>
          )}
          {/* 이미지 인덱스 표시 (여러 장일 때) */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {/* 썸네일 목록 */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {images.map((img, i) => (
            <button
              key={`${img.image_url}-${i}`}
              type="button"
              onClick={() => setSelectedIndex(i)}
              aria-label={`${productName} 이미지 ${i + 1}`}
              className={`overflow-hidden rounded-xl border-2 bg-white transition-all duration-150 ${
                selectedIndex === i
                  ? "border-[#5332C9] shadow-md scale-[1.03]"
                  : "border-[#E8E6E1] hover:border-[#5332C9]/40 hover:scale-[1.02]"
              }`}
            >
              <div className="relative aspect-square">
                <Image
                  src={img.image_url}
                  alt={`${productName} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
