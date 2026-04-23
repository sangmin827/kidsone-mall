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

// ── 공용 업로드 영역 컴포넌트 ─────────────────────────────────────────────
function UploadZone({
  onFiles,
  pending,
  label,
}: {
  onFiles: (files: FileList | null) => void;
  pending: boolean;
  label: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
        dragOver ? 'border-[#5332C9] bg-[#ede9fb]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <p className="text-xs text-gray-500">JPEG / PNG / WebP · 최대 5MB · 여러 장 동시 업로드</p>
      {pending && <p className="text-xs text-blue-600">처리 중...</p>}
      <input
        ref={ref}
        type="file"
        accept={ACCEPTED_MIME.join(',')}
        multiple
        className="hidden"
        onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

// ── 이미지 그리드 컴포넌트 ────────────────────────────────────────────────
function ImageGrid({
  images,
  imageType,
  pending,
  onMove,
  onSetThumbnail,
  onDelete,
}: {
  images: AdminProductImage[];
  imageType: 'gallery' | 'detail';
  pending: boolean;
  onMove: (id: number, dir: 'up' | 'down') => void;
  onSetThumbnail?: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (images.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
        {imageType === 'gallery' ? '아직 갤러리 이미지가 없습니다.' : '아직 상세 이미지가 없습니다.'}
      </p>
    );
  }

  return (
    <ul className={`grid gap-4 ${imageType === 'detail' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}`}>
      {images.map((img, index) => (
        <li
          key={img.id}
          className={`relative overflow-hidden rounded-xl border bg-white ${
            img.is_thumbnail && imageType === 'gallery'
              ? 'border-black ring-2 ring-black'
              : 'border-gray-200'
          }`}
        >
          <div className={`relative w-full bg-gray-100 ${imageType === 'detail' ? 'aspect-[4/3]' : 'aspect-square'}`}>
            <Image
              src={img.image_url}
              alt={`이미지 ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 200px"
              className="object-cover"
              unoptimized
            />
            {img.is_thumbnail && imageType === 'gallery' && (
              <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-0.5 text-[11px] font-medium text-white">
                대표
              </span>
            )}
            {imageType === 'detail' && (
              <span className="absolute left-2 top-2 rounded-full bg-[#5332C9] px-2 py-0.5 text-[11px] font-medium text-white">
                상세 {index + 1}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t border-gray-100 p-2 text-[11px]">
            <div className="flex justify-between gap-1">
              <button
                type="button"
                onClick={() => onMove(img.id, 'up')}
                disabled={pending || index === 0}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← 앞으로
              </button>
              <button
                type="button"
                onClick={() => onMove(img.id, 'down')}
                disabled={pending || index === images.length - 1}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                뒤로 →
              </button>
            </div>

            {onSetThumbnail && imageType === 'gallery' && (
              <button
                type="button"
                onClick={() => onSetThumbnail(img.id)}
                disabled={pending || img.is_thumbnail}
                className="rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {img.is_thumbnail ? '현재 대표 이미지' : '대표 이미지로 지정'}
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(img.id)}
              disabled={pending}
              className="rounded-lg border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              삭제
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────
export default function ProductImageManager({ productId, images }: Props) {
  const [pending, startTransition] = useTransition();

  const galleryImages = images.filter((img) => (img as AdminProductImage & { image_type?: string }).image_type !== 'detail');
  const detailImages  = images.filter((img) => (img as AdminProductImage & { image_type?: string }).image_type === 'detail');

  // ── 업로드 ────────────────────────────────────────────────────────────
  function handleUpload(files: FileList | null, imageType: 'gallery' | 'detail') {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
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
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set('productId', String(productId));
        fd.set('file', file);
        fd.set('imageType', imageType);
        try {
          await uploadProductImage(fd);
          toast.success(`${file.name} 업로드 완료`);
        } catch (error) {
          toast.error(`${file.name}: ${error instanceof Error ? error.message : '업로드 실패'}`);
        }
      }
    });
  }

  // ── 삭제 ──────────────────────────────────────────────────────────────
  function handleDelete(imageId: number) {
    if (!confirm('정말 이 이미지를 삭제할까요?')) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('imageId', String(imageId));
      try {
        await deleteProductImage(fd);
        toast.success('이미지가 삭제되었습니다.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '삭제 실패');
      }
    });
  }

  // ── 대표 이미지 지정 ─────────────────────────────────────────────────
  function handleSetThumbnail(imageId: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('imageId', String(imageId));
      fd.set('productId', String(productId));
      try {
        await setThumbnailImage(fd);
        toast.success('대표 이미지가 변경되었습니다.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '변경 실패');
      }
    });
  }

  // ── 순서 변경 ────────────────────────────────────────────────────────
  function handleMove(imageId: number, direction: 'up' | 'down', imageType: 'gallery' | 'detail') {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('imageId', String(imageId));
      fd.set('productId', String(productId));
      fd.set('direction', direction);
      fd.set('imageType', imageType);
      try {
        await moveProductImage(fd);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '순서 변경 실패');
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* ── 갤러리 이미지 (상단 슬라이더) ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[#222222]">갤러리 이미지</h3>
          <p className="text-xs text-[#9ca3af]">상품 상단에 표시되는 메인 이미지입니다. 첫 번째 이미지가 대표(썸네일)가 됩니다.</p>
        </div>
        <UploadZone
          onFiles={(f) => handleUpload(f, 'gallery')}
          pending={pending}
          label="갤러리 이미지 드래그 또는 클릭 업로드"
        />
        <ImageGrid
          images={galleryImages}
          imageType="gallery"
          pending={pending}
          onMove={(id, dir) => handleMove(id, dir, 'gallery')}
          onSetThumbnail={handleSetThumbnail}
          onDelete={handleDelete}
        />
      </section>

      <div className="border-t border-[#E8E6E1]" />

      {/* ── 상세 이미지 (스마트스토어 스타일 하단 상세) ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-[#222222]">상세 이미지</h3>
          <p className="text-xs text-[#9ca3af]">상품 설명 아래 세로로 나열되는 상세 이미지입니다. 스마트스토어처럼 상품 특징·사이즈 안내 이미지를 올려주세요.</p>
        </div>
        <UploadZone
          onFiles={(f) => handleUpload(f, 'detail')}
          pending={pending}
          label="상세 이미지 드래그 또는 클릭 업로드"
        />
        <ImageGrid
          images={detailImages}
          imageType="detail"
          pending={pending}
          onMove={(id, dir) => handleMove(id, dir, 'detail')}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
