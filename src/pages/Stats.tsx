import { useState } from "react";
import { TrendingUp, TrendingDown, Trophy, Flame, Scale, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, LineChart, Line } from "recharts";
import { WEEKLY_VOLUME, PR_HISTORY, BODY_WEIGHT, WORKOUT_HISTORY } from "@/data/mockData";

const Stats = () => {
  const [prIndex, setPrIndex] = useState(0);
  const selectedPR = PR_HISTORY[prIndex];

  const workoutsThisWeek = 3;
  const currentStreak = 4;
  const totalPRs = 8;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <header className="px-5 pt-6 pb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Statistics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your training performance at a glance</p>
        </header>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2.5 px-5 mb-5">
          {[
            { icon: Flame, label: "This Week", value: workoutsThisWeek, suffix: "workouts", color: "text-accent" },
            { icon: Trophy, label: "Streak", value: currentStreak, suffix: "days", color: "text-success" },
            { icon: BarChart3, label: "Total PRs", value: totalPRs, suffix: "records", color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3 shadow-sm text-center">
              <stat.icon className={`mx-auto h-4 w-4 ${stat.color} mb-1`} />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.suffix}</p>
            </div>
          ))}
        </div>

        {/* Weekly Volume */}
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Weekly Volume</h3>
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">+6%</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={WEEKLY_VOLUME}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(48, 96%, 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(48, 96%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(40, 18%, 88%)", background: "hsl(40, 30%, 99%)" }}
                  formatter={(v: number) => [`${v.toLocaleString()} lbs`, "Volume"]}
                />
                <Area type="monotone" dataKey="volume" stroke="hsl(48, 96%, 60%)" strokeWidth={2} fill="url(#volumeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* PR Tracker */}
        <section className="px-5 mb-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">PR Progress</h3>
          <div className="flex gap-2 mb-3">
            {PR_HISTORY.map((pr, i) => (
              <button
                key={pr.exercise}
                onClick={() => setPrIndex(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  prIndex === i ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-border"
                }`}
              >
                {pr.exercise}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={selectedPR.data}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(40, 18%, 88%)", background: "hsl(40, 30%, 99%)" }}
                  formatter={(v: number) => [`${v} lbs`, "Max"]}
                />
                <Bar dataKey="value" fill="hsl(48, 96%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-foreground">
                {selectedPR.data[selectedPR.data.length - 1].value}
              </span>
              <span className="text-xs text-muted-foreground">lbs current PR</span>
            </div>
          </div>
        </section>

        {/* Body Weight */}
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Body Weight</h3>
            <div className="flex items-center gap-1 text-success">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">-4 lbs</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={BODY_WEIGHT}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(40, 18%, 88%)", background: "hsl(40, 30%, 99%)" }}
                  formatter={(v: number) => [`${v} lbs`, "Weight"]}
                />
                <Line type="monotone" dataKey="weight" stroke="hsl(220, 20%, 10%)" strokeWidth={2} dot={{ fill: "hsl(48, 96%, 60%)", r: 3, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-foreground">
                {BODY_WEIGHT[BODY_WEIGHT.length - 1].weight}
              </span>
              <span className="text-xs text-muted-foreground">lbs current</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Stats;
