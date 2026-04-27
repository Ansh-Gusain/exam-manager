import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth-context";
function LoginAdmin() {
  const navigate = useNavigate();
  const { setCurrentRole, refreshAll } = useStore();
  const { signInWithCredentials, signOut } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter valid credentials");
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithCredentials(formData.email, formData.password);
      if (user.role !== "admin") {
        toast.error("Access denied. Admin credentials required.");
        await signOut();
        return;
      }
      setCurrentRole("admin");
      await refreshAll();
      toast.success("Login successful!");
      navigate("/admin");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxs(Card, { className: "border border-gray-700 shadow-2xl bg-gray-900 text-white", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "space-y-3 pb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "p-4 rounded-full bg-white/10", children: /* @__PURE__ */ jsx(Shield, { className: "w-10 h-10 text-white" }) }) }),
        /* @__PURE__ */ jsx(CardTitle, { className: "text-center text-2xl text-white", children: "Admin Login" }),
        /* @__PURE__ */ jsx(CardDescription, { className: "text-center text-gray-400", children: "Manage exams, seating, invigilation & attendance" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx(GoogleSignInButton, {}) }),
        /* @__PURE__ */ jsxs("div", { className: "relative mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t border-gray-700" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-xs uppercase", children: /* @__PURE__ */ jsx("span", { className: "bg-gray-900 px-2 text-gray-500", children: "OR" }) })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", className: "text-gray-300", children: "Email Address" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                type: "email",
                placeholder: "Enter your email",
                value: formData.email,
                onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                required: true,
                className: "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white focus:ring-white/20"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", className: "text-gray-300", children: "Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "password",
                  type: showPassword ? "text" : "password",
                  placeholder: "Enter your password",
                  value: formData.password,
                  onChange: (e) => setFormData({ ...formData, password: e.target.value }),
                  required: true,
                  className: "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-white focus:ring-white/20"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white",
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center text-sm", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", className: "rounded bg-gray-800 border-gray-600" }),
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Remember me" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full bg-white text-black hover:bg-gray-200", size: "lg", disabled: loading, children: loading ? "Logging in..." : "Login to Dashboard" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 pt-6 border-t border-gray-700 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
          "Don't have an account?",
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/signup/admin", className: "text-gray-300 hover:text-white hover:underline", children: "Create one" }),
          " · ",
          /* @__PURE__ */ jsx("a", { href: "#", className: "text-gray-400 hover:text-white hover:underline", children: "Contact IT Support" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-gray-600 mt-6", children: "By logging in, you agree to our Terms of Service and Privacy Policy" })
  ] }) });
}
export {
  LoginAdmin
};
