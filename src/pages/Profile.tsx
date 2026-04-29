import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User, Target, Moon, ChevronRight, LogOut,
  Edit3, Camera, Check, HelpCircle, Trash2
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { getWorkouts } from "@/lib/supabase-db";

type SettingsPanel = null | "profile" | "goal" | "unit" | "notifications" | "timer" | "about";

const GOALS = [
  { id: "build-muscle", label: "Build Muscle", desc: "Focus on hypertrophy and progressive overload" },
  { id: "lose-weight", label: "Lose Weight", desc: "Caloric deficit with strength training" },
  { id: "strength", label: "Get Stronger", desc: "Low reps, heavy weights, compound lifts" },
  { id: "endurance", label: "Improve Endurance", desc: "Higher reps, circuit training, cardio" },
  { id: "maintain", label: "Stay Fit", desc: "Maintain current fitness and health" },
];

const UNITS = [
  { id: "lbs", label: "Pounds (lbs)", desc: "Imperial system" },
  { id: "kg", label: "Kilograms (kg)", desc: "Metric system" },
];

const Profile = () => {
  const { theme, toggle } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarError, setAvatarError] = useState("");

  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });
  const totalWorkouts = workouts.length;
  const currentGoal = GOALS.find((g) => g.id === (user?.goal || "build-muscle"))?.label || "Build Muscle";

  const openEditProfile = () => {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setActivePanel("profile");
  };

  const saveProfile = async () => {
    if (editName.trim()) await updateProfile({ name: editName.trim() });
    setActivePanel(null);
  };

  const handleAvatarFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setAvatarError("Could not load image.");
        return;
      }
      void updateProfile({ avatarUrl: result });
    };
    reader.onerror = () => setAvatarError("Could not load image.");
    reader.readAsDataURL(file);
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="shrink-0"
    >
      <div className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${on ? "bg-primary" : "bg-secondary"}`}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-md transition-transform duration-300 ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-4xl">
        <header className="px-5 pt-6 pb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>
        </header>

        {/* User card */}
        <div className="mx-5 mb-6 rounded-2xl bg-foreground p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary-foreground" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm"
                >
                  <Camera className="h-3 w-3 text-muted-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleAvatarFile(e.target.files?.[0] ?? null);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-background">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={openEditProfile}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/10 transition-colors hover:bg-background/20"
            >
              <Edit3 className="h-3.5 w-3.5 text-background" />
            </button>
          </div>
          <div className="mt-4 flex gap-4">
            <div>
              <p className="font-display text-xl font-bold text-primary">{totalWorkouts}</p>
              <p className="text-[10px] text-muted-foreground">Total Workouts</p>
            </div>
            <div className="h-10 w-px bg-background/10" />
            <div>
              <p className="text-sm font-medium text-background">Member since</p>
              <p className="text-xs text-muted-foreground">{user?.memberSince}</p>
            </div>
          </div>
        </div>
        {avatarError && <p className="mx-5 mb-4 text-xs text-destructive">{avatarError}</p>}

        {/* Workout Settings */}
        <section className="px-5 mb-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Workout Settings</h3>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
            <button
              onClick={() => setActivePanel("goal")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Fitness Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{currentGoal}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>

            <button
              onClick={() => void updateProfile({ unit: user?.unit === "kg" ? "lbs" : "kg" })}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30"
            >
              <span className="text-sm font-medium text-foreground">Weight Unit</span>
              <span className="text-xs text-muted-foreground">{user?.unit || "lbs"}</span>
            </button>
          </div>
        </section>

        {/* App Settings */}
        <section className="px-5 mb-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-foreground">App Settings</h3>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
            <button
              onClick={toggle}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Dark Mode</span>
              </div>
              <Toggle on={theme === "dark"} onToggle={toggle} />
            </button>
          </div>
        </section>

        {/* Data & Support */}
        <section className="px-5 mb-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Data & Support</h3>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
            <button
              onClick={() => setActivePanel("about")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">About</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="px-5 mb-5">
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              Delete Account
            </button>
          </div>
        </section>

        <p className="text-center text-[10px] text-muted-foreground pb-4">FitTrack Pro v1.0.0</p>
      </div>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={activePanel === "profile"} onOpenChange={(o) => !o && setActivePanel(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg font-bold text-foreground text-left">Edit Profile</DialogTitle>
            <DialogDescription className="text-left text-xs">Update your personal information</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                value={editEmail}
                disabled
                className="mt-1 h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm font-medium text-muted-foreground outline-none cursor-not-allowed"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setActivePanel(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveProfile()}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
              >
                Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FITNESS GOAL DIALOG */}
      <Dialog open={activePanel === "goal"} onOpenChange={(o) => !o && setActivePanel(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg font-bold text-foreground text-left">Fitness Goal</DialogTitle>
            <DialogDescription className="text-left text-xs">Choose your primary training focus</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  void updateProfile({ goal: g.id }).then(() => setActivePanel(null));
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  user?.goal === g.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  user?.goal === g.id ? "bg-primary" : "bg-secondary"
                }`}>
                  {user?.goal === g.id ? (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Target className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{g.label}</p>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ABOUT DIALOG */}
      <Dialog open={activePanel === "about"} onOpenChange={(o) => !o && setActivePanel(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg font-bold text-foreground text-left">About FitTrack Pro</DialogTitle>
            <DialogDescription className="text-left text-xs">Your personal gym companion</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Track your workouts, monitor progress, and crush your fitness goals. Built for lifters who take their training seriously.
            </p>
            <button
              onClick={() => setActivePanel(null)}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;