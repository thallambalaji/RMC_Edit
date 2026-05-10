import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: () => {
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: "Login failed",
            description: "Please check your credentials and try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="h-screen flex flex-col justify-center relative overflow-hidden bg-slate-900">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-110"
        style={{ 
          backgroundImage: `url('/construction_bg.png')`,
        }}
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-slate-800/40" />
      
      {/* Content */}
      <div className="relative z-10 py-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in duration-700 w-full flex flex-col items-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl">
            FORTUNE <span className="text-blue-500">MIX</span>
          </h1>
          <div className="h-1 w-12 bg-blue-500 mx-auto mb-3 rounded-full" />
          <p className="text-blue-100/80 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto">
            Engineering Excellence in Every Cubic Meter
          </p>
        </div>

        <div className="w-full sm:max-w-md px-4 sm:px-0">
          <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
            <CardHeader className="space-y-1 pb-3 pt-4">
              <CardTitle className="text-xl font-bold text-white text-center tracking-tight">System Login</CardTitle>
              <CardDescription className="text-blue-100/40 text-center text-[9px] uppercase font-bold tracking-widest">Enterprise Management</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-blue-100/70 text-[9px] font-black uppercase tracking-widest ml-1">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="Enter your user ID"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-blue-100/70 text-[9px] font-black uppercase tracking-widest ml-1">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10 text-sm focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-11 uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] mt-2" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : "Sign In to Portal"}
                </Button>
              </form>
            </CardContent>
            <div className="p-4 bg-black/20 border-t border-white/5">
              <p className="text-center text-[9px] text-white/30 font-bold uppercase tracking-widest">
                Protected by FortuneMix Security Protocol
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
