import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    navigate("/login");
    setOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = user?.name?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition"
      >
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <span className="text-primary text-xs font-semibold">{userInitial}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("profile.name")}
            </p>
            <p className="text-sm font-semibold text-foreground mt-1">
              {user?.name || "Farmer"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-semibold">{t("profile.mobile")}:</span> {user?.mobile}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition"
          >
            <LogOut className="h-4 w-4" />
            {t("profile.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
