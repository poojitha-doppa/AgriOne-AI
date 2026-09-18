import { LayoutDashboard, Scan, MessageSquare, Newspaper, Bot, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const navItems = [
  { key: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "nav.assistant", url: "/assistant", icon: Scan },
  { key: "nav.schemes", url: "/schemes", icon: MessageSquare },
  { key: "nav.news", url: "/news", icon: Newspaper },
  { key: "nav.aiAssistant", url: "/ai-assistant", icon: Bot },
];

export function AppSidebar() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const items = isAdmin ? [...navItems, { key: "nav.admin", url: "/admin", icon: Shield }] : navItems;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar min-h-screen p-4 gap-1">
      <div className="flex items-center gap-2.5 px-3 py-4 mb-4 cursor-pointer" onClick={() => navigate("/")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-heading font-bold text-sm">AM</span>
        </div>
        <span className="font-heading font-semibold text-lg text-foreground">{t("brand.name")}</span>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/dashboard"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm">{t(item.key)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
