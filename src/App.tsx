import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type Dashboard as DashboardData, type Dispatch, type Inspection, type Lot, type Movement, type Product, type ProductionOrder, type PurchaseOrder, type Traceability as TraceabilityData, type Warehouse } from "./api";

type Screen =
  | "inicio"
  | "compras"
  | "resumen"
  | "productos"
  | "lotes"
  | "movimiento"
  | "produccion"
  | "calidad"
  | "trazabilidad"
  | "despachos"
  | "configuracion";
type IconName =
  | "home"
  | "cart"
  | "boxes"
  | "factory"
  | "check"
  | "route"
  | "truck"
  | "settings"
  | "search"
  | "plus"
  | "bell"
  | "chevron"
  | "arrowUp"
  | "arrowDown"
  | "package"
  | "clock"
  | "alert"
  | "scan"
  | "filter"
  | "download"
  | "calendar"
  | "warehouse"
  | "user"
  | "menu"
  | "x";

type InventoryData = {
  products: Product[];
  lots: Lot[];
  movements: Movement[];
  purchaseOrders: PurchaseOrder[];
  productionOrders: ProductionOrder[];
  inspections: Inspection[];
  dispatches: Dispatch[];
  warehouses: Warehouse[];
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const InventoryContext = createContext<InventoryData | null>(null);

function InventoryProvider({ children }: { children: ReactNode }) {
  const [productData, setProductData] = useState<Product[]>([]);
  const [lotData, setLotData] = useState<Lot[]>([]);
  const [movementData, setMovementData] = useState<Movement[]>([]);
  const [purchaseOrderData, setPurchaseOrderData] = useState<PurchaseOrder[]>([]);
  const [productionOrderData, setProductionOrderData] = useState<ProductionOrder[]>([]);
  const [inspectionData, setInspectionData] = useState<Inspection[]>([]);
  const [dispatchData, setDispatchData] = useState<Dispatch[]>([]);
  const [warehouseData, setWarehouseData] = useState<Warehouse[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [nextProducts, nextLots, nextMovements, nextPurchases, nextProduction, nextInspections, nextDispatches, nextWarehouses, nextDashboard] = await Promise.all([api.products(), api.lots(), api.movements(), api.purchaseOrders(), api.productionOrders(), api.inspections(), api.dispatches(), api.warehouses(), api.dashboard()]);
      setProductData(nextProducts);
      setLotData(nextLots);
      setMovementData(nextMovements);
      setPurchaseOrderData(nextPurchases);
      setProductionOrderData(nextProduction);
      setInspectionData(nextInspections);
      setDispatchData(nextDispatches);
      setWarehouseData(nextWarehouses);
      setDashboardData(nextDashboard);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);
  return <InventoryContext.Provider value={{ products: productData, lots: lotData, movements: movementData, purchaseOrders: purchaseOrderData, productionOrders: productionOrderData, inspections: inspectionData, dispatches: dispatchData, warehouses: warehouseData, dashboard: dashboardData, loading, error, refresh }}>{children}</InventoryContext.Provider>;
}

function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory debe usarse dentro de InventoryProvider.");
  return context;
}

const navItems: { label: string; icon: IconName; key?: Screen }[] = [
  { label: "Inicio", icon: "home", key: "inicio" },
  { label: "Compras y recepción", icon: "cart", key: "compras" },
  { label: "Inventario", icon: "boxes", key: "resumen" },
  { label: "Producción", icon: "factory", key: "produccion" },
  { label: "Control de calidad", icon: "check", key: "calidad" },
  { label: "Trazabilidad", icon: "route", key: "trazabilidad" },
  { label: "Despachos", icon: "truck", key: "despachos" },
  { label: "Configuración", icon: "settings", key: "configuracion" },
];

const screenTitles: Record<Screen, { title: string; subtitle: string }> = {
  inicio: { title: "Inicio", subtitle: "Resumen operativo del ERP y accesos rápidos" },
  compras: { title: "Compras y recepción", subtitle: "Órdenes de compra y recepción de insumos" },
  resumen: { title: "Resumen de inventario", subtitle: "Visión general de existencias, alertas y movimientos" },
  productos: { title: "Catálogo de productos", subtitle: "Administración de datos maestros de productos" },
  lotes: { title: "Existencias por lote", subtitle: "Consulta de cantidades, ubicaciones, vencimientos y calidad" },
  movimiento: { title: "Registrar movimiento", subtitle: "Registro de transacciones de inventario y almacenes" },
  produccion: { title: "Producción", subtitle: "Planificación y seguimiento de órdenes de producción" },
  calidad: { title: "Control de calidad", subtitle: "Inspección, liberación y retención de lotes" },
  trazabilidad: { title: "Consultar trazabilidad", subtitle: "Seguimiento integral del producto por código de lote" },
  despachos: { title: "Despachos", subtitle: "Preparación, validación y salida de pedidos" },
  configuracion: { title: "Configuración", subtitle: "Almacenes, usuarios y reglas operativas" },
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" /></>,
    cart: <><path d="M3 4h2l2.2 10h10.6l2-7H6" /><circle cx="9" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></>,
    boxes: <><path d="m12 2.8 7.5 4.3v9.8L12 21.2l-7.5-4.3V7.1Z" /><path d="m4.8 7.3 7.2 4.2 7.2-4.2M12 11.5v9.2M8 5l7.3 4.2" /></>,
    factory: <><path d="M3 21V10l6 3V9l6 4V4h6v17Z" /><path d="M7 17h1m4 0h1m4 0h1" /></>,
    check: <><path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    route: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18h2a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3" /></>,
    truck: <><path d="M3 5h11v12H3Z" /><path d="M14 9h4l3 4v4h-7Z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    arrowUp: <><path d="m12 19V5m-5 5 5-5 5 5" /></>,
    arrowDown: <><path d="M12 5v14m-5-5 5 5 5-5" /></>,
    package: <><path d="m4 7 8-4 8 4v10l-8 4-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
    alert: <><path d="M10.3 4.2 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    scan: <><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" /><path d="M8 9v6m3-6v6m3-6v6m3-6v6" /></>,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8Z" />,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 20h16" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18" /></>,
    warehouse: <><path d="m3 10 9-6 9 6v11H3Z" /><path d="M7 21v-7h10v7M7 17h10" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} {...common}>{paths[name]}</svg>;
}

