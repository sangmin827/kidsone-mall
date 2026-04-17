'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deleteProductImage,
  moveProductImage,
  setThumbnailImage,
  uploadProductImage,
} from '@/src/server/admin-product-images';
import type { AdminProductImage } from '@/src/server/admin-products';

type Props = {
  productId: number;
  images: AdminProductImage[];
};

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function ProductImageManager({ productId, images }: Props) {
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!ACCEPTED_MIME.includes(file.type)) {
        toast.error(`${file.name}: JPEG / PNG / WebP 만 업로드 가능합니다.`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: 5MB 를 초과합니다.`);
        return;
      }
    }

    startTransition(async () => {
      for (const file of fileArray) {
        const fd = new FormData();
        fd.set('productId', String(productId));
        fd.set('file', file);
        try {
          await uploadProductImage(fd);
          toast.success(`${file.name} 업로드 완료`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : '업로드 실패';
          toast.error(`${file.name}: ${message}`);
        }
      }
    });
  };

  const handleDelete = (imageId: number) => {
    if (!confirm('정말 이 이미지를 삭제할까요?')) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set('imageId', String(imageId));
      try {
        await deleteProductImage(fd);
        toast.success('이미지가 삭제되었습니다.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '삭제에 실패했습니다.';
        toast.error(message);
      }
    });
  };

  const handleSetThumbnail = (imageId: number) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('imageId', String(imageId));
      fd.set('productId', String(productId));
      try {
        await setThumbnailImage(fd);
        toast.success('대표 이미지가 변경되었습니다.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '변경에 실패했습니다.';
        toast.error(message);
      }
    });
  };

  const handleMove = (imageId: number, direction: 'up' | 'down') => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('imageId', String(imageId));
      fd.set('productId', String(productId));
      fd.set('direction', direction);
      try {
        await moveProductImage(fd);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '순서 변경에 실패했습니다.';
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? 'border-black bg-gray-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <p className="text-sm font-medium text-gray-800">
          여기로 이미지를 드래그하거나 클릭해서 업로드
        </p>
        <p className="text-xs text-gray-500">
          JPEG / PNG / WebP · 최대 5MB · 여러 장 동시 업로드 가능
        </p>
        {pending ? (
          <p className="text-xs text-blue-600">처리 중...</p>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME.join(',')}
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            // 같은 파일을 다시 올릴 수 있도록 리셋
            e.target.value = '';
          }}
        />
      </div>

      {/* 이미지 목록 */}
      {images.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          아직 등록된 이미지가 없습니다.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <li
              key={img.id}
              className={`relative overflow-hidden rounded-xl border bg-white ${
                img.is_thumbnail
                  ? 'border-black ring-2 ring-black'
                  : 'border-gray-200'
              }`}
            >
              <div className="relative aspect-square w-full bg-gray-100">
                <Image
                  src={img.image_url}
                  alt={`상품 이미지 ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 200px"
                  className="object-cover"
                  unoptimized
                />
                {img.is_thumbnail ? (
                  <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-0.5 text-[11px] font-medium text-white">
                    대표
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-1 border-t border-gray-100 p-2 text-[11px]">
                <div className="flex justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(img.id, 'up')}
                    disabled={pending || index === 0}
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← 앞으로
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(img.id, 'down')}
                    disabled={pending || index === images.length - 1}
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    뒤로 →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSetThumbnail(img.id)}
                  disabled={pending || img.is_thumbnail}
                  className="rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {img.is_thumbnail ? '현재 대표 이미지' : '대표 이미지로 지정'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={pending}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
