import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";
function NotFound() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[60vh] text-center", children: [
    /* @__PURE__ */ jsx(AlertCircle, { className: "w-16 h-16 text-muted-foreground mb-4" }),
    /* @__PURE__ */ jsx("h1", { className: "mb-2", children: "Page Not Found" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-[0.9rem] mb-6", children: "The page you're looking for doesn't exist." }),
    /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(Button, { children: "Back to Dashboard" }) })
  ] });
}
export {
  NotFound
};
