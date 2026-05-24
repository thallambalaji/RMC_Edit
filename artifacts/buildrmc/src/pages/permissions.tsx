import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Shield, ShieldCheck, Info, Check, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RoleConfig {
  id: string;
  name: string;
  desc: string;
}

interface ModuleConfig {
  name: string;
  actions: string[];
}

const ROLES: RoleConfig[] = [
  { id: "admin", name: "Super Admin", desc: "Full administrative control over all modules and settings." },
  { id: "manager", name: "Manager", desc: "Manage billing, orders, and view reports. Cannot modify system configurations." },
  { id: "dispatcher", name: "Dispatcher", desc: "Manage delivery challans, fleet scheduling, and weighbridge operations." },
  { id: "qc_engineer", name: "QC Engineer", desc: "Create mix designs, test cubes, and manage recipe specifications." }
];

const MODULES: ModuleConfig[] = [
  { name: "Customer & PO", actions: ["read", "create", "edit", "delete"] },
  { name: "Sales & Enquiries", actions: ["read", "create", "edit", "delete"] },
  { name: "Billing & Invoices", actions: ["read", "create", "edit", "delete"] },
  { name: "Delivery Challan", actions: ["read", "create", "edit", "delete"] },
  { name: "Weighbridge & Weighment", actions: ["read", "create", "edit", "delete"] },
  { name: "QC Mix & Recipes", actions: ["read", "create", "edit", "delete"] },
  { name: "Fleet & Transport", actions: ["read", "create", "edit", "delete"] }
];

export default function Permissions() {
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState("admin");
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, string[]>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load configured permissions from server
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/permissions");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, Record<string, string[]>> = {};
          data.forEach((r: any) => {
            map[r.roleId] = r.permissions;
          });
          setRolePermissions(map);
        } else {
          throw new Error("Failed to fetch permissions settings");
        }
      } catch (err: any) {
        toast({
          title: "Error Loading Permissions",
          description: err.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [toast]);

  // Handle toggling of a checkbox permission
  const handleToggle = (moduleName: string, action: string) => {
    setRolePermissions(prev => {
      const currentRolePerms = prev[activeRole] || {};
      const currentModulePerms = currentRolePerms[moduleName] || [];
      
      let newModulePerms: string[];
      if (currentModulePerms.includes(action)) {
        newModulePerms = currentModulePerms.filter(a => a !== action);
      } else {
        newModulePerms = [...currentModulePerms, action];
      }

      return {
        ...prev,
        [activeRole]: {
          ...currentRolePerms,
          [moduleName]: newModulePerms
        }
      };
    });
  };

  // Save changes to backend database
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: activeRole,
          permissions: rolePermissions[activeRole] || {}
        })
      });
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to save permissions");
      }
      toast({
        title: "Success",
        description: `Permissions for ${ROLES.find(r => r.id === activeRole)?.name} saved successfully!`,
      });
    } catch (err: any) {
      toast({
        title: "Error Saving Changes",
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
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Permissions Matrix</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Permissions</span>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side: Role Selectors */}
        <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-bold">System Roles</h3>
          <div className="space-y-2">
            {ROLES.map((role) => {
              const isActive = role.id === activeRole;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#1e40af]/5 border-[#1e40af] shadow-sm"
                      : "hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className={`h-4 w-4 ${isActive ? "text-[#1e40af]" : "text-gray-400"}`} />
                    <span className={`text-xs font-bold ${isActive ? "text-[#1e40af]" : "text-gray-700"}`}>
                      {role.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{role.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Matrix display */}
        <div className="lg:col-span-3 bg-white rounded-lg border shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1e40af]" />
                Module Access for {ROLES.find(r => r.id === activeRole)?.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Configure individual module actions permitted for this role.</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white px-5 h-9 font-bold uppercase text-[10px] tracking-wider rounded-lg shadow-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400 font-medium">
              Loading permissions settings...
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    <th className="p-3 font-black">Module Name</th>
                    <th className="p-3 text-center font-black">Read</th>
                    <th className="p-3 text-center font-black">Create</th>
                    <th className="p-3 text-center font-black">Edit</th>
                    <th className="p-3 text-center font-black">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {MODULES.map((mod) => {
                    const currentRolePerms = rolePermissions[activeRole] || {};
                    const perms = currentRolePerms[mod.name] || [];
                    return (
                      <tr key={mod.name} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-gray-700">{mod.name}</td>
                        {["read", "create", "edit", "delete"].map((action) => {
                          const hasPerm = perms.includes(action);
                          return (
                            <td key={action} className="p-3">
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggle(mod.name, action)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
                                    hasPerm
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                  } cursor-pointer`}
                                >
                                  {hasPerm ? (
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  ) : (
                                    <X className="h-4 w-4 stroke-[3]" />
                                  )}
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg border flex gap-3 text-xs text-gray-600">
            <Info className="h-4 w-4 text-[#1e40af] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Tip:</strong> Toggle each checkbox cell to grant or restrict specific actions for this role, then click <strong>Save Settings</strong> to save the changes to the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
