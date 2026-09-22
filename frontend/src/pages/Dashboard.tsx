import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Download, Plus, Sparkles, TrendingUp } from "lucide-react";
import { activity, channelData, kpis, transactions } from "../lib/data";
import { Badge, Button, Card } from "../components/primitives";
import { ChannelDonut, RevenueChart, Sparkline } from "../components/charts";

const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* page verdict — one headline number, actions right */}
      <motion.div {...fade} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted-foreground">Monday, Sep 21 · Q3 overview</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Good morning, Sarah</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Revenue is up 12.4% — on pace for your best quarter yet.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
          <Button><Plus className="h-4 w-4" /> New order</Button>
        </div>
      </motion.div>

      {/* AI summary — 2026 signature component */}
      <motion.div {...fade} transition={{ delay: 0.05 }}>
        <Card className="flex gap-4 border-primary/25 bg-gradient-to-r from-primary/[0.09] to-transparent p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">AI summary <Badge tone="default" className="ml-2">Beta</Badge></p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
              Paid acquisition drove 64% of new revenue while churn fell to 1.9%. Quantia is near quota — a good upsell moment. Suggested next step: approve the Hexlab expansion quote.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* KPI blocks first — sparklines inline, no boxes-in-boxes */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.id} {...fade} transition={{ delay: 0.05 + i * 0.05 }}>
            <Card className="p-5">
              <p className="text-[13px] text-muted-foreground">{k.label}</p>
              <div className="mt-1.5 flex items-baseline justify-between">
                <p className="text-[26px] font-semibold tracking-tight tabular-nums">{k.value}</p>
                <span className={`flex items-center gap-0.5 text-[12.5px] font-medium ${k.up ? "text-emerald-600" : "text-rose-500"}`}>
                  {k.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{k.delta}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Sparkline data={k.spark} positive={k.id !== "churn" ? true : true} />
                <span className="text-[11px] text-muted-foreground">vs last mo</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* revenue + channels */}
      <div className="grid gap-4 xl:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.2 }} className="xl:col-span-2">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold">Revenue vs expenses</h2>
                <p className="text-[13px] text-muted-foreground">Last 12 months · in $ thousands</p>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-3" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Expenses</span>
              </div>
            </div>
            <div className="mt-4"><RevenueChart /></div>
          </Card>
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.25 }}>
          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">Acquisition channels</h2>
            <p className="text-[13px] text-muted-foreground">Where customers come from</p>
            <ChannelDonut />
            <div className="space-y-2.5">
              {channelData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2.5 text-[13px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"][i] }} />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-medium tabular-nums">{c.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* table as primary interface (Stripe pattern) + activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.3 }} className="xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <div><h2 className="text-[15px] font-semibold">Recent transactions</h2><p className="text-[13px] text-muted-foreground">Latest invoices across all plans</p></div>
              <Button variant="ghost" size="sm" className="font-medium underline decoration-primary/60 underline-offset-4 hover:decoration-primary">View all <TrendingUp className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead><tr className="border-y border-border bg-muted/50 text-muted-foreground">{["Customer", "Product", "Date", "Amount", "Status"].map((h) => <th key={h} className="px-5 py-2.5 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3"><p className="font-medium">{t.customer}</p><p className="text-xs text-muted-foreground">{t.id}</p></td>
                      <td className="px-5 py-3 text-muted-foreground">{t.product}</td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{t.date}</td>
                      <td className="px-5 py-3 font-medium tabular-nums">{t.amount}</td>
                      <td className="px-5 py-3"><Badge tone={t.status === "Paid" ? "green" : t.status === "Pending" ? "amber" : "red"}>{t.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.35 }}>
          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">Activity</h2>
            <p className="text-[13px] text-muted-foreground">What happened today</p>
            <div className="mt-4 space-y-1">
              {activity.map((a, i) => (
                <div key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < activity.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-border" />}
                  <span className="mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-primary bg-background" />
                  <div><p className="text-[13px] leading-snug">{a.text}</p><p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p></div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
