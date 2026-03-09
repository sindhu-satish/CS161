import { Dumbbell, User } from "lucide-react";

const DashboardHeader = () => (
  <header className="flex items-center justify-between px-5 py-4">
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <Dumbbell className="h-5 w-5 text-primary-foreground" />
      </div>
      <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
        FitTrack Pro
      </h1>
    </div>
    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
      <User className="h-4 w-4 text-muted-foreground" />
    </button>
  </header>
);

export default DashboardHeader;
