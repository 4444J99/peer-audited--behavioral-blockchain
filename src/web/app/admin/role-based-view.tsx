"use client";

import { useMemo } from "react";
import { Shield, User, Building, Settings, BarChart } from "lucide-react";

interface RoleBasedViewProps {
  role: "ADMIN" | "FURY" | "USER";
  enterpriseName?: string;
  children?: React.ReactNode;
}

const ROLE_SECTIONS: Record<
  string,
  { label: string; icon: React.ReactNode; visible: string[] }[]
> = {
  ADMIN: [
    {
      label: "Organization Settings",
      icon: <Building size={16} />,
      visible: ["ADMIN"],
    },
    { label: "User Management", icon: <User size={16} />, visible: ["ADMIN"] },
    {
      label: "Billing Dashboard",
      icon: <BarChart size={16} />,
      visible: ["ADMIN"],
    },
    { label: "Security Audit", icon: <Shield size={16} />, visible: ["ADMIN"] },
    {
      label: "Contract Overview",
      icon: <Settings size={16} />,
      visible: ["ADMIN", "FURY"],
    },
  ],
  FURY: [
    {
      label: "Fury Console",
      icon: <Shield size={16} />,
      visible: ["ADMIN", "FURY"],
    },
    {
      label: "Dispute Queue",
      icon: <Settings size={16} />,
      visible: ["ADMIN", "FURY"],
    },
    {
      label: "Contract Overview",
      icon: <Settings size={16} />,
      visible: ["ADMIN", "FURY"],
    },
  ],
  USER: [
    {
      label: "My Contracts",
      icon: <Settings size={16} />,
      visible: ["ADMIN", "FURY", "USER"],
    },
    {
      label: "My Profile",
      icon: <User size={16} />,
      visible: ["ADMIN", "FURY", "USER"],
    },
    {
      label: "Support",
      icon: <Shield size={16} />,
      visible: ["ADMIN", "FURY", "USER"],
    },
  ],
};

export default function RoleBasedView({
  role,
  enterpriseName,
  children,
}: RoleBasedViewProps) {
  const sections = useMemo(() => {
    return (ROLE_SECTIONS[role] || ROLE_SECTIONS.USER).map((section) => ({
      ...section,
      visible: section.visible.includes(role),
    }));
  }, [role]);

  return (
    <div className="role-based-view" data-testid="role-based-view">
      <div className="role-based-view__header">
        <h2 className="role-based-view__title">
          <Shield size={20} /> {role.charAt(0) + role.slice(1).toLowerCase()}{" "}
          Dashboard
        </h2>
        {enterpriseName && (
          <span
            className="role-based-view__enterprise"
            data-testid="rbac-enterprise"
          >
            <Building size={14} /> {enterpriseName}
          </span>
        )}
      </div>

      <nav className="role-based-view__nav" data-testid="rbac-nav">
        {sections.map((section) => (
          <div
            key={section.label}
            className={`role-based-view__nav-item ${section.visible ? "role-based-view__nav-item--visible" : "role-based-view__nav-item--hidden"}`}
            data-testid={`rbac-nav-${section.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {section.icon}
            <span>{section.label}</span>
          </div>
        ))}
      </nav>

      <main className="role-based-view__content">{children}</main>
    </div>
  );
}
