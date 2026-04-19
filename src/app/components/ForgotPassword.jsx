import { useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { KeyRound, ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      if (res.reset_link) {
        setResetLink(res.reset_link);
        toast.success("Reset link generated!");
      } else {
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-700 shadow-2xl bg-gray-900 text-white">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-white/10">
                <KeyRound className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-white">Forgot Password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your email to get a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!resetLink ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@gbu.ac.in"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" size="lg" disabled={loading}>
                  {loading ? "Generating link..." : "Get Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-sm text-green-300">Reset link generated successfully</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-xs">Reset Link (share with user or open directly)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={resetLink}
                      readOnly
                      className="bg-gray-800 border-gray-700 text-gray-300 text-xs"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={copyLink}
                      className="shrink-0 border-gray-700 text-gray-300 hover:text-white">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full bg-white text-black hover:bg-gray-200" onClick={() => window.open(resetLink, '_blank')}>
                  Open Reset Page
                </Button>
                <p className="text-xs text-gray-500 text-center">This link expires in 1 hour</p>
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <Link to="/login/admin" className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
