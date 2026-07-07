import mongoose, { Schema, Document } from "mongoose";

export interface IRolePermission extends Document {
  roleId: string;
  permissions: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
}

const RolePermissionSchema: Schema = new Schema(
  {
    roleId: { type: String, required: true, unique: true },
    permissions: { type: Schema.Types.Map, of: [String] },
  },
  { timestamps: true }
);

export const RolePermission = mongoose.models.RolePermission || mongoose.model<IRolePermission>("RolePermission", RolePermissionSchema);
