import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  FileBarChart2, Printer, FileText, CreditCard, CalendarCheck, Users,
  Car, Warehouse, TrendingUp, DollarSign, Clock,
} from "lucide-react";

type ReportType = "inventory" | "vehicles" | "people" | "payments" | "invoices" | "appointments";

const REPORT_TABS: { key: ReportType; label: string; icon: any }[] = [
  { key: "inventory",    label: "Car Inventory", icon: Warehouse },
  { key: "vehicles",     label: "Vehicles",      icon: Car },
  { key: "people",       label: "People",        icon: Users },
  { key: "payments",     label: "Payments",      icon: CreditCard },
  { key: "invoices",     label: "Invoices",      icon: FileText },
  { key: "appointments", label: "Appointments",  icon: CalendarCheck },
];

function fmt(n: number) { return `$${n.toFixed(2)}`; }
function fmtDate(d: string | undefined) { return d ? new Date(d).toLocaleDateString() : "—"; }

// ── PRINT CSS shared across all reports ──
const PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 28px; }
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e02020; padding-bottom: 14px; margin-bottom: 20px; }
  .company { font-size: 20px; font-weight: 800; color: #e02020; }
  .report-title { font-size: 16px; font-weight: 700; text-align: right; }
  .report-meta { font-size: 11px; color: #888; text-align: right; }
  .stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat-box { border: 1px solid #e5e7eb; border-radius: 7px; padding: 10px 14px; min-width: 110px; }
  .stat-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; }
  .stat-value { font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f9fafb; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #666; border-bottom: 2px solid #e5e7eb; white-space: nowrap; }
  td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .mono { font-family: monospace; font-size: 11px; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .badge-green  { background: #dcfce7; color: #166534; }
  .badge-blue   { background: #dbeafe; color: #1d4ed8; }
  .badge-yellow { background: #fef9c3; color: #854d0e; }
  .badge-red    { background: #fee2e2; color: #991b1b; }
  .badge-gray   { background: #f3f4f6; color: #374151; }
  .footer { margin-top: 28px; font-size: 10px; color: #aaa; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; }
  @media print { body { padding: 14px; } }
`;

function openPrintWindow(title: string, innerHTML: string) {
  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) return;
  win.document.write(`<html><head><title>${title}</title><style>${PRINT_CSS}</style></head><body>
    <div class="report-header">
      <div><div class="company">LibRepair</div><div style="font-size:11px;color:#666;margin-top:2px;">On-Demand Auto Repair</div></div>
      <div><div class="report-title">${title}</div><div class="report-meta">Generated: ${new Date().toLocaleString()}</div></div>
    </div>
    ${innerHTML}
    <div class="footer"><span>LibRepair Admin · Confidential</span><span>Page 1</span></div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 450);
}

export default function ReportsPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ReportType>("inventory");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter]     = useState("all");

  const { data: inventoryData }    = useQuery({ queryKey: ["inventory"],    queryFn: () => api.get("/superadmin/inventory") });
  const { data: vehiclesData }     = useQuery({ queryKey: ["vehicles"],     queryFn: () => api.get("/superadmin/vehicles") });
  const { data: usersData }        = useQuery({ queryKey: ["users"],        queryFn: () => api.get("/superadmin/users") });
  const { data: paymentsData }     = useQuery({ queryKey: ["payments"],     queryFn: () => api.get("/superadmin/payments") });
  const { data: invoicesData }     = useQuery({ queryKey: ["invoices"],     queryFn: () => api.get("/superadmin/invoices") });
  const { data: appointmentsData } = useQuery({ queryKey: ["appointments"], queryFn: () => api.get("/superadmin/appointments") });

  const allInventory:    any[] = inventoryData?.listings     ?? [];
  const allVehicles:     any[] = vehiclesData?.vehicles      ?? [];
  const allUsers:        any[] = usersData?.users            ?? [];
  const allPayments:     any[] = paymentsData?.payments      ?? [];
  const allInvoices:     any[] = invoicesData?.invoices      ?? [];
  const allAppointments: any[] = appointmentsData?.appointments ?? [];

  function inRange(dateStr: string | undefined) {
    if (!dateStr) return true;
    const d = new Date(dateStr).getTime();
    if (dateFrom && d < new Date(dateFrom).getTime()) return false;
    if (dateTo   && d > new Date(dateTo + "T23:59:59").getTime()) return false;
    return true;
  }

  const inventory    = allInventory.filter(i => inRange(i.createdAt) && (statusFilter === "all" || i.status === statusFilter));
  const vehicles     = allVehicles.filter(v => inRange(v.createdAt));
  const people       = allUsers.filter(u => inRange(u.createdAt) && (roleFilter === "all" || u.role === roleFilter));
  const payments     = allPayments.filter(p => inRange(p.createdAt) && (statusFilter === "all" || p.status === statusFilter));
  const invoices     = allInvoices.filter(i => inRange(i.createdAt) && (statusFilter === "all" || i.status === statusFilter));
  const appointments = allAppointments.filter(a => inRange(a.createdAt) && (statusFilter === "all" || a.status === statusFilter));

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const tab = REPORT_TABS.find(t => t.key === activeTab)!;
    openPrintWindow(`${tab.label} Report`, content.innerHTML);
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(224,32,32,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileBarChart2 size={20} color="#e02020" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700 }}>Reports</h1>
            <p style={{ color: "#555", fontSize: 13 }}>Select a report, filter, then print</p>
          </div>
        </div>
        <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#e02020", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <Printer size={15} /> Print Report
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {REPORT_TABS.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setStatusFilter("all"); setRoleFilter("all"); }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
              background: activeTab === t.key ? "rgba(224,32,32,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeTab === t.key ? "rgba(224,32,32,0.35)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 9, color: activeTab === t.key ? "#e02020" : "#888",
              fontWeight: activeTab === t.key ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#555" }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 148, padding: "7px 10px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e5e5e5", fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#555" }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 148, padding: "7px 10px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e5e5e5", fontSize: 13 }} />
        </div>
        {activeTab === "inventory" && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "7px 12px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e5e5e5", fontSize: 13 }}>
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
          </select>
        )}
        {activeTab === "people" && (
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: "7px 12px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e5e5e5", fontSize: 13 }}>
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="mechanic">Mechanics</option>
            <option value="admin">Admins</option>
          </select>
        )}
        {activeTab === "payments" && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "7px 12px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e5e5e5", fontSize: 13 }}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option><option value="pending">Pending</option>
            <option value="failed">Failed</option><option value="refunded">Refunded</option>
          </select>
        )}
        {activeTab === "invoices" && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "7px 12px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e5e5e5", fontSize: 13 }}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option><option value="sent">Sent</option>
            <option value="draft">Draft</option><option value="overdue">Overdue</option>
          </select>
        )}
        {activeTab === "appointments" && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "7px 12px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e5e5e5", fontSize: 13 }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option><option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        )}
        {(dateFrom || dateTo || statusFilter !== "all" || roleFilter !== "all") && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter("all"); setRoleFilter("all"); }}
            style={{ padding: "7px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, color: "#888", fontSize: 12, cursor: "pointer" }}>
            Clear
          </button>
        )}
      </div>

      {/* Printable content */}
      <div ref={printRef}>
        {activeTab === "inventory"    && <InventoryReport    data={inventory} />}
        {activeTab === "vehicles"     && <VehiclesReport     data={vehicles}  />}
        {activeTab === "people"       && <PeopleReport       data={people}    />}
        {activeTab === "payments"     && <PaymentsReport     data={payments}  />}
        {activeTab === "invoices"     && <InvoicesReport     data={invoices}  />}
        {activeTab === "appointments" && <AppointmentsReport data={appointments} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CAR INVENTORY REPORT
═══════════════════════════════════════════ */
function InventoryReport({ data }: { data: any[] }) {
  const available = data.filter(i => i.status === "available").length;
  const sold      = data.filter(i => i.status === "sold").length;
  const reserved  = data.filter(i => i.status === "reserved").length;
  const totalValue = data.filter(i => i.status === "available").reduce((s, i) => s + i.price, 0);

  function printSingle(item: any) {
    openPrintWindow(`Vehicle — ${item.title}`, `
      <div style="margin-bottom:20px">
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">${item.title}</div>
        <div style="display:flex;gap:32px;flex-wrap:wrap">
          <div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Stock #</div>
            <div style="font-family:monospace;font-size:14px;font-weight:700;color:#e02020">${item.stockNumber ?? "—"}</div>
          </div>
          <div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Inventory ID</div>
            <div style="font-family:monospace;font-size:14px;font-weight:700">${item.inventoryId ?? "—"}</div>
          </div>
          <div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Status</div>
            <div style="font-size:13px;font-weight:600;text-transform:capitalize">${item.status}</div>
          </div>
          <div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Price</div>
            <div style="font-size:16px;font-weight:700;color:#16a34a">$${Number(item.price).toLocaleString()}</div>
          </div>
        </div>
      </div>
      <table>
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Year</td><td>${item.year}</td></tr>
        <tr><td>Make</td><td>${item.make}</td></tr>
        <tr><td>Model</td><td>${item.model}</td></tr>
        <tr><td>Color</td><td>${item.color ?? "—"}</td></tr>
        <tr><td>Mileage</td><td>${Number(item.mileage ?? 0).toLocaleString()} mi</td></tr>
        <tr><td>Condition</td><td style="text-transform:capitalize">${item.condition}</td></tr>
        <tr><td>Contact Phone</td><td>${item.contactPhone ?? "—"}</td></tr>
        <tr><td>Contact Email</td><td>${item.contactEmail ?? "—"}</td></tr>
        ${item.description ? `<tr><td>Description</td><td>${item.description}</td></tr>` : ""}
        <tr><td>Listed On</td><td>${fmtDate(item.createdAt)}</td></tr>
      </table>
    `);
  }

  return (
    <>
      <SummaryCards cards={[
        { label: "Available", value: String(available), color: "#4ade80" },
        { label: "Sold",      value: String(sold),      color: "#f87171" },
        { label: "Reserved",  value: String(reserved),  color: "#fbbf24" },
        { label: "Inventory Value", value: `$${totalValue.toLocaleString()}`, color: "#60a5fa" },
        { label: "Total",     value: String(data.length), color: "#a78bfa" },
      ]} />
      <ReportTable
        headers={["#", "Stock #", "Inventory ID", "Title", "Year/Make/Model", "Price", "Mileage", "Condition", "Status", "Listed", "Print"]}
        rows={data.map((item, i) => [
          <span style={{ color: "#555", fontSize: 12 }}>{i + 1}</span>,
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#e02020" }}>{item.stockNumber ?? "—"}</span>,
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#aaa" }}>{item.inventoryId ?? "—"}</span>,
          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</span>,
          <span style={{ fontSize: 12 }}>{item.year} {item.make} {item.model}</span>,
          <span style={{ fontWeight: 700, color: "#4ade80" }}>{fmt(item.price)}</span>,
          <span style={{ fontSize: 12 }}>{Number(item.mileage ?? 0).toLocaleString()} mi</span>,
          <StatusBadge status={item.condition} />,
          <StatusBadge status={item.status} />,
          <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(item.createdAt)}</span>,
          <PrintBtn onClick={() => printSingle(item)} />,
        ])}
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   VEHICLES REPORT (customer-owned vehicles)
═══════════════════════════════════════════ */
function VehiclesReport({ data }: { data: any[] }) {
  function printSingle(v: any) {
    openPrintWindow(`Vehicle ID #${v.id} — ${v.year} ${v.make} ${v.model}`, `
      <div style="margin-bottom:20px">
        <div style="font-size:15px;font-weight:700;margin-bottom:8px">${v.year} ${v.make} ${v.model}</div>
        <div style="display:flex;gap:32px;flex-wrap:wrap">
          <div><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Vehicle ID</div>
            <div style="font-family:monospace;font-size:14px;font-weight:700;color:#e02020">#${v.id}</div></div>
          <div><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Owner</div>
            <div style="font-size:13px;font-weight:600">${v.ownerName ?? "—"}</div>
            <div style="font-size:11px;color:#666">${v.ownerEmail ?? ""}</div></div>
        </div>
      </div>
      <table>
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>VIN</td><td style="font-family:monospace">${v.vin ?? "—"}</td></tr>
        <tr><td>License Plate</td><td>${v.licensePlate ?? "—"}</td></tr>
        <tr><td>Color</td><td>${v.color ?? "—"}</td></tr>
        <tr><td>Mileage</td><td>${Number(v.mileage ?? 0).toLocaleString()} mi</td></tr>
        <tr><td>Last Service</td><td>${fmtDate(v.lastServiceDate)}</td></tr>
        <tr><td>Added On</td><td>${fmtDate(v.createdAt)}</td></tr>
      </table>
    `);
  }

  return (
    <>
      <SummaryCards cards={[
        { label: "Total Vehicles", value: String(data.length), color: "#60a5fa" },
        { label: "With VIN",   value: String(data.filter(v => v.vin).length),          color: "#4ade80" },
        { label: "With Plate", value: String(data.filter(v => v.licensePlate).length), color: "#f59e0b" },
      ]} />
      <ReportTable
        headers={["ID #", "Owner", "Year/Make/Model", "Color", "VIN", "Plate", "Mileage", "Last Service", "Print"]}
        rows={data.map(v => [
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#e02020" }}>#{v.id}</span>,
          <span><div style={{ fontWeight: 500, fontSize: 13 }}>{v.ownerName ?? "—"}</div><div style={{ fontSize: 11, color: "#555" }}>{v.ownerEmail ?? ""}</div></span>,
          <span style={{ fontWeight: 500, fontSize: 13 }}>{v.year} {v.make} {v.model}</span>,
          <span style={{ fontSize: 12 }}>{v.color ?? "—"}</span>,
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#aaa" }}>{v.vin ?? "—"}</span>,
          <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v.licensePlate ?? "—"}</span>,
          <span style={{ fontSize: 12 }}>{Number(v.mileage ?? 0).toLocaleString()} mi</span>,
          <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(v.lastServiceDate)}</span>,
          <PrintBtn onClick={() => printSingle(v)} />,
        ])}
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   PEOPLE REPORT
═══════════════════════════════════════════ */
function PeopleReport({ data }: { data: any[] }) {
  function printSingle(u: any) {
    openPrintWindow(`Person — ${u.name}`, `
      <div style="margin-bottom:20px">
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">${u.name}</div>
        <div style="display:flex;gap:32px;flex-wrap:wrap">
          <div><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">User ID</div>
            <div style="font-family:monospace;font-size:11px;color:#e02020;word-break:break-all">${u.id}</div></div>
          <div><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Role</div>
            <div style="font-size:13px;font-weight:600;text-transform:capitalize">${u.role}</div></div>
          <div><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:2px">Status</div>
            <div style="font-size:13px;font-weight:600;color:${u.isActive ? "#16a34a" : "#dc2626"}">${u.isActive ? "Active" : "Inactive"}</div></div>
        </div>
      </div>
      <table>
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Email</td><td>${u.email}</td></tr>
        <tr><td>Phone</td><td>${u.phone ?? "—"}</td></tr>
        <tr><td>Address</td><td>${u.address ?? "—"}</td></tr>
        <tr><td>Joined</td><td>${fmtDate(u.createdAt)}</td></tr>
      </table>
    `);
  }

  const customers = data.filter(u => u.role === "customer").length;
  const mechanics = data.filter(u => u.role === "mechanic" || u.role === "technician").length;
  const admins    = data.filter(u => u.role === "admin").length;

  return (
    <>
      <SummaryCards cards={[
        { label: "Total",      value: String(data.length),  color: "#4ade80" },
        { label: "Customers",  value: String(customers),    color: "#60a5fa" },
        { label: "Mechanics",  value: String(mechanics),    color: "#f59e0b" },
        { label: "Admins",     value: String(admins),       color: "#e02020" },
        { label: "Active",     value: String(data.filter(u => u.isActive).length), color: "#a78bfa" },
      ]} />
      <ReportTable
        headers={["#", "User ID", "Name", "Email", "Phone", "Role", "Active", "Joined", "Print"]}
        rows={data.map((u, i) => [
          <span style={{ color: "#555", fontSize: 12 }}>{i + 1}</span>,
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888", maxWidth: 120, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.id}</span>,
          <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name ?? "—"}</span>,
          <span style={{ fontSize: 12, color: "#aaa" }}>{u.email}</span>,
          <span style={{ fontSize: 12 }}>{u.phone ?? "—"}</span>,
          <StatusBadge status={u.role} />,
          <span style={{ color: u.isActive ? "#4ade80" : "#f87171", fontSize: 12, fontWeight: 600 }}>{u.isActive ? "Yes" : "No"}</span>,
          <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(u.createdAt)}</span>,
          <PrintBtn onClick={() => printSingle(u)} />,
        ])}
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   PAYMENTS REPORT
═══════════════════════════════════════════ */
function PaymentsReport({ data }: { data: any[] }) {
  const totalPaid    = data.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = data.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <SummaryCards cards={[
        { label: "Collected",  value: fmt(totalPaid),       color: "#4ade80" },
        { label: "Pending",    value: fmt(totalPending),    color: "#f59e0b" },
        { label: "Total",      value: String(data.length),  color: "#60a5fa" },
      ]} />
      <ReportTable
        headers={["#", "Customer", "Amount", "Method", "Type", "Status", "Date"]}
        rows={data.map((p, i) => [
          <span style={{ color: "#555", fontSize: 12 }}>{i + 1}</span>,
          <span><div style={{ fontWeight: 500, fontSize: 13 }}>{p.customerName ?? "—"}</div><div style={{ fontSize: 11, color: "#555" }}>{p.customerEmail ?? ""}</div></span>,
          <span style={{ fontWeight: 700, color: "#4ade80" }}>{fmt(p.amount)}</span>,
          <span style={{ fontSize: 12 }}>{p.method ?? "—"}</span>,
          <span style={{ fontSize: 12 }}>{p.type ?? "—"}</span>,
          <StatusBadge status={p.status} />,
          <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(p.createdAt)}</span>,
        ])}
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   INVOICES REPORT
═══════════════════════════════════════════ */
function InvoicesReport({ data }: { data: any[] }) {
  const totalPaid    = data.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalOverdue = data.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0);

  function printInvoice(inv: any) {
    openPrintWindow(`Invoice ${inv.invoiceNumber}`, `
      <div style="display:flex;gap:40px;margin-bottom:24px;">
        <div style="flex:1"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px">Bill To</div>
          <div style="font-weight:600">${inv.customerName ?? "—"}</div>
          <div style="color:#666;font-size:11px">${inv.customerEmail ?? ""}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px">Invoice Details</div>
          <div style="display:flex;justify-content:space-between"><span>Invoice #</span><strong>${inv.invoiceNumber}</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Issue Date</span><span>${fmtDate(inv.createdAt)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Due Date</span><span>${fmtDate(inv.dueDate)}</span></div>
          ${inv.paidAt ? `<div style="display:flex;justify-content:space-between"><span>Paid At</span><span>${fmtDate(inv.paidAt)}</span></div>` : ""}
          <div style="display:flex;justify-content:space-between;margin-top:4px"><span>Status</span><strong style="text-transform:capitalize">${inv.status}</strong></div>
        </div>
      </div>
      <table>
        <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
        <tr><td>Service subtotal</td><td style="text-align:right">$${Number(inv.subtotal).toFixed(2)}</td></tr>
        <tr><td>Tax</td><td style="text-align:right">$${Number(inv.tax).toFixed(2)}</td></tr>
        <tr><td style="font-weight:700;border-top:2px solid #e02020;padding-top:8px">Total</td><td style="text-align:right;font-weight:700;color:#e02020;border-top:2px solid #e02020;padding-top:8px">$${Number(inv.total).toFixed(2)}</td></tr>
      </table>
      ${inv.notes ? `<div style="margin-top:18px;padding:12px;background:#f9fafb;border-radius:6px;font-size:11px;color:#555"><strong>Notes:</strong> ${inv.notes}</div>` : ""}
    `);
  }

  return (
    <>
      <SummaryCards cards={[
        { label: "Collected",   value: fmt(totalPaid),      color: "#4ade80" },
        { label: "Overdue",     value: fmt(totalOverdue),   color: "#f87171" },
        { label: "Total",       value: String(data.length), color: "#60a5fa" },
      ]} />
      <ReportTable
        headers={["#", "Invoice #", "Customer", "Subtotal", "Tax", "Total", "Status", "Due", "Print"]}
        rows={data.map((inv, i) => [
          <span style={{ color: "#555", fontSize: 12 }}>{i + 1}</span>,
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{inv.invoiceNumber}</span>,
          <span><div style={{ fontWeight: 500, fontSize: 13 }}>{inv.customerName ?? "—"}</div><div style={{ fontSize: 11, color: "#555" }}>{inv.customerEmail ?? ""}</div></span>,
          fmt(inv.subtotal),
          fmt(inv.tax),
          <span style={{ fontWeight: 700, color: "#4ade80" }}>{fmt(inv.total)}</span>,
          <StatusBadge status={inv.status} />,
          <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(inv.dueDate)}</span>,
          <PrintBtn onClick={() => printInvoice(inv)} />,
        ])}
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   APPOINTMENTS REPORT
═══════════════════════════════════════════ */
function AppointmentsReport({ data }: { data: any[] }) {
  return (
    <>
      <SummaryCards cards={[
        { label: "Completed",  value: String(data.filter(a => a.status === "completed").length), color: "#4ade80" },
        { label: "Pending",    value: String(data.filter(a => a.status === "pending").length),   color: "#f59e0b" },
        { label: "Cancelled",  value: String(data.filter(a => a.status === "cancelled").length), color: "#f87171" },
        { label: "Total",      value: String(data.length),                                       color: "#60a5fa" },
      ]} />
      <ReportTable
        headers={["#", "Customer", "Service", "Mechanic", "Status", "Scheduled", "Created"]}
        rows={data.map((a, i) => [
          <span style={{ color: "#555", fontSize: 12 }}>{i + 1}</span>,
          <span><div style={{ fontWeight: 500, fontSize: 13 }}>{a.customerName ?? "—"}</div><div style={{ fontSize: 11, color: "#555" }}>{a.customerEmail ?? ""}</div></span>,
          <span style={{ fontSize: 12 }}>{a.serviceName ?? "—"}</span>,
          <span style={{ fontSize: 12 }}>{a.mechanicName ?? "—"}</span>,
          <StatusBadge status={a.status} />,
          <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(a.scheduledAt)}</span>,
          <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(a.createdAt)}</span>,
        ])}
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════ */
function SummaryCards({ cards }: { cards: { label: string; value: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", minWidth: 120 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) {
    return (
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "48px 24px", textAlign: "center", color: "#444" }}>
        No data for selected filters.
      </div>
    );
  }
  return (
    <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#555", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "10px 14px", fontSize: 13, color: "#ccc", verticalAlign: "middle" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrintBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(224,32,32,0.08)", border: "1px solid rgba(224,32,32,0.2)", borderRadius: 6, color: "#e02020", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
      <Printer size={11} /> Print
    </button>
  );
}

const badgeColors: Record<string, { bg: string; color: string }> = {
  available:  { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  paid:       { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  completed:  { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  excellent:  { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  active:     { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  sent:       { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  confirmed:  { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  good:       { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  customer:   { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  pending:    { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  reserved:   { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  fair:       { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  draft:      { bg: "rgba(255,255,255,0.06)", color: "#888" },
  overdue:    { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  failed:     { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  cancelled:  { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  sold:       { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  refunded:   { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  admin:      { bg: "rgba(224,32,32,0.12)",   color: "#e02020" },
  mechanic:   { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  dispatcher: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
};

function StatusBadge({ status }: { status: string }) {
  const c = badgeColors[status] ?? { bg: "rgba(255,255,255,0.06)", color: "#888" };
  return (
    <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}
