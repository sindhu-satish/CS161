import { Dumbbell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
          FitTrack Pro
        </h1>
      </div>
      <button
        type="button"
        aria-label="Open profile"
        onClick={() => navigate("/profile")}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-secondary"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </header>
  );
};

export default DashboardHeader;
