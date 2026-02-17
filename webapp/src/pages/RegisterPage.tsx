import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bike, Mail, Lock, User, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";

export default function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message ?? "Registratie mislukt. Probeer het opnieuw.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Registratie mislukt. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Bike className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-slate-100 font-bold text-2xl">BikeShop</h1>
          <p className="text-slate-500 text-xs">Inventory Manager</p>
        </div>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-slate-100 text-xl font-bold text-center mb-6">Registreren</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error ? (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : null}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">
              Naam
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Je volledige naam"
                className="pl-10 bg-slate-900 border-slate-700 text-slate-100"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className="pl-10 bg-slate-900 border-slate-700 text-slate-100"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              Wachtwoord
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kies een wachtwoord"
                className="pl-10 bg-slate-900 border-slate-700 text-slate-100"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200">
              Wachtwoord bevestigen
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Herhaal je wachtwoord"
                className="pl-10 bg-slate-900 border-slate-700 text-slate-100"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-5 text-base font-bold"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            {isLoading ? "Account aanmaken..." : "Account aanmaken"}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-slate-400 text-sm text-center mt-4">
          Al een account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Inloggen
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="text-slate-600 text-xs mt-8">BikeShop v1.0.0</p>
    </div>
  );
}
