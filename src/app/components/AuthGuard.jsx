import { jsx, jsxs } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../lib/auth-context";
import { Loader2 } from "lucide-react";
function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading..." })
    ] }) });
  }
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsx(Navigate, { to: "/login/admin", replace: true });
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
export {
  AuthGuard
};
