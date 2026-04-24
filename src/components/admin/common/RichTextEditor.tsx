"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EDITOR_FONTS } from "@/src/lib/editor-fonts";

type Props = {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
};

// 상세설명 이미지는 base64로 description에 직접 들어감 → 타겟 4MB (품질 우선)
const RTE_TARGET_BYTES = 4 * 1024 * 1024;
const RTE_HARD_MAX_BYTES = 10 * 1024 * 1024;
const RTE_MAX_DIM = 2400;

// 10MB 초과면 null 반환 (호출부에서 반려 처리)
async function compressRteImage(file: File): Promise<File | null> {
  if (file.size > RTE_HARD_MAX_BYTES) return null;
  if (file.size <= RTE_TARGET_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > RTE_MAX_DIM || height > RTE_MAX_DIM) {
      const scale = Math.min(RTE_MAX_DIM / width, RTE_MAX_DIM / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    let q = 0.9;
    let blob: Blob | null = null;
    for (let i = 0; i < 5; i++) {
      blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
      if (!blob) break;
      if (blob.size <= RTE_TARGET_BYTES) break;
      q -= 0.1;
      if (q < 0.5) break;
    }
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type SelectedMedia = {
  el: HTMLElement;
  kind: "image" | "video";
  topOffset: number;
  leftOffset: number;
} | null;

type VideoOverlay = {
  el: HTMLElement;
  bottom: number;
  left: number;
  width: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const execCmd = (cmd: string, val?: string) => (document as any).execCommand(cmd, false, val ?? undefined);

export default function RichTextEditor({ name, defaultValue, placeholder, minHeight = 200, maxHeight = 520 }: Props) {
  const editorRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const savedRange   = useRef<Range | null>(null);

  const [isFocused,      setIsFocused]      = useState(false);
  const [isEmpty,        setIsEmpty]        = useState(!defaultValue);
  const [htmlValue,      setHtmlValue]      = useState<string>(defaultValue ?? "");
  const [selectedMedia,  setSelectedMedia]  = useState<SelectedMedia>(null);
  const [mediaWidthVal,  setMediaWidthVal]  = useState("");
  const [customFont,     setCustomFont]     = useState("");
  const [showCustomFont, setShowCustomFont] = useState(false);
  const [videoOverlays,  setVideoOverlays]  = useState<VideoOverlay[]>([]);

  // ── 웹폰트 자동 로드 ──────────────────────────────────────────
  useEffect(() => {
    EDITOR_FONTS.forEach((font) => {
      if (!font.googleFontUrl) return;
      const id = `rte-font-${font.label.replace(/\s+/g, "-")}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id   = id;
      link.rel  = "stylesheet";
      link.href = font.googleFontUrl;
      document.head.appendChild(link);
    });
  }, []);

  // ── hidden input 동기화 (React state 기반 controlled input) ────
  const syncHidden = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const textEmpty = !editorRef.current.textContent?.trim();
    // 이미지/동영상이 있으면 텍스트가 없어도 콘텐츠 있음으로 간주
    const hasMedia = !!editorRef.current.querySelector("img, iframe, .rich-video-wrap");
    const reallyEmpty = textEmpty && !hasMedia;
    const clean = reallyEmpty ? "" : html;
    setHtmlValue(clean);
    setIsEmpty(reallyEmpty);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    } else {
      // 빈 에디터: 중앙정렬 래퍼를 먼저 넣어둠 → 사용자가 타이핑하면 바로 가운데 정렬로 시작
      editorRef.current.innerHTML = `<div style="text-align:center;"><br></div>`;
    }
    syncHidden();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 선택 영역 저장/복원 (폰트 드롭다운용) ─────────────────────
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }, []);

  // ── 동영상 위치 스캔 ─────────────────────────────────────────
  const scanVideos = useCallback(() => {
    const editor  = editorRef.current;
    const wrapper = wrapperRef.current;
    if (!editor || !wrapper) return;
    const videos = Array.from(editor.querySelectorAll<HTMLElement>(".rich-video-wrap"));
    if (videos.length === 0) { setVideoOverlays([]); return; }
    const wRect = wrapper.getBoundingClientRect();
    setVideoOverlays(
      videos.map((el) => {
        const eRect = el.getBoundingClientRect();
        return {
          el,
          bottom: eRect.bottom - wRect.top,
          left:   eRect.left   - wRect.left,
          width:  eRect.width,
        };
      }),
    );
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const obs = new MutationObserver(scanVideos);
    obs.observe(editor, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    scanVideos();
    window.addEventListener("scroll", scanVideos, true);
    window.addEventListener("resize", scanVideos);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", scanVideos, true);
      window.removeEventListener("resize", scanVideos);
    };
  }, [scanVideos]);

  // ── execCommand 래퍼 ─────────────────────────────────────────
  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    execCmd(cmd, value);
    syncHidden();
  }, [syncHidden]);

  const handleHeading = useCallback((level: 1 | 2 | 3) => {
    editorRef.current?.focus();
    execCmd("formatBlock", `h${level}`);
    syncHidden();
  }, [syncHidden]);

  const handleLink = useCallback(() => {
    const url = window.prompt("링크 URL을 입력하세요:", "https://");
    if (url) exec("createLink", url);
  }, [exec]);

  // 여러 이미지 한 번에 삽입 (순차 처리로 순서 보장 + 자동 압축)
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const insertOne = (file: File): Promise<void> =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          editorRef.current?.focus();
          // 기본값: 50% 너비 + 가운데 정렬
          const html =
            `<img src="${src}" style="width:50%;height:auto;display:block;margin:8px auto;" />`;
          execCmd("insertHTML", html);
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });

    (async () => {
      let rejected = 0;
      for (const raw of files) {
        const f = await compressRteImage(raw);
        if (!f) {
          rejected++;
          continue; // 10MB 초과는 건너뜀
        }
        await insertOne(f);
      }
      syncHidden();
      if (rejected > 0) {
        alert(
          `${rejected}개 파일은 10MB를 초과해 건너뛰었습니다.\n이미지를 먼저 줄여서 다시 시도해 주세요.`,
        );
      }
    })();

    e.target.value = ""; // reset so same files can be re-selected
  };

  const handleVideo = useCallback(() => {
    const url = window.prompt("YouTube 또는 영상 URL을 입력하세요:");
    if (!url) return;
    let embedSrc = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) embedSrc = `https://www.youtube.com/embed/${ytMatch[1]}`;
    // 기본값: 75% 너비 + 가운데 정렬 + 16:9 비율 (aspect-ratio 사용으로 width 변화와 무관하게 비율 유지)
    const iframe =
      `<div class="rich-video-wrap" style="width:75%;aspect-ratio:16/9;display:block;margin:8px auto;overflow:hidden;position:relative;">` +
      `<iframe src="${embedSrc}" style="width:100%;height:100%;border:0;display:block;" ` +
      `frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
    editorRef.current?.focus();
    execCmd("insertHTML", iframe);
    syncHidden();
    setTimeout(scanVideos, 150);
  }, [exec, syncHidden, scanVideos]);

  const triggerImageInput = useCallback(() => { fileInputRef.current?.click(); }, []);

  // ── 폰트 변경 ──────────────────────────────────────────────────
  const handleFontChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    restoreSelection();
    const font = e.target.value;
    editorRef.current?.focus();
    if (font) execCmd("fontName", font);
    syncHidden();
    e.target.value = "";
  }, [restoreSelection, syncHidden]);

  const applyCustomFont = useCallback(() => {
    const font = customFont.trim();
    if (!font) return;
    restoreSelection();
    editorRef.current?.focus();
    execCmd("fontName", font);
    syncHidden();
    setCustomFont("");
    setShowCustomFont(false);
  }, [customFont, restoreSelection, syncHidden]);

  // ── 미디어 클릭 → 편집 패널 열기 ─────────────────────────────
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target  = e.target as HTMLElement;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let mediaEl: HTMLElement | null = null;
    let kind: "image" | "video" = "image";

    if (target.tagName === "IMG") {
      mediaEl = target as HTMLElement;
      kind    = "image";
    } else {
      const vw = target.closest<HTMLElement>(".rich-video-wrap");
      if (vw) { mediaEl = vw; kind = "video"; }
    }

    if (mediaEl) {
      const wRect = wrapper.getBoundingClientRect();
      const eRect = mediaEl.getBoundingClientRect();
      setSelectedMedia({
        el: mediaEl, kind,
        topOffset:  eRect.top  - wRect.top,
        leftOffset: Math.max(0, eRect.left - wRect.left),
      });
      setMediaWidthVal(mediaEl.style.width || "100%");
      e.preventDefault();
    } else {
      setSelectedMedia(null);
    }
  }, []);

  // ── 미디어 크기 (동영상은 aspect-ratio로 16:9 비율 유지) ───────
  const applyMediaWidth = useCallback((w: string) => {
    if (!selectedMedia) return;
    const el = selectedMedia.el;
    el.style.width = w;

    if (selectedMedia.kind === "image") {
      el.style.height = "auto";
    } else {
      // 동영상: aspect-ratio로 16:9 고정 → 어떤 너비든 정확한 비율 유지
      // 이전 버전의 padding-bottom/height 트릭이 남아 있으면 비워서 충돌 방지
      el.style.aspectRatio   = "16 / 9";
      el.style.height        = "";
      el.style.paddingBottom = "";
      el.style.position      = "relative";
      el.style.overflow      = "hidden";
      el.style.display       = "block";
      const iframe = el.querySelector<HTMLIFrameElement>("iframe");
      if (iframe) {
        iframe.style.position = "";
        iframe.style.top      = "";
        iframe.style.left     = "";
        iframe.style.width    = "100%";
        iframe.style.height   = "100%";
        iframe.style.border   = "0";
        iframe.style.display  = "block";
      }
    }
    setMediaWidthVal(w);
    syncHidden();
    setTimeout(scanVideos, 50);
  }, [selectedMedia, syncHidden, scanVideos]);

  // ── 미디어 정렬 ───────────────────────────────────────────────
  const applyMediaAlignment = useCallback((align: "left" | "center" | "right") => {
    if (!selectedMedia) return;
    const el   = selectedMedia.el;
    const isVid = selectedMedia.kind === "video";

    // 초기화
    el.style.float   = "none";
    el.style.display = "block";
    el.style.margin  = "8px 0";

    if (align === "left") {
      el.style.float  = "left";
      el.style.margin = "0 12px 8px 0";
      if (isVid && (!el.style.width || el.style.width === "100%")) {
        el.style.width = "60%"; setMediaWidthVal("60%");
      }
    } else if (align === "center") {
      el.style.margin = "8px auto";
      if (isVid && (!el.style.width || el.style.width === "100%")) {
        el.style.width = "80%"; setMediaWidthVal("80%");
      }
    } else {
      el.style.float  = "right";
      el.style.margin = "0 0 8px 12px";
      if (isVid && (!el.style.width || el.style.width === "100%")) {
        el.style.width = "60%"; setMediaWidthVal("60%");
      }
    }
    syncHidden();
    setTimeout(scanVideos, 50);
  }, [selectedMedia, syncHidden, scanVideos]);

  // ── 툴바 정의 ─────────────────────────────────────────────────
  type BtnDef =
    | { type: "cmd"; cmd: string; icon: string; title: string }
    | { type: "sep" }
    | { type: "fn"; fn: () => void; icon: string; title: string }
    | { type: "h"; level: 1 | 2 | 3; icon: string; title: string };

  const toolbar = useMemo<BtnDef[]>(() => [
    { type: "h",   level: 1, icon: "H1",  title: "제목 1" },
    { type: "h",   level: 2, icon: "H2",  title: "제목 2" },
    { type: "h",   level: 3, icon: "H3",  title: "제목 3" },
    { type: "sep" },
    { type: "cmd", cmd: "bold",                icon: "B",    title: "굵게" },
    { type: "cmd", cmd: "italic",              icon: "I",    title: "기울임" },
    { type: "cmd", cmd: "underline",           icon: "U_",   title: "밑줄" },
    { type: "cmd", cmd: "strikeThrough",       icon: "S̶",    title: "취소선" },
    { type: "sep" },
    { type: "cmd", cmd: "justifyLeft",         icon: "◀≡",   title: "왼쪽 정렬" },
    { type: "cmd", cmd: "justifyCenter",       icon: "≡◎≡",  title: "가운데 정렬" },
    { type: "cmd", cmd: "justifyRight",        icon: "≡▶",   title: "오른쪽 정렬" },
    { type: "sep" },
    { type: "cmd", cmd: "insertUnorderedList", icon: "•≡",   title: "글머리 기호" },
    { type: "cmd", cmd: "insertOrderedList",   icon: "1≡",   title: "번호 목록" },
    { type: "sep" },
    { type: "fn",  fn: handleLink,             icon: "🔗",   title: "링크 삽입" },
    { type: "fn",  fn: triggerImageInput,      icon: "🖼",   title: "이미지 삽입" },
    { type: "fn",  fn: handleVideo,            icon: "▶",    title: "동영상(YouTube) 삽입" },
    { type: "sep" },
    { type: "cmd", cmd: "removeFormat",        icon: "✕",    title: "서식 제거" },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [exec, handleHeading, handleLink, handleVideo, triggerImageInput]);

  // ── 정렬 버튼 렌더 헬퍼 ──────────────────────────────────────
  const alignBtns = (["left", "center", "right"] as const).map((a) => (
    <button
      key={a}
      type="button"
      onClick={() => applyMediaAlignment(a)}
      className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      title={a === "left" ? "왼쪽 정렬" : a === "center" ? "가운데 정렬" : "오른쪽 정렬"}
    >
      {a === "left" ? "좌" : a === "center" ? "중" : "우"}
    </button>
  ));

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name={name} value={htmlValue} readOnly />
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageFile} />

      {/* ── 툴바 (sticky로 상단 고정 → 스크롤해도 항상 보임) ── */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-gray-300 bg-gray-50 px-2 py-1.5 shadow-sm">

        {/* 폰트 드롭다운 */}
        <select
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={handleFontChange}
          className="mr-0.5 h-6 rounded border border-gray-300 bg-white px-1 text-xs text-gray-700 hover:border-gray-400 focus:outline-none"
          title="폰트 선택"
        >
          <option value="" disabled>폰트</option>
          {EDITOR_FONTS.filter((f) => f.value).map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* 폰트 직접 입력 */}
        {showCustomFont ? (
          <div className="flex items-center gap-0.5">
            <input
              type="text" value={customFont} autoFocus
              onChange={(e) => setCustomFont(e.target.value)}
              onMouseDown={saveSelection}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); applyCustomFont(); }
                if (e.key === "Escape") { setShowCustomFont(false); setCustomFont(""); }
              }}
              placeholder="예: Pretendard"
              className="h-6 w-28 rounded border border-blue-400 px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyCustomFont}
              className="h-6 rounded bg-black px-1.5 text-xs font-medium text-white hover:bg-gray-800">적용</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowCustomFont(false); setCustomFont(""); }}
              className="h-6 rounded border border-gray-300 px-1.5 text-xs text-gray-500 hover:bg-gray-100">✕</button>
          </div>
        ) : (
          <button type="button" onMouseDown={saveSelection} onClick={() => setShowCustomFont(true)}
            className="h-6 rounded border border-gray-300 px-1.5 text-xs text-gray-600 hover:bg-gray-100"
            title="폰트 직접 입력">Aa+</button>
        )}

        <span className="mx-1 h-4 w-px bg-gray-300" />

        {toolbar.map((item, idx) => {
          if (item.type === "sep") return <span key={idx} className="mx-1 h-4 w-px bg-gray-300" />;
          if (item.type === "h") return (
            <button key={idx} type="button" title={item.title}
              onMouseDown={(e) => { e.preventDefault(); handleHeading(item.level); }}
              className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
            >{item.icon}</button>
          );
          if (item.type === "fn") return (
            <button key={idx} type="button" title={item.title}
              onMouseDown={(e) => { e.preventDefault(); item.fn(); }}
              className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
            >{item.icon}</button>
          );
          return (
            <button key={idx} type="button" title={item.title}
              onMouseDown={(e) => { e.preventDefault(); exec(item.cmd); }}
              className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
            >{item.icon}</button>
          );
        })}
      </div>

      {/* ── 에디터 본문 ── */}
      <div className="relative">
        {isEmpty && !isFocused && (
          <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 select-none text-sm text-gray-400">
            {placeholder ?? "내용을 입력하세요..."}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onClick={handleEditorClick}
          onInput={syncHidden}
          onScroll={scanVideos}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); syncHidden(); }}
          style={{ minHeight, maxHeight, overflowY: "auto", textAlign: "center" }}
          className={`rich-editor w-full rounded-b-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black ${isFocused ? "border-black ring-1 ring-black" : ""}`}
        />
      </div>

      {/* ── 미디어 편집 패널 (이미지 클릭 / 동영상 '수정' 클릭 시) ── */}
      {selectedMedia && (
        <div
          style={{ position: "absolute", top: Math.max(4, selectedMedia.topOffset - 52), left: selectedMedia.leftOffset, zIndex: 20 }}
          className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-300 bg-white px-2.5 py-2 shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="text-[10px] font-bold text-gray-500 mr-0.5">
            {selectedMedia.kind === "image" ? "🖼 이미지" : "▶ 동영상"}
          </span>

          {/* 크기 */}
          <span className="h-4 w-px bg-gray-200" />
          <span className="text-[10px] text-gray-400">크기</span>
          {["25%", "50%", "75%", "100%"].map((w) => (
            <button key={w} type="button" onClick={() => applyMediaWidth(w)}
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                mediaWidthVal === w ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}>{w}</button>
          ))}
          <input
            type="text" value={mediaWidthVal} placeholder="300px"
            onChange={(e) => setMediaWidthVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyMediaWidth(mediaWidthVal); }}
            className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
          />
          <button type="button" onClick={() => applyMediaWidth(mediaWidthVal)}
            className="rounded bg-black px-1.5 py-0.5 text-xs font-medium text-white hover:bg-gray-800">적용</button>

          {/* 정렬 */}
          <span className="h-4 w-px bg-gray-200" />
          <span className="text-[10px] text-gray-400">정렬</span>
          {alignBtns}

          <button type="button" onClick={() => setSelectedMedia(null)}
            className="ml-1 text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* ── 동영상별 '수정' 버튼 (항상 표시) ── */}
      {videoOverlays.map((ov, i) => (
        <button
          key={i}
          type="button"
          style={{
            position: "absolute",
            top: ov.bottom + 4,
            left: ov.left + ov.width / 2,
            transform: "translateX(-50%)",
            zIndex: 15,
          }}
          className="rounded-full border border-gray-300 bg-white/95 px-3 py-0.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm hover:border-gray-400 hover:bg-white hover:shadow"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const wrapper = wrapperRef.current;
            if (!wrapper) return;
            const wRect = wrapper.getBoundingClientRect();
            const eRect = ov.el.getBoundingClientRect();
            setSelectedMedia({
              el: ov.el, kind: "video",
              topOffset:  eRect.top  - wRect.top,
              leftOffset: Math.max(0, eRect.left - wRect.left),
            });
            setMediaWidthVal(ov.el.style.width || "100%");
          }}
        >✏ 수정</button>
      ))}

      <style>{`
        .rich-editor { line-height: 1.75; }
        .rich-editor h1 { font-size: 1.5rem; font-weight: 700; margin: .75rem 0 .4rem; }
        .rich-editor h2 { font-size: 1.25rem; font-weight: 700; margin: .6rem 0 .3rem; }
        .rich-editor h3 { font-size: 1.1rem;  font-weight: 600; margin: .5rem 0 .25rem; }
        .rich-editor p  { margin: .25rem 0; }
        .rich-editor ul { list-style: disc;    padding-left: 1.4rem; margin: .3rem 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.4rem; margin: .3rem 0; }
        .rich-editor a  { color: #5332C9; text-decoration: underline; }
        .rich-editor b, .rich-editor strong { font-weight: 700; }
        .rich-editor i, .rich-editor em     { font-style: italic; }
        .rich-editor u  { text-decoration: underline; }
        .rich-editor s  { text-decoration: line-through; }
        .rich-editor img { max-width: 100%; border-radius: 8px; margin: 4px 0; cursor: pointer; }
        .rich-editor img:hover         { outline: 2px solid #5332C9; border-radius: 8px; }
        .rich-editor .rich-video-wrap  { cursor: pointer; }
        .rich-editor .rich-video-wrap:hover { outline: 2px solid #5332C9; border-radius: 4px; }
      `}</style>
    </div>
  );
}
