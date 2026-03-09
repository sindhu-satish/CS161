import { TrendingUp } from "lucide-react";

const data = [
  { week: "W1", value: 65 },
  { week: "W2", value: 70 },
  { week: "W3", value: 68 },
  { week: "W4", value: 75 },
  { week: "W5", value: 78 },
  { week: "W6", value: 85 },
];

const max = Math.max(...data.map((d) => d.value));

const ProgressChart = () => (
  <section className="mx-5 pb-8">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-display text-base font-semibold text-foreground">Strength Progress</h3>
      <div className="flex items-center gap-1 text-success">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">+12%</span>
      </div>
    </div>
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-1 text-xs text-muted-foreground">Bench Press · 6 week trend</p>
      <div className="mt-3 flex items-end justify-between gap-2" style={{ height: 100 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="w-full overflow-hidden rounded-md bg-secondary">
              <div
                className="w-full rounded-md bg-primary transition-all duration-500"
                style={{ height: `${(d.value / max) * 80}px` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{d.week}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold text-foreground">{data[data.length - 1].value}</span>
        <span className="text-xs text-muted-foreground">kg max</span>
      </div>
    </div>
  </section>
);

export default ProgressChart;
