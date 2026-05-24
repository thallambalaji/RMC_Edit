import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, ShieldCheck, ChevronRight, Save } from "lucide-react";

export default function Profile() {
  const { data: user, refetch } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user changes/loads
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to update profile");
      }
      toast({
        title: "Success",
        description: "Profile details updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      refetch();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.username?.[0].toUpperCase() || "A";

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">My Profile</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Profile</span>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: Avatar Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#1e40af] to-[#0ea5e9] text-white flex items-center justify-center text-4xl font-extrabold shadow-md border-4 border-white">
              {initials}
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 bg-green-500 rounded-full border-2 border-white" title="Active Session" />
          </div>

          <div>
            <h3 className="text-lg font-black text-gray-900">{user?.fullName || user?.username}</h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">@{user?.username}</p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border rounded-full text-[10px] font-black uppercase text-slate-700 tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1e40af]" />
            {user?.role || "User"}
          </div>

          <div className="w-full border-t pt-4 text-left space-y-3 text-xs">
            <div className="flex justify-between items-center text-gray-600">
              <span className="font-semibold text-[10px] uppercase text-gray-400">Email Address</span>
              <span className="font-medium text-gray-800">{user?.email || "n/a"}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span className="font-semibold text-[10px] uppercase text-gray-400">Account Role</span>
              <span className="font-medium text-gray-800 uppercase font-bold text-[#1e40af]">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm p-6 flex flex-col justify-between">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2 mb-4">Edit Profile Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold text-gray-600 uppercase">Full Name</Label>
                <div className="relative">
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="Enter full name" 
                    className="h-9 text-xs pl-8 border-gray-300"
                    required
                  />
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-gray-600 uppercase">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Enter email address" 
                    className="h-9 text-xs pl-8 border-gray-300"
                    required
                  />
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white px-5 h-9 font-bold uppercase text-[10px] tracking-wider rounded-lg shadow-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
