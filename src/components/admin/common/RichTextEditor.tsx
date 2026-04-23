"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  minHeight?: number;
};

export default function RichTextEditor({ name, defaultValue, placeholder, minHeight = 200 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!defaultValue);

  const syncHidden = useCallback(() => {
    if (!editorRef.current || !hiddenRef.current) return;
    const html = editorRef.current.innerHTML;
    hiddenRef.current.value = (html === "<br>" || html === "") ? "" : html;
    setIsEmpty(!editorRef.current.textContent?.trim());
  }, []);

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
      syncHidden();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand(cmd, false, value ?? undefined);
    syncHidden();
  }, [syncHidden]);

  const handleHeading = (level: 1 | 2 | 3) => {
    editorRef.current?.focus();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand("formatBlock", false, `h${level}`);
    syncHidden();
  };

  const handleLink = () => {
    const url = window.prompt("링크 URL을 입력하세요:", "https://");
    if (url) exec("createLink", url);
  };

  // 이미지 삽입 — 파일 선택 → base64 → <img> 삽입
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      editorRef.current?.focus();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).execCommand("insertImage", false, src);
      syncHidden();
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  // 유튜브 / 동영상 URL 삽입 → <iframe> embed
  const handleVideo = () => {
    const url = window.prompt("YouTube 또는 영상 URL을 입력하세요:");
    if (!url) return;

    let embedSrc = url;
    // youtube.com/watch?v=ID → embed/ID
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      embedSrc = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    const iframe = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:8px 0">` +
      `<iframe src="${embedSrc}" style="position:absolute;top:0;left:0;width:100%;height:100%;" ` +
      `frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;

    editorRef.current?.focus();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand("insertHTML", false, iframe);
    syncHidden();
  };

  type BtnDef =
    | { type: "cmd"; cmd: string; icon: string; title: string }
    | { type: "sep" }
    | { type: "fn"; fn: () => void; icon: string; title: string }
    | { type: "h"; level: 1 | 2 | 3; icon: string; title: string };

  const toolbar: BtnDef[] = [
    { type: "h", level: 1, icon: "H1", title: "제목 1" },
    { type: "h", level: 2, icon: "H2", title: "제목 2" },
    { type: "h", level: 3, icon: "H3", title: "제목 3" },
    { type: "sep" },
    { type: "cmd", cmd: "bold",          icon: "B",   title: "굵게" },
    { type: "cmd", cmd: "italic",        icon: "I",   title: "기울임" },
    { type: "cmd", cmd: "underline",     icon: "U_",  title: "밑줄" },
    { type: "cmd", cmd: "strikeThrough", icon: "S̶",   title: "취소선" },
    { type: "sep" },
    { type: "cmd", cmd: "insertUnorderedList", icon: "•≡", title: "글머리 기호" },
    { type: "cmd", cmd: "insertOrderedList",   icon: "1≡", title: "번호 목록" },
    { type: "sep" },
    { type: "fn", fn: handleLink,  icon: "🔗", title: "링크 삽입" },
    { type: "fn", fn: () => fileInputRef.current?.click(), icon: "🖼", title: "이미지 삽입" },
    { type: "fn", fn: handleVideo, icon: "▶", title: "동영상(YouTube) 삽입" },
    { type: "sep" },
    { type: "cmd", cmd: "removeFormat", icon: "✕", title: "서식 제거" },
  ];

  return (
    <div className="relative">
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue ?? ""} />
      {/* 숨겨진 파일 인풋 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />

      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-gray-300 bg-gray-50 px-2 py-1.5">
        {toolbar.map((item, idx) => {
          if (item.type === "sep") return <span key={idx} className="mx-1 h-4 w-px bg-gray-300" />;
          if (item.type === "h") {
            return (
              <button key={idx} type="button" title={item.title}
                onMouseDown={(e) => { e.preventDefault(); handleHeading(item.level); }}
                className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >{item.icon}</button>
            );
          }
          if (item.type === "fn") {
            return (
              <button key={idx} type="button" title={item.title}
                onMouseDown={(e) => { e.preventDefault(); item.fn(); }}
                className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >{item.icon}</button>
            );
          }
          // cmd
          return (
            <button key={idx} type="button" title={item.title}
              onMouseDown={(e) => { e.preventDefault(); exec(item.cmd); }}
              className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
            >{item.icon}</button>
          );
        })}
      </div>

      {/* 에디터 영역 */}
      <div className="relative">
        {isEmpty && !isFocused && (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-gray-400 select-none">
            {placeholder ?? "내용을 입력하세요..."}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncHidden}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); syncHidden(); }}
          style={{ minHeight }}
          className={`rich-editor w-full rounded-b-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black ${isFocused ? "border-black ring-1 ring-black" : ""}`}
        />
      </div>

      <style>{`
        .rich-editor { line-height: 1.75; }
        .rich-editor h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0 0.4rem; }
        .rich-editor h2 { font-size: 1.25rem; font-weight: 700; margin: 0.6rem 0 0.3rem; }
        .rich-editor h3 { font-size: 1.1rem;  font-weight: 600; margin: 0.5rem 0 0.25rem; }
        .rich-editor p  { margin: 0.25rem 0; }
        .rich-editor ul { list-style: disc;    padding-left: 1.4rem; margin: 0.3rem 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.4rem; margin: 0.3rem 0; }
        .rich-editor a  { color: #5332C9; text-decoration: underline; }
        .rich-editor b, .rich-editor strong { font-weight: 700; }
        .rich-editor i, .rich-editor em { font-style: italic; }
        .rich-editor u { text-decoration: underline; }
        .rich-editor s { text-decoration: line-through; }
        .rich-editor img { max-width: 100%; border-radius: 8px; margin: 4px 0; }
      `}</style>
    </div>
  );
}
