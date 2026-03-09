import { NavLink } from "react-router-dom";
import { Home, Clock, Dumbbell, BarChart3, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/exercises", icon: Dumbbell, label: "Exercises" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
    <div className="mx-auto flex max-w-md items-center justify-around py-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors ${
              isActive ? "text-accent" : "text-muted-foreground"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon className={`h-5 w-5 ${isActive ? "text-accent" : ""}`} />
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
