"use client";

import { useState } from "react";

type Props = {
  description: string | null;
};

const tabs = [
  { key: "info", label: "상품 정보" },
  { key: "shipping", label: "배송 · 반품 안내" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

/** HTML 여부 판단 — 태그가 하나라도 있으면 HTML로 취급 */
function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(text);
}

/** plain text → 단락 HTML 변환 (줄바꿈을 <p>로) */
function plainToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export default function ProductDetailTabs({ description }: Props) {
  const [active, setActive] = useState<TabKey>("info");

  // HTML이든 plain text든 항상 dangerouslySetInnerHTML로 렌더링
  const descriptionHtml = description
    ? looksLikeHtml(description)
      ? description
      : plainToHtml(description)
    : null;

  return (
    <div className="mt-10 overflow-hidden rounded-3xl border border-[#E8E6E1] bg-white">
      {/* 탭 헤더 */}
      <div className="flex border-b border-[#E8E6E1]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              active === tab.key
                ? "border-b-2 border-[#5332C9] text-[#5332C9]"
                : "text-[#6b7280] hover:text-[#222222]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 상품 정보 탭 */}
      {active === "info" && (
        <div>
          {/* 텍스트·에디터 설명 */}
          {descriptionHtml && (
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <div
                className="text-center text-sm leading-7 text-[#444] [&_a]:text-[#5332C9] [&_a]:underline [&_b]:font-bold [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[#222] [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#222] [&_h3]:mb-1 [&_h3]:mt-2.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#222] [&_iframe]:my-3 [&_iframe]:w-full [&_iframe]:rounded-xl [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          )}

          {/* 내용 없을 때 */}
          {!descriptionHtml && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-3xl">📋</span>
              <p className="text-sm text-[#9ca3af]">
                등록된 상품 정보가 없습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 배송 · 반품 안내 탭 */}
      {active === "shipping" && (
        <div className="px-6 py-8 sm:px-8 space-y-6">
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#222222]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fb] text-xs">
                🚚
              </span>
              배송 안내
            </h3>
            <div className="rounded-2xl bg-[#FAF9F6] p-4 text-xs leading-6 text-[#6b7280] space-y-1.5">
              <p>
                • 배송 기간: 주문 확인 후{" "}
                <strong className="text-[#222222]">1~2주</strong> 이내 발송
              </p>
              <p>
                • 제주 및 도서·산간 지역은 추가 배송비가 발생할 수 있습니다.
              </p>
              <p>
                • 주문량이 많거나 재고 상황에 따라 출고가 지연될 수 있습니다.
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#222222]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fb] text-xs">
                💳
              </span>
              결제 안내
            </h3>
            <div className="rounded-2xl bg-[#FAF9F6] p-4 text-xs leading-6 text-[#6b7280] space-y-1.5">
              <p>
                • 결제 방식을{" "}
                <strong className="text-[#222222]">무통장입금</strong>으로
                진행시 꼭 입금자명에 맞게 입금 부탁 드립니다.
              </p>
              <p>
                • 주문 후 <strong className="text-[#222222]">3일 이내</strong>{" "}
                미입금 시 주문이 자동 취소됩니다.
              </p>
              <p>• 입금 확인 후 상품 준비가 시작됩니다.</p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#222222]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fb] text-xs">
                🔄
              </span>
              교환 · 반품 안내
            </h3>
            <div className="rounded-2xl bg-[#FAF9F6] p-4 text-xs leading-6 text-[#6b7280] space-y-1.5">
              <p>
                • 상품 수령 후{" "}
                <strong className="text-[#222222]">7일 이내</strong> 교환·반품
                신청 가능합니다.
              </p>
              <p>• 단순 변심 반품 시 왕복 배송비는 고객 부담입니다.</p>
              <p>• 상품 불량·오배송의 경우 고객센터로 연락 부탁드립니다.</p>
              <p>
                • 반품 신청은 마이페이지 &gt; 주문내역에서 접수할 수 있습니다.
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#222222]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-xs">
                ⚠️
              </span>
              교환·반품 불가 사유
            </h3>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs leading-6 text-[#6b7280] space-y-1.5">
              <p>• 사용·개봉 후 상품 가치가 현저히 감소한 경우</p>
              <p>• 포장이 훼손되어 재판매가 불가능한 경우</p>
              <p>• 고객의 귀책사유로 상품이 파손·오염된 경우</p>
              <p>• 주문 제작 상품 또는 맞춤 제작 상품</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
