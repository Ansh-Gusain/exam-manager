import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState("verifying"); // verifying | valid | invalid | success
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    api.auth.verifyResetToken(token)
      .then(res => { setEmail(res.email); setStatus("valid"); })
      .catch(() => setStatus("invalid"));
  }, [token]);

  // Bug 1: backend returns reset_link (snake_case) but toCamel() converts it to resetLink
  // ForgotPasswordAdmin/Faculty/Student all check res.resetLink — this is correct after toCamel
  // But the backend key is reset_link which toCamel converts to resetLink ✓

  // Bug 2: ResetPassword validates min 6 chars but backend requires min 8
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.auth.resetPassword(token, form.password);
      setStatus("success");
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login/admin"), 2000);
    } catch (err) {
      toast.error(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-700 shadow-2xl bg-gray-900 text-white">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-white/10">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-white">Reset Password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              {status === "valid" ? `Setting new password for ${email}` : "Verifying your reset link..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "verifying" && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}

            {status === "invalid" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">This reset link is invalid or has expired.</p>
                </div>
                <Link to="/forgot-password/admin">
                  <Button className="w-full bg-white text-black hover:bg-gray-200">Request a new link</Button>
                </Link>
              </div>
            )}

            {status === "valid" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 8 characters"
                      required
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" size="lg" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-sm text-green-300">Password reset! Redirecting to login...</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <Link to="/login/admin" className="text-sm text-gray-400 hover:text-white">Back to Login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
