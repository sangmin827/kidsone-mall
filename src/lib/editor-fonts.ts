/**
 * RichTextEditor 폰트 설정 파일
 *
 * ─ 폰트 추가 방법 ─────────────────────────────────────────────────
 * 아래 EDITOR_FONTS 배열에 항목을 추가하면 에디터 드롭다운에 자동으로 표시됩니다.
 *
 * googleFontUrl 을 넣으면 에디터가 마운트될 때 해당 CSS를 자동으로 <head> 에 삽입합니다.
 * Google Fonts URL 찾는 방법:
 *   1. https://fonts.google.com 접속
 *   2. 원하는 폰트 선택 → "Get embed code" 클릭
 *   3. @import 뒤의 URL 복사 (예: https://fonts.googleapis.com/css2?family=...)
 *
 * 예시) 새 폰트 추가:
 *   {
 *     label: "Noto Sans KR",
 *     value: "'Noto Sans KR', sans-serif",
 *     googleFontUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap",
 *   },
 * ──────────────────────────────────────────────────────────────────
 */

export type EditorFont = {
  label: string; // 드롭다운에 표시될 이름
  value: string; // CSS font-family 값
  googleFontUrl?: string; // 웹폰트 로드 URL (Google Fonts, CDN 등)
};

export const EDITOR_FONTS: EditorFont[] = [
  // ── 기본 (웹폰트 로드 없이 바로 사용) ──
  { label: "기본체", value: "" },
  {
    label: "맑은고딕",
    value: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  },
  { label: "굴림", value: "Gulim, sans-serif" },
  { label: "돋움", value: "Dotum, sans-serif" },
  { label: "바탕", value: "Batang, serif" },
  { label: "궁서", value: "Gungsuh, serif" },

  // ── 한국어 웹폰트 (Google Fonts 자동 로드) ──
  {
    label: "고라운드200",
    value: "'Chiron GoRound TC', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@200&display=swap",
  },
  {
    label: "고라운드500",
    value: "'Chiron GoRound TC', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@500&display=swap",
  },
  {
    label: "고라운드800",
    value: "'Chiron GoRound TC', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@800&display=swap",
  },
  {
    label: "배민 주아",
    value: '"Jua", sans-serif',
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Jua&display=swap",
  },
  {
    label: "배민 도현",
    value: "'Do Hyeon', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap",
  },
  {
    label: "감자꽃",
    value: '"Gamja Flower", sans-serif',
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap",
  },
  {
    label: "가속원",
    value: '"Gasoek One", sans-serif',
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Gasoek+One&display=swap",
  },
  {
    label: "블랙 한샌",
    value: "'Black Han Sans', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap",
  },
  {
    label: "나눔브러쉬",
    value: "'Nanum Brush Script', cursive",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&display=swap",
  },
  {
    label: "나눔고딕",
    value: "'Nanum Gothic', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap",
  },
  {
    label: "나눔명조",
    value: "'Nanum Myeongjo', serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap",
  },

  // ── 영문 / 기타 웹폰트 ──
  {
    label: "Roboto",
    value: "'Roboto', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
  },
];
