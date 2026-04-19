import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { useStore } from "../lib/store";

export function SignupAdmin() {
  const navigate = useNavigate();
  const { signUpWithCredentials } = useAuth();
  const { setCurrentRole, refreshAll } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("All fields are required"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await signUpWithCredentials(form.name, form.email, form.password, "admin");
      setCurrentRole("admin");
      await refreshAll();
      toast.success("Admin account created!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Signup failed");
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
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-white">Admin Sign Up</CardTitle>
            <CardDescription className="text-center text-gray-400">Create an administrator account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Full Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name" required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Email Address</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@gbu.ac.in" required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters" required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Confirm Password</Label>
                <Input type="password" value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repeat password" required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              </div>
              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" size="lg" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? "Creating account..." : "Create Admin Account"}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link to="/login/admin" className="text-gray-300 hover:text-white hover:underline">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
