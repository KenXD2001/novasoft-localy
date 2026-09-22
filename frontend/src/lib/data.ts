export const kpis = [
  { id: "revenue", label: "Total revenue", value: "$128,430", delta: "+12.4%", up: true, spark: [12, 18, 15, 22, 19, 28, 26, 34, 31, 40, 38, 46] },
  { id: "customers", label: "Active customers", value: "8,549", delta: "+8.1%", up: true, spark: [20, 22, 21, 26, 24, 29, 31, 30, 35, 38, 37, 42] },
  { id: "orders", label: "Orders", value: "12,204", delta: "+4.6%", up: true, spark: [30, 28, 32, 29, 34, 33, 38, 36, 41, 39, 44, 47] },
  { id: "churn", label: "Churn rate", value: "1.9%", delta: "-0.4%", up: true, spark: [42, 40, 38, 39, 35, 34, 32, 30, 28, 27, 25, 22] },
];

export const revenueSeries = [
  { m: "Jan", revenue: 42, expenses: 28 },
  { m: "Feb", revenue: 48, expenses: 30 },
  { m: "Mar", revenue: 45, expenses: 27 },
  { m: "Apr", revenue: 58, expenses: 34 },
  { m: "May", revenue: 55, expenses: 32 },
  { m: "Jun", revenue: 68, expenses: 38 },
  { m: "Jul", revenue: 64, expenses: 36 },
  { m: "Aug", revenue: 76, expenses: 41 },
  { m: "Sep", revenue: 82, expenses: 44 },
  { m: "Oct", revenue: 79, expenses: 43 },
  { m: "Nov", revenue: 92, expenses: 48 },
  { m: "Dec", revenue: 98, expenses: 51 },
];

export const channelData = [
  { name: "Organic", value: 42 },
  { name: "Paid", value: 28 },
  { name: "Referral", value: 18 },
  { name: "Social", value: 12 },
];

export const transactions = [
  { id: "#INV-9041", customer: "Acme Corp", email: "billing@acme.co", product: "Scale plan", date: "Sep 20, 2026", amount: "$4,800", status: "Paid" },
  { id: "#INV-9040", customer: "Loomify", email: "ops@loomify.io", product: "Starter plan", date: "Sep 19, 2026", amount: "$890", status: "Paid" },
  { id: "#INV-9039", customer: "Hexlab", email: "fin@hexlab.dev", product: "Enterprise", date: "Sep 18, 2026", amount: "$12,400", status: "Pending" },
  { id: "#INV-9038", customer: "Nimbus", email: "team@nimbus.app", product: "Scale plan", date: "Sep 17, 2026", amount: "$3,200", status: "Paid" },
  { id: "#INV-9037", customer: "Quantia", email: "pay@quantia.ai", product: "Usage overage", date: "Sep 16, 2026", amount: "$1,150", status: "Failed" },
  { id: "#INV-9036", customer: "Driftwell", email: "hello@driftwell.co", product: "Starter plan", date: "Sep 15, 2026", amount: "$890", status: "Paid" },
];

export const activity = [
  { id: 1, text: "New enterprise deal closed — Hexlab ($12.4k)", time: "12 min ago" },
  { id: 2, text: "Churn risk resolved for Nimbus workspace", time: "1 hr ago" },
  { id: 3, text: "Weekly report exported by Sarah Chen", time: "3 hrs ago" },
  { id: 4, text: "Usage alert: Quantia at 92% of quota", time: "5 hrs ago" },
  { id: 5, text: "12 new signups from referral campaign", time: "Yesterday" },
];

export const navSections = [
  {
    label: "Overview",
    items: [
      { icon: "dashboard", label: "Dashboard", to: "/", active: true, badge: undefined as string | undefined },
      { icon: "projects", label: "Projects", to: "/projects", badge: undefined },
      { icon: "services", label: "Services", to: "/services", badge: undefined },
      { icon: "tunnels", label: "Tunnels", to: "/tunnels", badge: undefined },
    ],
  },
  {
    label: "Manage",
    items: [
      { icon: "activities", label: "Activities", to: "/activities", badge: undefined },
      { icon: "settings", label: "Settings", to: "/settings", badge: undefined },
    ],
  },
];

export type ProjectStatus = "Running" | "Stopped";

export interface Project {
  id: string;
  name: string;
  category: string;
  status: ProjectStatus;
  description: string;
  services: number;
  tunnels: number;
}

export const projects: Project[] = [
  { id: "atlas-api", name: "Atlas API", category: "Backend", status: "Running", description: "Core public API serving docs, billing and realtime events to every client.", services: 8, tunnels: 3 },
  { id: "nimbus-web", name: "Nimbus Web", category: "Frontend", status: "Running", description: "Customer-facing dashboard and marketing site with edge rendering.", services: 5, tunnels: 2 },
  { id: "ledger-sync", name: "Ledger Sync", category: "Backend", status: "Stopped", description: "Nightly reconciliation pipeline between billing providers and the warehouse.", services: 4, tunnels: 1 },
  { id: "beacon-portal", name: "Beacon Portal", category: "Fullstack", status: "Running", description: "Client portal with realtime dashboards, billing and team workspaces.", services: 6, tunnels: 2 },
  { id: "forge-ci", name: "Forge CI", category: "Fullstack", status: "Stopped", description: "Preview environments and load-test harness for every pull request.", services: 2, tunnels: 0 },
  { id: "pulse-analytics", name: "Pulse Analytics", category: "Fullstack", status: "Running", description: "Product telemetry ingestion, rollups and anomaly alerts.", services: 7, tunnels: 4 },
];