function Button({ children, variant = "primary", icon, onClick, type = "button", disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost"; icon?: IconName; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  const styles = variant === "primary" ? "bg-[#174B3A] text-white hover:bg-[#103b2d] shadow-sm" : variant === "secondary" ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "text-slate-600 hover:bg-slate-100";
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${styles} disabled:cursor-not-allowed disabled:opacity-45`}>{icon && <Icon name={icon} size={17} />}{children}</button>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-slate-700">{label}{children}{hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}</label>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value?: string; onChange?: (value: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />;
}

function Select({ children, value, onChange }: { children: ReactNode; value?: string; onChange?: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange?.(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">{children}</select>;
}

function Status({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "slate" | "blue" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", amber: "bg-amber-50 text-amber-700 ring-amber-600/20", red: "bg-red-50 text-red-700 ring-red-600/15", slate: "bg-slate-100 text-slate-600 ring-slate-500/10", blue: "bg-blue-50 text-blue-700 ring-blue-600/15" };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

function SearchBox({ value, onChange, placeholder = "Buscar..." }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="relative block min-w-0 flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" size={17} /></span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>;
}

function AppShell({ screen, setScreen, onTraceabilityLot, children }: { screen: Screen; setScreen: (screen: Screen) => void; onTraceabilityLot: (code: string) => void; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const inventoryScreens: Screen[] = ["resumen", "productos", "lotes", "movimiento"];
  const navigate = (next: Screen) => { setScreen(next); setMobileOpen(false); };
  return <div className="min-h-screen bg-[#F5F7F8] text-slate-900">
    {mobileOpen && <button aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#123B31] text-white shadow-xl transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-[#174B3A]">PA</div>
        <div><div className="text-base font-bold tracking-tight">PIL Andina S.A.</div><div className="text-xs text-emerald-100/65">ERP SaaS · Prototipo</div></div>
        <button aria-label="Cerrar menú" className="ml-auto text-white/70 lg:hidden" onClick={() => setMobileOpen(false)}><Icon name="x" /></button>
      </div>
      <div className="px-4 pt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100/45">Módulos</div>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = item.label === "Inventario" ? inventoryScreens.includes(screen) : item.key === screen;
          return <button key={item.label} onClick={() => item.key && navigate(item.key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active ? "bg-white/12 font-semibold text-white" : "text-emerald-50/70 hover:bg-white/7 hover:text-white"}`}>
            <Icon name={item.icon} size={18} /><span className="flex-1">{item.label}</span>{item.label === "Inventario" && <Icon name="chevron" size={15} />}
          </button>;
        })}
      </nav>
      <div className="mx-3 mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">MF</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">María Flores</div><div className="truncate text-xs text-emerald-100/55">Responsable de almacén</div></div></div>
      </div>
    </aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex h-20 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button aria-label="Abrir menú" className="mr-3 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)}><Icon name="menu" size={22} /></button>
        <div className="min-w-0 flex-1"><div className="truncate text-xl font-bold tracking-tight text-slate-900">{screenTitles[screen].title}</div><div className="hidden truncate text-sm text-slate-500 sm:block">{screenTitles[screen].subtitle}</div></div>
        <div className="mr-3 hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Datos de demostración</div>
        <button aria-label="Notificaciones" className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Icon name="bell" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /></button>
      </header>
      <main className="p-4 sm:p-6 lg:p-8">
        {inventoryScreens.includes(screen) && <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {[
            ["resumen", "Resumen"],
            ["productos", "Productos"],
            ["lotes", "Existencias por lote"],
            ["movimiento", "Registrar movimiento"],
          ].map(([key, label]) => <button key={key} onClick={() => navigate(key as Screen)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${screen === key ? "bg-[#174B3A] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>{label}</button>)}
        </div>}
        {children}
      </main>
    </div>
  </div>;
}

function StatCard({ label, value, detail, icon, tone, onClick }: { label: string; value: string; detail: string; icon: IconName; tone: "green" | "amber" | "red" | "blue"; onClick?: () => void }) {
  const colors = { green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", blue: "bg-blue-50 text-blue-700" };
  const content = <><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[tone]}`}><Icon name={icon} size={20} /></div><span className="text-xs font-semibold text-slate-400">Actualizado hoy</span></div><div className="mt-5 text-3xl font-bold tracking-tight">{value}</div><div className="mt-1 text-sm font-semibold text-slate-700">{label}</div><div className={`mt-3 text-xs font-medium ${tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-500"}`}>{detail}</div>{onClick && <div className="mt-3 text-xs font-semibold text-emerald-700">Ver detalle <Icon name="chevron" size={13} /></div>}</>;
  return onClick ? <button type="button" onClick={onClick} className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-200">{content}</button> : <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{content}</div>;
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><div className="font-bold text-slate-900">{title}</div>{subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}</div>{action}</div>{children}</section>;
}

function Dashboard({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const { movements: liveMovements, dashboard, lots: liveLots } = useInventory();
  const metrics = dashboard ?? { stock: 0, lowStock: 0, expiring: 0, movementsToday: 0, blocked: 0, products: 0, policies: { inventory: "Perpetuo", rotation: "FEFO / FIFO", traceability: "Por lote", qualityGate: "Bloqueo por calidad" } };
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Unidades disponibles" value={metrics.stock.toLocaleString("es-BO")} detail={`${metrics.products} productos · inventario perpetuo`} icon="package" tone="green" onClick={() => setScreen("lotes")} />
      <StatCard label="Productos con stock bajo" value={String(metrics.lowStock)} detail="Según punto de reorden" icon="arrowDown" tone="red" onClick={() => setScreen("productos")} />
      <StatCard label="Lotes próximos a vencer" value={String(metrics.expiring)} detail="FEFO · 30 días o menos" icon="clock" tone="amber" onClick={() => setScreen("lotes")} />
      <StatCard label="Movimientos del día" value={String(metrics.movementsToday)} detail={`${metrics.blocked} lotes bloqueados por calidad o vencimiento`} icon="arrowUp" tone="blue" onClick={() => setScreen("movimiento")} />
    </div>
    <Card title="Control de operación" subtitle="Indicadores definidos en el Informe Final.pdf"><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">{[[metrics.policies.inventory, "Modelo de inventario"], [metrics.policies.rotation, "Rotación física"], [metrics.policies.traceability, "Trazabilidad"], [metrics.policies.qualityGate, "Puerta de calidad"]].map(([value, label]) => <div key={label} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><div className="text-sm font-bold text-emerald-900">{value}</div><div className="mt-1 text-xs text-emerald-700">{label}</div></div>)}</div></Card>
    <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
      <Card title="Alertas prioritarias" subtitle="Calculadas desde existencias y calidad">
        <div className="divide-y divide-slate-100">
          {liveLots.filter((lot) => lot.quality !== "Liberado").slice(0, 3).map((lot) => <button key={lot.code} onClick={() => setScreen("lotes")} className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Icon name="alert" size={18} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">Lote bloqueado: {lot.code}</span><span className="mt-1 block text-xs text-slate-500">{lot.product} · estado {lot.quality}</span></span><Icon name="chevron" size={16} /></button>)}
          {!liveLots.some((lot) => lot.quality !== "Liberado") && <div className="p-4 text-sm text-slate-500">No hay alertas de calidad activas.</div>}
        </div>
      </Card>
      <Card title="Últimos movimientos" subtitle="Actividad reciente" action={<Button variant="ghost" onClick={() => setScreen("movimiento")}>Ver historial <Icon name="chevron" size={15} /></Button>}>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-semibold">Hora</th><th className="px-4 py-3 font-semibold">Movimiento</th><th className="px-4 py-3 font-semibold">Producto / lote</th><th className="px-4 py-3 font-semibold">Cantidad</th></tr></thead><tbody className="divide-y divide-slate-100">{liveMovements.map((movement) => <tr key={movement.id ?? movement.time + movement.lot} className="hover:bg-slate-50/70"><td className="px-5 py-4 text-slate-500">{movement.time ?? "Reciente"}</td><td className="px-4 py-4"><Status tone={movement.type.includes("Reten") ? "amber" : movement.type.includes("Salida") ? "blue" : "green"}>{movement.type}</Status></td><td className="px-4 py-4"><div className="font-medium text-slate-800">{movement.product}</div><div className="mt-0.5 text-xs text-slate-400">{movement.lot}</div></td><td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">{movement.quantity}</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  </div>;
}

function Products() {
  const { products: liveProducts, refresh } = useInventory();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const filtered = liveProducts.filter((product) => `${product.code} ${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm font-semibold text-slate-700">Datos maestros</div><div className="text-xs text-slate-500">{liveProducts.length} productos registrados</div></div><Button icon="plus" onClick={() => setModal(true)}>Nuevo producto</Button></div>
    <Card title="Productos" subtitle="Información base utilizada en lotes y movimientos">
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><SearchBox value={query} onChange={setQuery} placeholder="Buscar por código, nombre o categoría" /><Button variant="secondary" icon="filter">Filtrar</Button><Button variant="secondary" icon="download">Exportar</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{["Código", "Nombre del producto", "Categoría", "Unidad", "Existencia", "Estado", ""].map((item) => <th key={item} className="whitespace-nowrap px-5 py-3 font-semibold">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((product) => <tr key={product.code} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-mono text-xs font-semibold text-emerald-700">{product.code}</td><td className="px-5 py-4 font-semibold text-slate-800">{product.name}</td><td className="px-5 py-4 text-slate-600">{product.category}</td><td className="px-5 py-4 text-slate-600">{product.unit}</td><td className="px-5 py-4 font-semibold">{product.stock.toLocaleString("es-BO")}</td><td className="px-5 py-4"><Status tone={product.status === "Activo" ? "green" : "slate"}>{product.status}</Status></td><td className="px-5 py-4 text-right"><Button variant="ghost">Editar</Button></td></tr>)}</tbody></table></div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>Mostrando {filtered.length} de {liveProducts.length} productos</span><span>Página 1 de 1</span></div>
    </Card>
    {modal && <ProductModal onClose={() => setModal(false)} onSaved={async () => { setModal(false); await refresh(); }} />}
  </div>;
}

function ProductModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ code: "", name: "", category: "Leches", unit: "Unidad" });
  const [error, setError] = useState<string | null>(null);
  const save = async () => { try { await api.createProduct(form); await onSaved(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No se pudo guardar."); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="text-xl font-bold">Nuevo producto</div><div className="mt-1 text-sm text-slate-500">Crear un registro en el catálogo maestro</div></div><button aria-label="Cerrar" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Icon name="x" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Código"><Input value={form.code} onChange={(value) => setForm({ ...form, code: value })} placeholder="Ej. YOG-015" /></Field><Field label="Nombre"><Input value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Nombre comercial" /></Field><Field label="Categoría"><Select value={form.category} onChange={(value) => setForm({ ...form, category: value })}><option>Leches</option><option>Yogures</option><option>Quesos</option><option>Mantequillas</option></Select></Field><Field label="Unidad de medida"><Select value={form.unit} onChange={(value) => setForm({ ...form, unit: value })}><option>Unidad</option><option>Kilogramo</option><option>Litro</option></Select></Field></div>{error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={() => void save()}>Guardar producto</Button></div></div></div>;
}

function Lots({ setScreen, onTraceabilityLot }: { setScreen: (screen: Screen) => void; onTraceabilityLot: (code: string) => void }) {
  const { lots: liveLots, products, warehouses, refresh } = useInventory();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ productCode: "", code: "", quantity: "1", warehouse: "", expiry: "" });
  const filtered = liveLots.filter((lot) => `${lot.product} ${lot.productCode} ${lot.code} ${lot.warehouse}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!form.productCode && products.length) setForm((current) => ({ ...current, productCode: products.find((item) => item.status === "Activo")?.code ?? products[0].code }));
    if (!form.warehouse && warehouses.length) setForm((current) => ({ ...current, warehouse: warehouses[0].name }));
    if (!form.expiry) { const date = new Date(); date.setDate(date.getDate() + 30); setForm((current) => ({ ...current, expiry: date.toISOString().slice(0, 10) })); }
  }, [products, warehouses, form.productCode, form.warehouse, form.expiry]);
  const save = async () => {
    try {
      setError(null);
      await api.createLot({ ...form, quantity: Number(form.quantity) });
      setCreating(false);
      setForm((current) => ({ ...current, code: "", quantity: "1" }));
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo crear el lote.");
    }
  };
  return <div className="space-y-5">
    {creating && <Card title="Crear lote por recepción o producción" subtitle="El lote queda pendiente de calidad y registra automáticamente su ingreso inicial."><div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5"><Field label="Producto *"><Select value={form.productCode} onChange={(value) => setForm({ ...form, productCode: value })}>{products.filter((item) => item.status === "Activo").map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</Select></Field><Field label="Código de lote *" hint="Ej. YGF-261022-A"><Input value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} placeholder="AAA-YYMMDD-X" /></Field><Field label="Cantidad *"><Input type="number" min="0.01" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} /></Field><Field label="Almacén *"><Select value={form.warehouse} onChange={(value) => setForm({ ...form, warehouse: value })}>{warehouses.filter((item) => item.status === "Activo").map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</Select></Field><Field label="Vencimiento *"><Input type="date" value={form.expiry} onChange={(value) => setForm({ ...form, expiry: value })} /></Field></div>{error && <div className="mx-5 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-3 px-5 pb-5"><Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button><Button onClick={() => void save()}>Crear lote</Button></div></Card>}
    <Card title="Inventario disponible" subtitle="Datos transaccionales agrupados por lote" action={<Button icon="plus" onClick={() => setCreating(true)}>Nuevo lote</Button>}>
    <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><SearchBox value={query} onChange={setQuery} placeholder="Buscar producto, lote o almacén" /><Button variant="secondary" icon="warehouse">Todos los almacenes</Button><Button variant="secondary" icon="filter">Calidad y vencimiento</Button></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{["Producto", "Código de lote", "Disponible", "Almacén", "Vencimiento", "Estado de calidad", ""].map((item) => <th key={item} className="whitespace-nowrap px-5 py-3 font-semibold">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((lot) => <tr key={lot.code} className={lot.quality === "Retenido" || lot.expiryNote.startsWith("Vence") ? "bg-amber-50/30" : "hover:bg-slate-50/70"}><td className="px-5 py-4"><div className="font-semibold text-slate-800">{lot.product}</div><div className="mt-0.5 text-xs text-slate-400">{lot.productCode}</div></td><td className="px-5 py-4"><button onClick={() => { onTraceabilityLot(lot.code); setScreen("trazabilidad"); }} className="font-mono text-xs font-bold text-emerald-700 hover:underline">{lot.code}</button></td><td className="px-5 py-4 font-bold text-slate-800">{lot.quantity}</td><td className="px-5 py-4 text-slate-600">{lot.warehouse}</td><td className="px-5 py-4"><div className="font-medium text-slate-700">{lot.expiry}</div><div className={`mt-0.5 text-xs font-semibold ${lot.expiryNote !== "Vigente" ? "text-amber-600" : "text-slate-400"}`}>{lot.expiryNote}</div></td><td className="px-5 py-4"><Status tone={lot.quality === "Liberado" ? "green" : "amber"}>{lot.quality}</Status></td><td className="px-5 py-4"><button aria-label={`Consultar trazabilidad de ${lot.code}`} onClick={() => { onTraceabilityLot(lot.code); setScreen("trazabilidad"); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Icon name="scan" /></button></td></tr>)}</tbody></table></div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>{filtered.length} lotes · 4 almacenes</span><span className="flex items-center gap-2"><Icon name="scan" size={15} />Identificación disponible mediante QR / RFID</span></div>
  </Card></div>;
}

function Movement() {
  const { products: liveProducts, lots: liveLots, refresh } = useInventory();
  const [type, setType] = useState("Transferencia interna");
  const [product, setProduct] = useState("");
  const [lot, setLot] = useState("");
  const [quantity, setQuantity] = useState("48");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedLot = liveLots.find((item) => item.code === lot);
  const isExpired = selectedLot ? selectedLot.expiryDate < new Date().toISOString().slice(0, 10) : false;
  const blocked = type === "Salida por despacho" && (selectedLot?.quality !== "Liberado" || isExpired);
  useEffect(() => {
    if (!product && liveProducts.length) {
      const firstProduct = liveProducts.find((item) => item.status === "Activo" && liveLots.some((lotItem) => lotItem.productCode === item.code && Number(lotItem.quantity.replace(/\./g, "").replace(",", ".")) > 0));
      setProduct(firstProduct?.name ?? liveProducts.find((item) => item.status === "Activo")?.name ?? "");
    }
    const productLots = liveLots.filter((item) => item.product === product && Number(item.quantity.replace(/\./g, "").replace(",", ".")) > 0).sort((first, second) => first.expiryDate.localeCompare(second.expiryDate));
    if (!lot || !productLots.some((item) => item.code === lot)) setLot(productLots[0]?.code ?? "");
  }, [liveProducts, liveLots, product, lot]);
  return <div className="grid gap-6 xl:grid-cols-[1.5fr_0.75fr]">
    <Card title="Datos del movimiento" subtitle="Los campos marcados son obligatorios">
      <form className="p-5" onSubmit={(event) => { event.preventDefault(); if (blocked) return; void api.createMovement({ type, lotCode: lot, quantity: Number(quantity), origin: "Cámara fría 01", destination: "Producto terminado", responsible: "María Flores" }).then(async () => { setSubmitted(true); setError(null); await refresh(); }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "No se pudo registrar el movimiento.")); }}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tipo de movimiento *"><Select value={type} onChange={setType}><option>Ingreso desde producción</option><option>Transferencia interna</option><option>Salida por despacho</option><option>Ajuste de inventario</option></Select></Field>
          <Field label="Fecha y hora *"><Input type="datetime-local" value="2025-03-12T11:20" /></Field>
          <Field label="Producto *"><Select value={product} onChange={setProduct}>{liveProducts.filter((item) => item.status === "Activo").map((item) => <option key={item.code}>{item.name}</option>)}</Select></Field>
          <Field label="Lote *" hint="FEFO: se preselecciona el lote con vencimiento más próximo"><Select value={lot} onChange={setLot}>{liveLots.filter((item) => item.product === product && Number(item.quantity.replace(/\./g, "").replace(",", ".")) > 0).sort((first, second) => first.expiryDate.localeCompare(second.expiryDate)).map((item, index) => <option key={item.code} value={item.code}>{item.code} · vence {item.expiry}{index === 0 ? " · FEFO" : ""}</option>)}</Select></Field>
          <Field label="Cantidad *" hint={`Disponible: ${selectedLot?.quantity ?? "se validará"}`}><Input type="number" value={quantity} onChange={setQuantity} /></Field>
          <Field label="Unidad de medida"><Input value={product.includes("Queso") ? "Kilogramo" : "Unidad"} /></Field>
          <Field label="Ubicación de origen *"><Select><option>Cámara fría 01</option><option>Cámara fría 02</option><option>Producción</option><option>Producto terminado</option></Select></Field>
          <Field label="Ubicación de destino *"><Select><option>Producto terminado</option><option>Cámara fría 02</option><option>Despacho</option><option>Control de calidad</option></Select></Field>
          <Field label="Responsable *"><Select><option>María Flores</option><option>Carlos Rojas</option><option>Jorge Peña</option></Select></Field>
          <Field label="Identificación"><div className="flex gap-2"><div className="flex h-11 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">Lectura QR / RFID</div><Button variant="secondary" icon="scan">Escanear</Button></div></Field>
        </div>
        {selectedLot?.expiryNote !== "Vigente" && <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800"><Icon name="clock" /><div><div className="text-sm font-bold">Alerta FEFO: vencimiento próximo</div><div className="mt-1 text-xs leading-relaxed">El lote {lot} {selectedLot?.expiryNote?.toLowerCase()}. Prioriza su uso según FEFO.</div></div></div>}
        {blocked && <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><Icon name="alert" /><div><div className="text-sm font-bold">Despacho bloqueado por calidad o vencimiento</div><div className="mt-1 text-xs leading-relaxed">El lote {lot} {isExpired ? "está vencido" : `está en estado ${selectedLot?.quality}`}. No se puede registrar una salida.</div></div></div>}
        {submitted && <div className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><Icon name="check" /><div><div className="text-sm font-bold">Movimiento registrado</div><div className="mt-1 text-xs">La transacción quedó guardada en SQLite y actualizó la existencia del lote.</div></div></div>}
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5"><Button variant="secondary">Cancelar</Button><Button type="submit" disabled={blocked}>Registrar movimiento</Button></div>
      </form>
    </Card>
    <div className="space-y-5">
      <Card title="Resumen de selección"><div className="space-y-4 p-5 text-sm"><div><div className="text-xs text-slate-400">Producto</div><div className="mt-1 font-semibold">{product || "Selecciona un producto"}</div></div><div><div className="text-xs text-slate-400">Lote</div><div className="mt-1 font-mono font-bold text-emerald-700">{lot || "Selecciona un lote"}</div></div><div><div className="text-xs text-slate-400">Estado de calidad</div><div className="mt-2"><Status tone={selectedLot?.quality === "Liberado" ? "green" : "amber"}>{selectedLot?.quality ?? "Pendiente de selección"}</Status></div></div></div></Card>
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5"><div className="flex gap-3 text-blue-800"><Icon name="scan" /><div><div className="text-sm font-bold">Registro con QR / RFID</div><div className="mt-1 text-xs leading-relaxed text-blue-700">Escanee la etiqueta para completar producto y lote, reducir errores y registrar el evento de trazabilidad.</div></div></div></div>
    </div>
  </div>;
}

function Traceability({ lotCode }: { lotCode: string }) {
  const { lots: liveLots } = useInventory();
  const [query, setQuery] = useState(lotCode);
  const [searched, setSearched] = useState(false);
  const [trace, setTrace] = useState<TraceabilityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (lotCode) { setQuery(lotCode); void searchLot(lotCode); } }, [lotCode]);
  async function searchLot(code: string) {
    try {
      setError(null);
      setTrace(await api.traceability(code.trim()));
      setSearched(true);
    } catch (requestError) {
      setTrace(null);
      setSearched(true);
      setError(requestError instanceof Error ? requestError.message : "No se pudo consultar la trazabilidad.");
    }
  }
  const search = async () => {
    const code = query.trim();
    if (!code) { setError("Ingresa un código de lote."); return; }
    await searchLot(code);
  };
  const selectedLot = trace?.lot ?? liveLots.find((item) => item.code.toLowerCase() === query.toLowerCase());
  return <div className="space-y-6">
    <Card title="Buscar lote" subtitle="Ingrese o escanee una identificación para consultar su historial">
      <div className="flex flex-wrap gap-3 p-5"><SearchBox value={query} onChange={(value) => { setQuery(value); setError(null); }} placeholder="Ej. QED-250228-A" /><Button variant="secondary" icon="scan">Escanear QR / RFID</Button><Button icon="search" onClick={() => void search()}>Consultar</Button></div>
    </Card>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {searched && selectedLot && <div className="grid gap-6 xl:grid-cols-[0.7fr_1.5fr]">
      <div className="space-y-5">
        <Card title="Información del lote"><div className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-lg font-extrabold text-emerald-700">{selectedLot.lot}</div><div className="mt-1 text-sm font-semibold">{selectedLot.product}</div></div><Status tone={selectedLot.quality === "Liberado" ? "green" : "amber"}>{selectedLot.quality}</Status></div><dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 text-sm"><div><dt className="text-xs text-slate-400">Código</dt><dd className="mt-1 font-semibold">{selectedLot.productCode}</dd></div><div><dt className="text-xs text-slate-400">Cantidad</dt><dd className="mt-1 font-semibold">{selectedLot.quantity}</dd></div><div><dt className="text-xs text-slate-400">Almacén actual</dt><dd className="mt-1 font-semibold">{selectedLot.warehouse}</dd></div><div><dt className="text-xs text-slate-400">Vencimiento</dt><dd className="mt-1 font-semibold">{selectedLot.expiry}</dd></div></dl></div></Card>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5"><div className="flex gap-3 text-red-800"><Icon name="alert" /><div><div className="text-sm font-bold">Restricción activa</div><div className="mt-1 text-xs leading-relaxed">No se permite despachar este lote mientras mantenga el estado Retenido, salvo autorización registrada.</div></div></div></div>
      </div>
      <Card title="Cronología del lote" subtitle="Historial de eventos desde la recepción hasta el despacho" action={<Button variant="secondary" icon="download">Exportar historial</Button>}>
        <div className="p-5 sm:p-6">{trace?.events.length ? trace.events.map((item, index) => <div key={`${item.stage}-${item.eventDate}-${index}`} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-white shadow-sm"><Icon name="check" size={15} /></div>{index < trace.events.length - 1 && <div className="absolute bottom-0 left-[17px] top-8 w-0.5 bg-slate-200" />}<div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="font-bold text-slate-800">{item.stage}</div><div className="text-xs font-semibold text-slate-500">{item.eventDate}</div></div><div className="mt-2 text-sm text-slate-600">{item.detail}</div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400"><span className="flex items-center gap-1.5"><Icon name="warehouse" size={14} />{item.place}</span><span className="flex items-center gap-1.5"><Icon name="user" size={14} />{item.user}</span></div></div></div>) : <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">El lote existe, pero todavía no tiene eventos registrados.</div>}</div>
      </Card>
    </div>}
    {!searched && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Escribe un código de lote, por ejemplo QED-250228-A, y presiona Consultar.</div>}
  </div>;
}

function Home({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const { dashboard, purchaseOrders, productionOrders, inspections, dispatches, lots, products, warehouses } = useInventory();
  const [warehouse, setWarehouse] = useState("Todos los almacenes");
  const [period, setPeriod] = useState("Hoy");
  const metrics = dashboard ?? { stock: 0, lowStock: 0, blocked: 0, movementsToday: 0, products: 0 };
  const parseQuantity = (value: string) => Number(value.replace(/\./g, "").replace(",", ".")) || 0;
  const scopedLots = lots.filter((lot) => warehouse === "Todos los almacenes" || lot.warehouse === warehouse);
  const stock = scopedLots.reduce((sum, lot) => sum + parseQuantity(lot.quantity), 0);
  const blocked = scopedLots.filter((lot) => lot.quality !== "Liberado").length;
  const expiring = scopedLots.filter((lot) => lot.expiryNote.startsWith("Vence en")).length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock < 1000).length;
  const stockByProduct = products.map((product) => ({ ...product, scopedStock: scopedLots.filter((lot) => lot.productCode === product.code).reduce((sum, lot) => sum + parseQuantity(lot.quantity), 0) })).filter((product) => product.scopedStock > 0).sort((a, b) => b.scopedStock - a.scopedStock).slice(0, 5);
  const maxStock = stockByProduct[0]?.scopedStock || 1;
  const pendingInspections = inspections.filter((item) => item.status === "Pendiente");
  const pendingPurchases = purchaseOrders.filter((item) => item.status !== "Recibida");
  const pendingDispatches = dispatches.filter((item) => item.status !== "Despachado");
  const exceptions = [
    ...scopedLots.filter((lot) => lot.quality !== "Liberado").map((lot) => ({ title: `Lote ${lot.code}`, detail: `${lot.product} · ${lot.quality}`, action: "Revisar calidad", screen: "calidad" as Screen, tone: "red" as const })),
    ...scopedLots.filter((lot) => lot.expiryNote !== "Vigente").map((lot) => ({ title: `Vencimiento próximo · ${lot.code}`, detail: `${lot.product} · ${lot.expiry}`, action: "Ver lote", screen: "lotes" as Screen, tone: "amber" as const })),
    ...pendingInspections.map((inspection) => ({ title: `Inspección ${inspection.lot}`, detail: inspection.test, action: "Atender", screen: "calidad" as Screen, tone: "amber" as const })),
  ].slice(0, 5);
  const kpis = [
    { label: "Unidades disponibles", value: stock.toLocaleString("es-BO"), context: "Meta: mantener stock de seguridad", detail: `${metrics.products} productos catalogados`, icon: "package" as IconName, tone: "green" as const, screen: "lotes" as Screen },
    { label: "Productos con stock bajo", value: String(lowStock), context: "Meta: 0 productos bajo reorden", detail: "Señal para abastecimiento", icon: "arrowDown" as IconName, tone: lowStock ? "red" as const : "green" as const, screen: "productos" as Screen },
    { label: "Lotes próximos a vencer", value: String(expiring), context: "FEFO: vencen en 30 días o menos", detail: `${blocked} bloqueados por calidad`, icon: "clock" as IconName, tone: expiring ? "amber" as const : "green" as const, screen: "lotes" as Screen },
    { label: "Movimientos del día", value: String(metrics.movementsToday), context: "Meta diaria: 10 movimientos", detail: `${pendingDispatches.length} despachos pendientes`, icon: "route" as IconName, tone: "blue" as const, screen: "movimiento" as Screen },
  ];
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Centro de control · COBIT 2019 / ITIL 4</div><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Visión operativa y de inventarios</h1><p className="mt-1 text-sm text-slate-500">Panorama general para decidir, priorizar excepciones y proteger la continuidad del servicio.</p></div>
      <div className="flex flex-wrap gap-2"><Select value={period} onChange={setPeriod}><option>Hoy</option><option>Últimos 7 días</option><option>Este mes</option></Select><Select value={warehouse} onChange={setWarehouse}><option>Todos los almacenes</option>{warehouses.map((item) => <option key={item.id}>{item.name}</option>)}</Select><Button variant="secondary" icon="download">Exportar</Button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{kpis.map((item) => <button key={item.label} type="button" onClick={() => setScreen(item.screen)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-200"><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone === "red" ? "bg-red-50 text-red-700" : item.tone === "amber" ? "bg-amber-50 text-amber-700" : item.tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}><Icon name={item.icon} size={18} /></div><Status tone={item.tone}>{item.tone === "green" ? "En objetivo" : item.tone === "blue" ? "En curso" : "Requiere atención"}</Status></div><div className="mt-4 text-2xl font-bold tracking-tight">{item.value}</div><div className="mt-1 text-sm font-semibold text-slate-800">{item.label}</div><div className="mt-2 text-xs text-slate-500">{item.context}</div><div className="mt-1 text-xs text-slate-400">{item.detail}</div><div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-700">Ver detalle <Icon name="chevron" size={13} /></div></button>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
      <Card title="Desempeño de inventario" subtitle={`Comparación por producto · ${period.toLowerCase()} · ${warehouse}`}>
        <div className="space-y-4 p-5">{stockByProduct.map((product) => <button key={product.code} onClick={() => setScreen("lotes")} className="group flex w-full items-center gap-3 text-left"><span className="w-32 truncate text-xs font-semibold text-slate-600">{product.name}</span><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-600 transition-all group-hover:bg-emerald-500" style={{ width: `${Math.max(7, product.scopedStock / maxStock * 100)}%` }} /></span><span className="w-20 text-right text-xs font-bold text-slate-700">{product.scopedStock.toLocaleString("es-BO")}</span></button>)}{!stockByProduct.length && <div className="py-8 text-center text-sm text-slate-500">No hay existencias para el filtro seleccionado.</div>}<div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>Longitud = magnitud relativa</span><span>Unidades</span></div></div>
      </Card>
      <Card title="Gobierno y continuidad" subtitle="Controles visibles para la toma de decisiones">
        <div className="space-y-3 p-5">{[["Alineación de inventario", "Inventario perpetuo y puntos de reorden", "check"], ["Gestión de cambios", `${productionOrders.filter((item) => item.status === "En proceso").length} órdenes en proceso`, "factory"], ["Puerta de calidad", `${blocked} lotes retenidos o no liberados`, "check"], ["Trazabilidad", "Seguimiento por lote desde recepción", "route"]].map(([label, detail, icon]) => <div key={label} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3"><span className="mt-0.5 text-emerald-700"><Icon name={icon as IconName} size={17} /></span><div><div className="text-sm font-semibold text-slate-800">{label}</div><div className="mt-0.5 text-xs text-slate-500">{detail}</div></div><Status tone="green">Controlado</Status></div>)}</div>
      </Card>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <Card title="Excepciones y prioridades" subtitle="Atender primero lo que puede afectar servicio, calidad o continuidad" action={<Button variant="ghost" onClick={() => setScreen("calidad")}>Ver todo <Icon name="chevron" size={15} /></Button>}>
        <div className="divide-y divide-slate-100">{exceptions.map((item) => <button key={`${item.title}-${item.detail}`} onClick={() => setScreen(item.screen)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.tone === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}><Icon name="alert" size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{item.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{item.detail}</span></span><span className="text-xs font-semibold text-emerald-700">{item.action}</span><Icon name="chevron" size={15} /></button>)}{!exceptions.length && <div className="p-5 text-sm text-emerald-700">No hay excepciones activas para este alcance.</div>}</div>
      </Card>
      <Card title="Cola de trabajo" subtitle="Próximas acciones operativas">
        <div className="space-y-3 p-5">{[[pendingInspections.length, "Inspecciones pendientes", "calidad"], [pendingPurchases.length, "Órdenes de compra abiertas", "compras"], [pendingDispatches.length, "Despachos por completar", "despachos"]].map(([value, label, target]) => <button key={label} onClick={() => setScreen(target as Screen)} className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-3 text-left hover:border-emerald-200 hover:bg-emerald-50/40"><span><span className="block text-xl font-bold text-slate-900">{value}</span><span className="text-xs text-slate-500">{label}</span></span><Icon name="chevron" size={16} /></button>)}</div>
      </Card>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-5 py-4"><div><div className="text-sm font-bold text-emerald-900">Acciones rápidas</div><div className="mt-1 text-xs text-emerald-700">Detalle a demanda: abre la operación solo cuando necesites actuar.</div></div><div className="flex flex-wrap gap-2"><Button variant="secondary" icon="plus" onClick={() => setScreen("movimiento")}>Registrar movimiento</Button><Button variant="secondary" icon="search" onClick={() => setScreen("trazabilidad")}>Consultar lote</Button></div></div>
  </div>;
}

function Purchases() {
  const { purchaseOrders, refresh } = useInventory();
  const [query, setQuery] = useState("");
  const [receiving, setReceiving] = useState(false);
  const [newOrder, setNewOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orders = purchaseOrders.filter((order) => `${order.code} ${order.supplier} ${order.item}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Órdenes abiertas" value={String(orders.filter((order) => order.status !== "Recibida").length)} detail="Registradas en la base de datos" icon="cart" tone="blue" /><StatCard label="Recepciones" value={String(orders.filter((order) => order.status === "Recibida").length)} detail="Órdenes completadas" icon="arrowDown" tone="green" /><StatCard label="Pendientes" value={String(orders.filter((order) => order.status === "Pendiente").length)} detail="Requieren seguimiento" icon="alert" tone="amber" /></div>
    {(receiving || newOrder) && <PurchaseForm receiving={receiving} orders={orders} onClose={() => { setReceiving(false); setNewOrder(false); }} onSaved={async () => { setReceiving(false); setNewOrder(false); await refresh(); }} onError={setError} />}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <Card title="Órdenes de compra" subtitle="Seguimiento de abastecimiento" action={<div className="flex gap-2"><Button variant="secondary" icon="arrowDown" onClick={() => setReceiving(true)}>Registrar recepción</Button><Button icon="plus" onClick={() => setNewOrder(true)}>Nuevo orden</Button></div>}><div className="flex gap-3 border-b border-slate-100 p-4"><SearchBox value={query} onChange={setQuery} placeholder="Buscar orden, proveedor o insumo" /><Button variant="secondary" icon="filter">Estado</Button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-500">{["Orden", "Proveedor", "Insumo", "Entrega", "Cantidad", "Estado"].map((label) => <th key={label} className="whitespace-nowrap px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => <tr key={order.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs font-bold text-emerald-700">{order.code}</td><td className="px-5 py-4 font-semibold">{order.supplier}</td><td className="px-5 py-4 text-slate-600">{order.item}</td><td className="px-5 py-4 text-slate-600">{order.expected_date}</td><td className="px-5 py-4 font-semibold">{order.quantity.toLocaleString("es-BO")} {order.unit}</td><td className="px-5 py-4"><Status tone={order.status === "Recibida" ? "green" : order.status === "En recepción" ? "blue" : "amber"}>{order.status}</Status></td></tr>)}</tbody></table></div></Card>
  </div>;
}

function PurchaseForm({ receiving, orders, onClose, onSaved, onError }: { receiving: boolean; orders: PurchaseOrder[]; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [form, setForm] = useState({ supplier: "", item: "", expectedDate: new Date().toISOString().slice(0, 10), quantity: "1", unit: "Unidad", purchaseOrderId: String(orders[0]?.id ?? ""), document: "", warehouse: "Almacén de insumos" });
  const submit = async () => { try { if (receiving) await api.receive({ purchaseOrderId: Number(form.purchaseOrderId), quantity: Number(form.quantity), document: form.document, warehouse: form.warehouse }); else await api.createPurchaseOrder({ supplier: form.supplier, item: form.item, expectedDate: form.expectedDate, quantity: Number(form.quantity), unit: form.unit }); await onSaved(); } catch (requestError) { onError(requestError instanceof Error ? requestError.message : "No se pudo guardar."); } };
  return <Card title={receiving ? "Registrar recepción" : "Nuevo orden de compra"} subtitle={receiving ? "Asociar ingreso a una orden" : "Crear una orden persistente"}><div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">{receiving ? <><Field label="Orden de compra"><Select value={form.purchaseOrderId} onChange={(value) => setForm({ ...form, purchaseOrderId: value })}>{orders.filter((order) => order.status !== "Recibida").map((order) => <option key={order.id} value={order.id}>{order.code} · {order.item}</option>)}</Select></Field><Field label="Cantidad recibida"><Input type="number" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} /></Field><Field label="Documento"><Input value={form.document} onChange={(value) => setForm({ ...form, document: value })} placeholder="Factura o remisión" /></Field><Field label="Ubicación"><Select value={form.warehouse} onChange={(value) => setForm({ ...form, warehouse: value })}><option>Almacén de insumos</option><option>Área de recepción</option></Select></Field></> : <><Field label="Proveedor"><Input value={form.supplier} onChange={(value) => setForm({ ...form, supplier: value })} /></Field><Field label="Insumo"><Input value={form.item} onChange={(value) => setForm({ ...form, item: value })} /></Field><Field label="Fecha esperada"><Input type="date" value={form.expectedDate} onChange={(value) => setForm({ ...form, expectedDate: value })} /></Field><Field label="Cantidad"><Input type="number" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} /></Field></>}<div className="flex gap-3 sm:col-span-2 lg:col-span-4 lg:justify-end"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={() => void submit()}>{receiving ? "Confirmar recepción" : "Crear orden"}</Button></div></div></Card>;
}

function Production() {
  const { productionOrders, products: liveProducts, refresh } = useInventory();
  const [created, setCreated] = useState(false);
  const [form, setForm] = useState({ productCode: "", quantity: "1", line: "Línea UHT 01", schedule: "06:00 - 12:00" });
  const save = async () => { await api.createProductionOrder({ ...form, productCode: form.productCode || liveProducts[0]?.code || "", quantity: Number(form.quantity) }); setCreated(false); await refresh(); };
  const update = async (order: ProductionOrder) => { await api.updateProduction(order.id, order.status === "Planificada" ? "En proceso" : "Completada"); await refresh(); };
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="text-sm text-slate-500"><span className="font-bold text-slate-800">Plan diario:</span> {productionOrders.reduce((sum, order) => sum + order.planned_quantity, 0).toLocaleString("es-BO")} unidades</div><Button icon="plus" onClick={() => setCreated(true)}>Nueva orden</Button></div>{created && <Card title="Nueva orden de producción"><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Producto"><Select value={form.productCode} onChange={(value) => setForm({ ...form, productCode: value })}>{liveProducts.filter((item) => item.status === "Activo").map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</Select></Field><Field label="Cantidad"><Input type="number" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} /></Field><Field label="Línea"><Input value={form.line} onChange={(value) => setForm({ ...form, line: value })} /></Field><Field label="Horario"><Input value={form.schedule} onChange={(value) => setForm({ ...form, schedule: value })} /></Field><div className="flex justify-end gap-3 sm:col-span-2"><Button variant="secondary" onClick={() => setCreated(false)}>Cancelar</Button><Button onClick={() => void save()}>Crear orden</Button></div></div></Card>}<div className="grid gap-4 sm:grid-cols-3"><StatCard label="Órdenes en proceso" value={String(productionOrders.filter((order) => order.status === "En proceso").length)} detail="Registradas en la base de datos" icon="factory" tone="blue" /><StatCard label="Órdenes completadas" value={String(productionOrders.filter((order) => order.status === "Completada").length)} detail="Producción finalizada" icon="check" tone="green" /><StatCard label="Planificadas" value={String(productionOrders.filter((order) => order.status === "Planificada").length)} detail="Pendientes de iniciar" icon="clock" tone="amber" /></div><Card title="Órdenes de producción" subtitle="Plan persistente"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-500">{["Orden", "Producto", "Plan", "Línea", "Horario", "Estado", ""].map((label) => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{productionOrders.map((order) => <tr key={order.id}><td className="px-5 py-4 font-mono text-xs font-bold text-emerald-700">{order.code}</td><td className="px-5 py-4 font-semibold">{order.product}</td><td className="px-5 py-4">{order.planned_quantity.toLocaleString("es-BO")}</td><td className="px-5 py-4 text-slate-600">{order.line}</td><td className="px-5 py-4 text-slate-600">{order.schedule}</td><td className="px-5 py-4"><Status tone={order.status === "Completada" ? "green" : order.status === "En proceso" ? "blue" : "slate"}>{order.status}</Status></td><td className="px-5 py-4">{order.status !== "Completada" && <Button variant="ghost" onClick={() => void update(order)}>{order.status === "Planificada" ? "Iniciar" : "Completar"}</Button>}</td></tr>)}</tbody></table></div></Card></div>;
}

function Quality() {
  const { inspections, lots: liveLots, refresh } = useInventory();
  const [newInspection, setNewInspection] = useState(false);
  const [form, setForm] = useState({ lotCode: "", test: "Microbiología", sample: "", notes: "" });
  const save = async () => { await api.createInspection({ ...form, lotCode: form.lotCode || liveLots[0]?.lot || "" }); setNewInspection(false); await refresh(); };
  const decide = async (item: Inspection, status: string) => { await api.updateInspection(item.id, status); await refresh(); };
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Muestras pendientes" value={String(inspections.filter((item) => item.status === "Pendiente").length)} detail="Requieren análisis" icon="clock" tone="amber" /><StatCard label="Lotes liberados" value={String(inspections.filter((item) => item.status === "Liberado").length)} detail="Disponibles para despacho" icon="check" tone="green" /><StatCard label="Lotes retenidos" value={String(inspections.filter((item) => item.status === "Retenido").length)} detail="Despacho bloqueado" icon="alert" tone="red" /></div>{newInspection && <Card title="Nueva inspección"><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Lote"><Select value={form.lotCode} onChange={(value) => setForm({ ...form, lotCode: value })}>{liveLots.map((lot) => <option key={lot.lot} value={lot.lot}>{lot.lot} · {lot.product}</option>)}</Select></Field><Field label="Análisis"><Input value={form.test} onChange={(value) => setForm({ ...form, test: value })} /></Field><Field label="Muestra"><Input value={form.sample} onChange={(value) => setForm({ ...form, sample: value })} placeholder="CC-0000" /></Field><Field label="Notas"><Input value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} /></Field><div className="flex justify-end gap-3 sm:col-span-2"><Button variant="secondary" onClick={() => setNewInspection(false)}>Cancelar</Button><Button onClick={() => void save()}>Crear inspección</Button></div></div></Card>}<Card title="Inspecciones de calidad" subtitle="Decisiones persistentes afectan la disponibilidad para despacho" action={<Button icon="plus" onClick={() => setNewInspection(true)}>Nueva inspección</Button>}><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-500">{["Lote", "Producto", "Análisis", "Muestra", "Estado", "Acciones"].map((label) => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{inspections.map((item) => <tr key={item.id}><td className="px-5 py-4 font-mono text-xs font-bold text-emerald-700">{item.lot}</td><td className="px-5 py-4 font-semibold">{item.product}</td><td className="px-5 py-4 text-slate-600">{item.test}</td><td className="px-5 py-4">{item.sample}</td><td className="px-5 py-4"><Status tone={item.status === "Liberado" ? "green" : item.status === "Rechazado" ? "red" : "amber"}>{item.status}</Status></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{item.status !== "Liberado" && <Button variant="ghost" onClick={() => void decide(item, "Liberado")}>Liberar</Button>}{item.status !== "Retenido" && <Button variant="ghost" onClick={() => void decide(item, "Retenido")}>Retener</Button>}{item.status !== "Rechazado" && <Button variant="ghost" onClick={() => void decide(item, "Rechazado")}>Rechazar</Button>}</div></td></tr>)}</tbody></table></div></Card></div>;
}

function Dispatches() {
  const { dispatches, lots: liveLots, refresh } = useInventory();
  const [form, setForm] = useState(false);
  const [draft, setDraft] = useState({ client: "", route: "", lotCode: "", quantity: "1", scheduledAt: new Date().toISOString().slice(0, 16) });
  const save = async () => { await api.createDispatch({ ...draft, lotCode: draft.lotCode || liveLots.find((lot) => lot.quality === "Liberado")?.lot || "", quantity: Number(draft.quantity) }); setForm(false); await refresh(); };
  const ship = async (id: number) => { await api.updateDispatch(id); await refresh(); };
  return <div className="space-y-5">{form && <Card title="Nuevo despacho" subtitle="Programar preparación y salida"><div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4"><Field label="Cliente"><Input value={draft.client} onChange={(value) => setDraft({ ...draft, client: value })} /></Field><Field label="Ruta"><Input value={draft.route} onChange={(value) => setDraft({ ...draft, route: value })} /></Field><Field label="Fecha y hora"><Input type="datetime-local" value={draft.scheduledAt} onChange={(value) => setDraft({ ...draft, scheduledAt: value })} /></Field><Field label="Lote liberado"><Select value={draft.lotCode} onChange={(value) => setDraft({ ...draft, lotCode: value })}>{liveLots.filter((lot) => lot.quality === "Liberado").map((lot) => <option key={lot.lot} value={lot.lot}>{lot.lot} · {lot.product}</option>)}</Select></Field><Field label="Cantidad"><Input type="number" value={draft.quantity} onChange={(value) => setDraft({ ...draft, quantity: value })} /></Field><div className="flex gap-3 sm:col-span-2 lg:col-span-4 lg:justify-end"><Button variant="secondary" onClick={() => setForm(false)}>Cancelar</Button><Button onClick={() => void save()}>Programar despacho</Button></div></div></Card>}<div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-4 text-sm"><span><strong>{dispatches.filter((item) => item.status !== "Despachado").length}</strong> programados</span><span className="text-slate-500"><strong>{dispatches.reduce((sum, item) => sum + item.quantity, 0).toLocaleString("es-BO")}</strong> unidades</span></div><Button icon="plus" onClick={() => setForm(true)}>Nuevo despacho</Button></div><Card title="Plan de despachos" subtitle="Salidas programadas"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-500">{["Despacho", "Cliente", "Ruta", "Carga", "Salida", "Estado", ""].map((label) => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{dispatches.map((item) => <tr key={item.id}><td className="px-5 py-4 font-mono text-xs font-bold text-emerald-700">{item.code}</td><td className="px-5 py-4 font-semibold">{item.client}</td><td className="px-5 py-4 text-slate-600">{item.route}</td><td className="px-5 py-4">{item.product} · {item.quantity.toLocaleString("es-BO")}</td><td className="px-5 py-4">{item.scheduled_at}</td><td className="px-5 py-4"><Status tone={item.status === "Despachado" ? "green" : item.status === "Listo" ? "blue" : "amber"}>{item.status}</Status></td><td className="px-5 py-4">{item.status === "Listo" && <Button variant="ghost" onClick={() => void ship(item.id)}>Confirmar salida</Button>}</td></tr>)}</tbody></table></div><div className="flex gap-3 border-t border-slate-100 bg-amber-50/60 p-4 text-xs text-amber-800"><Icon name="alert" size={17} /><span>Los lotes retenidos o rechazados no aparecen en la selección de despacho.</span></div></Card></div>;
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={enabled} aria-label={label} onClick={onChange} className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-6" : "left-1"}`} /></button>;
}

function Settings() {
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [qualityBlock, setQualityBlock] = useState(true);
  const [saved, setSaved] = useState(false);
  return <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]"><div className="space-y-6"><Card title="Reglas de inventario" subtitle="Parámetros generales del prototipo"><div className="divide-y divide-slate-100">{[[expiryAlerts, () => setExpiryAlerts(!expiryAlerts), "Alertas de vencimiento", "Notificar lotes con 15 días o menos para vencer"], [stockAlerts, () => setStockAlerts(!stockAlerts), "Alertas de stock mínimo", "Avisar cuando la existencia llegue al punto de reposición"], [qualityBlock, () => setQualityBlock(!qualityBlock), "Bloqueo por calidad", "Impedir despacho de lotes retenidos o rechazados"]].map(([enabled, action, title, detail]) => <div key={String(title)} className="flex items-center gap-4 p-5"><div className="flex-1"><div className="text-sm font-bold">{String(title)}</div><div className="mt-1 text-xs text-slate-500">{String(detail)}</div></div><Toggle enabled={Boolean(enabled)} onChange={action as () => void} label={String(title)} /></div>)}</div><div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">{saved && <span className="mr-auto text-xs font-semibold text-emerald-700">Cambios guardados</span>}<Button onClick={() => setSaved(true)}>Guardar configuración</Button></div></Card><Card title="Almacenes" subtitle="Datos maestros de ubicaciones"><div className="divide-y divide-slate-100">{[["ALM-01", "Producto terminado", "El Alto", "Activo"], ["CF-01", "Cámara fría 01", "El Alto", "Activo"], ["CF-02", "Cámara fría 02", "El Alto", "Activo"], ["INS-01", "Almacén de insumos", "El Alto", "Activo"]].map(([code, name, site, status]) => <div key={code} className="flex items-center gap-4 px-5 py-4"><span className="font-mono text-xs font-bold text-emerald-700">{code}</span><span className="flex-1 text-sm font-semibold">{name}</span><span className="hidden text-sm text-slate-500 sm:block">{site}</span><Status tone="green">{status}</Status></div>)}</div></Card></div><div className="space-y-6"><Card title="Perfil y acceso"><div className="p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">MF</div><div><div className="font-bold">María Flores</div><div className="text-xs text-slate-500">Responsable de almacén</div></div></div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Rol</span><span className="font-semibold">Operador de inventario</span></div><div className="flex justify-between"><span className="text-slate-500">Sede</span><span className="font-semibold">El Alto</span></div></div><div className="mt-5"><Button variant="secondary">Administrar usuarios</Button></div></div></Card><div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800"><div className="font-bold">Entorno de demostración</div><div className="mt-1 text-xs leading-relaxed">Estos parámetros no están conectados a sistemas reales de PIL Andina S.A.</div></div></div></div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("inicio");
  const [traceabilityCode, setTraceabilityCode] = useState("");
  const content = useMemo(() => {
    if (screen === "inicio") return <Home setScreen={setScreen} />;
    if (screen === "compras") return <Purchases />;
    if (screen === "resumen") return <Dashboard setScreen={setScreen} />;
    if (screen === "productos") return <Products />;
    if (screen === "lotes") return <Lots setScreen={setScreen} onTraceabilityLot={setTraceabilityCode} />;
    if (screen === "movimiento") return <Movement />;
    if (screen === "produccion") return <Production />;
    if (screen === "calidad") return <Quality />;
    if (screen === "trazabilidad") return <Traceability lotCode={traceabilityCode} />;
    if (screen === "despachos") return <Dispatches />;
    return <Settings />;
  }, [screen, traceabilityCode]);
  return <InventoryProvider><InventoryStatus /><AppShell screen={screen} setScreen={setScreen} onTraceabilityLot={setTraceabilityCode}>{content}</AppShell></InventoryProvider>;
}

function InventoryStatus() {
  const { loading, error } = useInventory();
  if (loading) return <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-lg">Conectando con la base de datos...</div>;
  if (error) return <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 shadow-lg">API no disponible: {error}. Inicia <code>npm run api</code> para usar persistencia.</div>;
  return null;
}
