import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { useStore } from "../lib/store";

export function GoogleSignInButton({ role = "admin" }) {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const { setCurrentRole, refreshAll } = useStore();

  const handleSuccess = async (credentialResponse) => {
    try {
      const user = await signInWithGoogle(credentialResponse.credential);
      setCurrentRole(user.role ?? role);
      await refreshAll();
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === "faculty") navigate("/faculty");
      else if (user.role === "student") navigate("/student");
      else navigate("/");
    } catch (err) {
      toast.error(err.message || "Google sign-in failed");
    }
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error("Google sign-in failed")}
        width="368"
        theme="filled_black"
        shape="rectangular"
        text="signin_with"
      />
    </div>
  );
}
