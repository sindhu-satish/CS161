import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User, Target, Ruler, Bell, Moon, ChevronRight, LogOut,
  Edit3, Camera, Check, Timer, Volume2, Vibrate,
  HelpCircle, Star, Share2, Trash2, Download
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

  const [restTimerDuration, setRestTimerDuration] = useState(90);
  const [restTimerSound, setRestTimerSound] = useState(true);
  const [restTimerVibrate, setRestTimerVibrate] = useState(true);
  const [notifWorkoutReminder, setNotifWorkoutReminder] = useState(true);
  const [notifPRAlerts, setNotifPRAlerts] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(true);
  const [notifRestDay, setNotifRestDay] = useState(false);

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

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="shrink-0">
      <div className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${on ? "bg-primary" : "bg-secondary"}`}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-md transition-transform duration-300 ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <header className="px-5 pt-6 pb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>
        </header>

        {/* User card */}
        <div className="mx-5 mb-6 rounded-2xl bg-foreground p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm">
                  <Camera className="h-3 w-3 text-muted-foreground" />
                </button>
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
              onClick={() => setActivePanel("unit")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Weight Unit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{user?.unit || "lbs"}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>

            <button
              onClick={() => setActivePanel("timer")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Rest Timer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{restTimerDuration}s</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </div>
        </section>

        {/* App Settings */}
        <section className="px-5 mb-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-foreground">App Settings</h3>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
            <button
              onClick={() => setActivePanel("notifications")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {[notifWorkoutReminder, notifPRAlerts, notifWeeklySummary, notifRestDay].filter(Boolean).length} active
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>

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
            <button className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30">
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Export Data</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30">
              <div className="flex items-center gap-3">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Share with Friends</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary/30">
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Rate the App</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
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

      {/* WEIGHT UNIT DIALOG */}
      <Dialog open={activePanel === "unit"} onOpenChange={(o) => !o && setActivePanel(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg font-bold text-foreground text-left">Weight Unit</DialogTitle>
            <DialogDescription className="text-left text-xs">Choose your preferred unit of measurement</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-2">
            {UNITS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  void updateProfile({ unit: u.id }).then(() => setActivePanel(null));
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  user?.unit === u.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  user?.unit === u.id ? "bg-primary" : "bg-secondary"
                }`}>
                  {user?.unit === u.id ? (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.label}</p>
                  <p className="text-xs text-muted-foreground">{u.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* REST TIMER DIALOG */}
      <Dialog open={activePanel === "timer"} onOpenChange={(o) => !o && setActivePanel(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg font-bold text-foreground text-left">Rest Timer</DialogTitle>
            <DialogDescription className="text-left text-xs">Configure your between-sets rest timer</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-5">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Default Duration</label>
              <div className="mt-2 flex items-center gap-3">
                {[30, 60, 90, 120, 180].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setRestTimerDuration(dur)}
                    className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors ${
                      restTimerDuration === dur ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-border"
                    }`}
                  >
                    {dur < 60 ? `${dur}s` : `${dur / 60}m`}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center font-display text-2xl font-bold text-foreground">
                {Math.floor(restTimerDuration / 60)}:{(restTimerDuration % 60).toString().padStart(2, "0")}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sound Alert</p>
                  <p className="text-[10px] text-muted-foreground">Play sound when timer ends</p>
                </div>
              </div>
              <Toggle on={restTimerSound} onToggle={() => setRestTimerSound(!restTimerSound)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Vibration</p>
                  <p className="text-[10px] text-muted-foreground">Vibrate when timer ends</p>
                </div>
              </div>
              <Toggle on={restTimerVibrate} onToggle={() => setRestTimerVibrate(!restTimerVibrate)} />
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NOTIFICATIONS DIALOG */}
      <Dialog open={activePanel === "notifications"} onOpenChange={(o) => !o && setActivePanel(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg font-bold text-foreground text-left">Notifications</DialogTitle>
            <DialogDescription className="text-left text-xs">Manage your notification preferences</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-1 divide-y divide-border">
            {[
              { label: "Workout Reminders", desc: "Daily reminder to hit the gym", on: notifWorkoutReminder, toggle: () => setNotifWorkoutReminder(!notifWorkoutReminder) },
              { label: "PR Alerts", desc: "Celebrate when you break a record", on: notifPRAlerts, toggle: () => setNotifPRAlerts(!notifPRAlerts) },
              { label: "Weekly Summary", desc: "Recap of your training week", on: notifWeeklySummary, toggle: () => setNotifWeeklySummary(!notifWeeklySummary) },
              { label: "Rest Day Reminder", desc: "Remind you to take recovery days", on: notifRestDay, toggle: () => setNotifRestDay(!notifRestDay) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle on={item.on} onToggle={item.toggle} />
              </div>
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