import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Shield, ShieldCheck, Info, Check, X } from "lucide-react";

interface RoleConfig {
  id: string;
  name: string;
  desc: string;
}

interface ModuleConfig {
  name: string;
  perms: Record<string, string[]>;
}

const ROLES: RoleConfig[] = [
  { id: "admin", name: "Super Admin", desc: "Full administrative control over all modules and settings." },
  { id: "manager", name: "Manager", desc: "Manage billing, orders, and view reports. Cannot modify system configurations." },
  { id: "dispatcher", name: "Dispatcher", desc: "Manage delivery challans, fleet scheduling, and weighbridge operations." },
  { id: "qc_engineer", name: "QC Engineer", desc: "Create mix designs, test cubes, and manage recipe specifications." }
];

const MODULES: ModuleConfig[] = [
  { name: "Customer & PO", perms: { admin: ["read", "create", "edit", "delete"], manager: ["read", "create", "edit"], dispatcher: ["read"], qc_engineer: ["read"] } },
  { name: "Sales & Enquiries", perms: { admin: ["read", "create", "edit", "delete"], manager: ["read", "create", "edit"], dispatcher: ["read"], qc_engineer: [] } },
  { name: "Billing & Invoices", perms: { admin: ["read", "create", "edit", "delete"], manager: ["read", "create", "edit"], dispatcher: [], qc_engineer: [] } },
  { name: "Delivery Challan", perms: { admin: ["read", "create", "edit", "delete"], manager: ["read"], dispatcher: ["read", "create", "edit"], qc_engineer: ["read"] } },
  { name: "Weighbridge & Weighment", perms: { admin: ["read", "create", "edit", "delete"], manager: ["read"], dispatcher: ["read", "create", "edit"], qc_engineer: [] } },
  { name: "QC Mix & Recipes", perms: { admin: ["read", "create", "edit", "delete"], manager: ["read"], dispatcher: [], qc_engineer: ["read", "create", "edit"] } },
  { name: "Fleet & Transport", perms: { admin: ["read", "create", "edit", "delete"], manager: ["read"], dispatcher: ["read", "create", "edit"], qc_engineer: [] } }
];

export default function Permissions() {
  const [activeRole, setActiveRole] = useState("admin");

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
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#1e40af]" />
              Module Access for {ROLES.find(r => r.id === activeRole)?.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Verify modules and specific actions permitted for this role.</p>
          </div>

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
                  const perms = mod.perms[activeRole] || [];
                  return (
                    <tr key={mod.name} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-gray-700">{mod.name}</td>
                      {["read", "create", "edit", "delete"].map((action) => {
                        const hasPerm = perms.includes(action);
                        return (
                          <td key={action} className="p-3 text-center">
                            <div className="flex justify-center">
                              {hasPerm ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                                  <X className="h-3 w-3 stroke-[3]" />
                                </div>
                              )}
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

          <div className="p-3 bg-slate-50 rounded-lg border flex gap-3 text-xs text-gray-600">
            <Info className="h-4 w-4 text-[#1e40af] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Note:</strong> Permissions are configured globally at the server environment configuration layer. To request custom access overrides, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
