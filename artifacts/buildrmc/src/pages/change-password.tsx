import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, ChevronRight, Save } from "lucide-react";

export default function ChangePassword() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match!",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 4) {
      toast({
        title: "Error",
        description: "New password must be at least 4 characters long!",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to change password");
      }
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Change Password</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Change Password</span>
          </nav>
        </div>
      </div>

      <div className="max-w-xl bg-white rounded-lg border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2 mb-4">Security Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-xs font-bold text-gray-600 uppercase">Current Password</Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type="password"
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  placeholder="Enter current password" 
                  className="h-9 text-xs pl-8 border-gray-300"
                  required
                />
                <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-bold text-gray-600 uppercase">New Password</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type="password"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Enter new password" 
                  className="h-9 text-xs pl-8 border-gray-300"
                  required
                />
                <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-bold text-gray-600 uppercase">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Re-type new password" 
                  className="h-9 text-xs pl-8 border-gray-300"
                  required
                />
                <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
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
              {isSaving ? "Updating..." : "Change Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
