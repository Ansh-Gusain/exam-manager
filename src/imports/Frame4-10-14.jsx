import { jsx, jsxs } from "react/jsx-runtime";
function Frame3() {
  return /* @__PURE__ */ jsx("div", { className: "content-stretch flex items-center justify-center relative shrink-0", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col font-['Roboto:Regular','Noto_Sans_Devanagari:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[20px] text-black whitespace-nowrap", style: { fontVariationSettings: "'wdth' 100" }, children: /* @__PURE__ */ jsx("p", { className: "leading-[normal]", children: "\u0917\u094C\u0924\u092E \u092C\u0941\u0926\u094D\u0927 \u0935\u093F\u0936\u094D\u0935\u0935\u093F\u0926\u094D\u092F\u093E\u0932\u092F" }) }) });
}
function Frame1() {
  return /* @__PURE__ */ jsx("div", { className: "content-stretch flex items-center justify-center relative shrink-0", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[18px] text-black whitespace-nowrap", style: { fontVariationSettings: "'wdth' 100" }, children: /* @__PURE__ */ jsx("p", { className: "leading-[normal]", children: "GAUTAM BUDDHA UNIVERSITY" }) }) });
}
function Frame4() {
  return /* @__PURE__ */ jsxs("div", { className: "content-stretch flex flex-col gap-[2px] items-start relative shrink-0", children: [
    /* @__PURE__ */ jsx(Frame3, {}),
    /* @__PURE__ */ jsx(Frame1, {})
  ] });
}
function Frame2() {
  return /* @__PURE__ */ jsx("div", { className: "content-stretch flex items-center justify-center relative shrink-0", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col font-['Roboto:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#949393] text-[12px] whitespace-nowrap", style: { fontVariationSettings: "'wdth' 100" }, children: /* @__PURE__ */ jsx("p", { className: "leading-[normal]", children: "An Ultimate Destination for Higher Learning" }) }) });
}
function Frame() {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white content-stretch flex flex-col gap-[7px] items-start justify-center px-[15px] relative size-full", children: [
    /* @__PURE__ */ jsx(Frame4, {}),
    /* @__PURE__ */ jsx(Frame2, {})
  ] });
}
export {
  Frame as default
};
