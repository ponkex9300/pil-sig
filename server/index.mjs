import cors from "cors";
import express from "express";
import Database from "better-sqlite3";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
mkdirSync(join(root, "data"), { recursive: true });
const database = new Database(join(root, "data", "inventory.sqlite"));
database.pragma("foreign_keys = ON");
database.pragma("journal_mode = WAL");

database.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activo',
    minimum_stock REAL NOT NULL DEFAULT 0,
    reorder_point REAL NOT NULL DEFAULT 0,
    safety_stock REAL NOT NULL DEFAULT 0,
    abc_class TEXT NOT NULL DEFAULT 'C',
    rotation_policy TEXT NOT NULL DEFAULT 'FEFO',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    site TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activo'
  );
  CREATE TABLE IF NOT EXISTS lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    code TEXT NOT NULL UNIQUE,
    quantity REAL NOT NULL DEFAULT 0,
    warehouse TEXT NOT NULL,
    expiry TEXT NOT NULL,
    quality TEXT NOT NULL DEFAULT 'Liberado'
  );
  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    lot_id INTEGER NOT NULL REFERENCES lots(id),
    quantity REAL NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    responsible TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    supplier TEXT NOT NULL,
    item TEXT NOT NULL,
    expected_date TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente'
  );
  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id),
    quantity REAL NOT NULL,
    document TEXT NOT NULL,
    warehouse TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS production_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    planned_quantity REAL NOT NULL,
    line TEXT NOT NULL,
    schedule TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Planificada'
  );
  CREATE TABLE IF NOT EXISTS quality_inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id INTEGER NOT NULL REFERENCES lots(id),
    test TEXT NOT NULL,
    sample TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS dispatches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    client TEXT NOT NULL,
    route TEXT NOT NULL,
    lot_id INTEGER NOT NULL REFERENCES lots(id),
    quantity REAL NOT NULL,
    scheduled_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Preparando'
  );
`);

const addColumnIfMissing = (table, column, definition) => {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
};
addColumnIfMissing("products", "reorder_point", "REAL NOT NULL DEFAULT 0");
addColumnIfMissing("products", "safety_stock", "REAL NOT NULL DEFAULT 0");
addColumnIfMissing("products", "abc_class", "TEXT NOT NULL DEFAULT 'C'");
addColumnIfMissing("products", "rotation_policy", "TEXT NOT NULL DEFAULT 'FEFO'");

const seed = database.transaction(() => {
  if (database.prepare("SELECT COUNT(*) count FROM products").get().count > 0) return;
  const addProduct = database.prepare("INSERT INTO products (code,name,category,unit,status,minimum_stock) VALUES (?,?,?,?,?,?)");
  [
    ["LAC-001", "Leche UHT Entera 1 L", "Leches", "Unidad", "Activo", 2000],
    ["LAC-002", "Leche Deslactosada 1 L", "Leches", "Unidad", "Activo", 1000],
    ["YOG-014", "Yogurt Frutilla 1 L", "Yogures", "Unidad", "Activo", 800],
    ["QUE-008", "Queso Edam 1 kg", "Quesos", "Kilogramo", "Activo", 150],
    ["MAN-003", "Mantequilla sin sal 200 g", "Mantequillas", "Unidad", "Activo", 500],
    ["LAC-010", "Leche en polvo 800 g", "Leches", "Unidad", "Inactivo", 100],
  ].forEach((product) => addProduct.run(...product));
  const warehouses = database.prepare("INSERT INTO warehouses (code,name,site) VALUES (?,?,?)");
  [["ALM-01", "Producto terminado", "El Alto"], ["CF-01", "Cámara fría 01", "El Alto"], ["CF-02", "Cámara fría 02", "El Alto"], ["INS-01", "Almacén de insumos", "El Alto"]].forEach((item) => warehouses.run(...item));
  const productId = (code) => database.prepare("SELECT id FROM products WHERE code = ?").get(code).id;
  const addLot = database.prepare("INSERT INTO lots (product_id,code,quantity,warehouse,expiry,quality) VALUES (?,?,?,?,?,?)");
  [
    ["LAC-001", "UHT-250314-A", 8240, "Producto terminado", "2026-04-18", "Liberado"],
    ["LAC-001", "UHT-250310-B", 4240, "Producto terminado", "2026-04-10", "Liberado"],
    ["YOG-014", "YGF-250312-C", 620, "Cámara fría 02", "2025-03-24", "Liberado"],
    ["QUE-008", "QED-250228-A", 96, "Cámara fría 01", "2025-03-19", "Retenido"],
    ["MAN-003", "MNS-250305-B", 1480, "Cámara fría 02", "2025-06-02", "Liberado"],
  ].forEach(([code, ...lot]) => addLot.run(productId(code), ...lot));
  database.prepare("INSERT INTO settings (key,value) VALUES (?,?)").run("qualityBlock", "true");
  const order = database.prepare("INSERT INTO purchase_orders (code,supplier,item,expected_date,quantity,unit,status) VALUES (?,?,?,?,?,?,?)");
  [["OC-2025-0182", "Envases Bolivia S.R.L.", "Envase Tetra Pak 1 L", "2025-03-12", 15000, "Unidad", "Pendiente"], ["OC-2025-0179", "Lácteos del Valle", "Leche cruda refrigerada", "2025-03-12", 8500, "Litro", "En recepción"], ["OC-2025-0176", "Frutal Andina", "Pulpa de frutilla", "2025-03-11", 480, "Kilogramo", "Recibida"]].forEach((item) => order.run(...item));
  const production = database.prepare("INSERT INTO production_orders (code,product_id,planned_quantity,line,schedule,status) VALUES (?,?,?,?,?,?)");
  [["OP-250312-04", "LAC-001", 8240, "Línea UHT 01", "06:00 – 12:00", "En proceso"], ["OP-250312-03", "YOG-014", 1200, "Línea Yogurt 02", "08:30 – 14:30", "En proceso"], ["OP-250312-02", "MAN-003", 2400, "Línea Mantequilla", "07:00 – 11:00", "Completada"]].forEach(([code, product, ...values]) => production.run(code, productId(product), ...values));
  const lotId = (code) => database.prepare("SELECT id FROM lots WHERE code = ?").get(code).id;
  const inspection = database.prepare("INSERT INTO quality_inspections (lot_id,test,sample,status,notes) VALUES (?,?,?,?,?)");
  [["QED-250228-A", "Microbiología", "CC-1048", "Retenido", "Análisis complementario"], ["YGF-250312-C", "Fisicoquímico", "CC-1051", "Pendiente", ""], ["UHT-250314-A", "Esterilidad comercial", "CC-1044", "Liberado", "Sin observaciones"]].forEach(([lot, ...values]) => inspection.run(lotId(lot), ...values));
  const dispatch = database.prepare("INSERT INTO dispatches (code,client,route,lot_id,quantity,scheduled_at,status) VALUES (?,?,?,?,?,?,?)");
  [["DES-250312-08", "Agencia Central La Paz", "La Paz urbana", "UHT-250314-A", 2400, "2025-03-12T14:30", "Preparando"], ["DES-250312-07", "Distribuidora Cochabamba", "CBBA metropolitana", "UHT-250314-A", 4820, "2025-03-12T13:00", "Listo"], ["DES-250312-05", "Supermercados Altiplano", "El Alto", "YGF-250312-C", 1100, "2025-03-12T10:30", "Despachado"]].forEach(([code, client, route, lot, quantity, date, status]) => dispatch.run(code, client, route, lotId(lot), quantity, date, status));
});
seed();

const seedOperationalTables = database.transaction(() => {
  const productId = (code) => database.prepare("SELECT id FROM products WHERE code = ?").get(code)?.id;
  const lotId = (code) => database.prepare("SELECT id FROM lots WHERE code = ?").get(code)?.id;
  if (database.prepare("SELECT COUNT(*) count FROM purchase_orders").get().count === 0) {
    const statement = database.prepare("INSERT INTO purchase_orders (code,supplier,item,expected_date,quantity,unit,status) VALUES (?,?,?,?,?,?,?)");
    [["OC-2025-0182", "Envases Bolivia S.R.L.", "Envase Tetra Pak 1 L", "2025-03-12", 15000, "Unidad", "Pendiente"], ["OC-2025-0179", "Lácteos del Valle", "Leche cruda refrigerada", "2025-03-12", 8500, "Litro", "En recepción"], ["OC-2025-0176", "Frutal Andina", "Pulpa de frutilla", "2025-03-11", 480, "Kilogramo", "Recibida"]].forEach((item) => statement.run(...item));
  }
  if (database.prepare("SELECT COUNT(*) count FROM production_orders").get().count === 0) {
    const statement = database.prepare("INSERT INTO production_orders (code,product_id,planned_quantity,line,schedule,status) VALUES (?,?,?,?,?,?)");
    [["OP-250312-04", "LAC-001", 8240, "Línea UHT 01", "06:00 – 12:00", "En proceso"], ["OP-250312-03", "YOG-014", 1200, "Línea Yogurt 02", "08:30 – 14:30", "En proceso"], ["OP-250312-02", "MAN-003", 2400, "Línea Mantequilla", "07:00 – 11:00", "Completada"]].forEach(([code, product, ...values]) => statement.run(code, productId(product), ...values));
  }
  if (database.prepare("SELECT COUNT(*) count FROM quality_inspections").get().count === 0) {
    const statement = database.prepare("INSERT INTO quality_inspections (lot_id,test,sample,status,notes) VALUES (?,?,?,?,?)");
    [["QED-250228-A", "Microbiología", "CC-1048", "Retenido", "Análisis complementario"], ["YGF-250312-C", "Fisicoquímico", "CC-1051", "Pendiente", ""], ["UHT-250314-A", "Esterilidad comercial", "CC-1044", "Liberado", "Sin observaciones"]].forEach(([lot, ...values]) => statement.run(lotId(lot), ...values));
  }
  if (database.prepare("SELECT COUNT(*) count FROM dispatches").get().count === 0) {
    const statement = database.prepare("INSERT INTO dispatches (code,client,route,lot_id,quantity,scheduled_at,status) VALUES (?,?,?,?,?,?,?)");
    [["DES-250312-08", "Agencia Central La Paz", "La Paz urbana", "UHT-250314-A", 2400, "2025-03-12T14:30", "Preparando"], ["DES-250312-07", "Distribuidora Cochabamba", "CBBA metropolitana", "UHT-250314-A", 4820, "2025-03-12T13:00", "Listo"], ["DES-250312-05", "Supermercados Altiplano", "El Alto", "YGF-250312-C", 1100, "2025-03-12T10:30", "Despachado"]].forEach(([code, client, route, lot, quantity, date, status]) => statement.run(code, client, route, lotId(lot), quantity, date, status));
  }
});
seedOperationalTables();
database.prepare("UPDATE products SET reorder_point = CASE code WHEN 'LAC-001' THEN 3000 WHEN 'LAC-002' THEN 1200 WHEN 'YOG-014' THEN 800 WHEN 'QUE-008' THEN 150 WHEN 'MAN-003' THEN 500 ELSE 100 END, safety_stock = CASE code WHEN 'LAC-001' THEN 1000 WHEN 'LAC-002' THEN 400 WHEN 'YOG-014' THEN 250 WHEN 'QUE-008' THEN 50 WHEN 'MAN-003' THEN 150 ELSE 20 END, abc_class = CASE code WHEN 'LAC-001' THEN 'A' WHEN 'LAC-002' THEN 'A' WHEN 'YOG-014' THEN 'B' ELSE 'C' END, rotation_policy = CASE WHEN unit IN ('Unidad','Litro') THEN 'FEFO' ELSE 'FIFO' END WHERE reorder_point = 0").run();
database.exec(`
  UPDATE lots
  SET quality = COALESCE((
    SELECT CASE i.status
      WHEN 'Liberado' THEN 'Liberado'
      WHEN 'Retenido' THEN 'Retenido'
      WHEN 'Rechazado' THEN 'Rechazado'
      ELSE 'Pendiente'
    END
    FROM quality_inspections i
    WHERE i.lot_id = lots.id
    ORDER BY i.id DESC
    LIMIT 1
  ), quality)
  WHERE EXISTS (SELECT 1 FROM quality_inspections i WHERE i.lot_id = lots.id);
`);

const app = express();
app.use(cors());
app.use(express.json());

const productQuery = database.prepare(`
  SELECT p.*, COALESCE(SUM(l.quantity), 0) stock
  FROM products p LEFT JOIN lots l ON l.product_id = p.id
  GROUP BY p.id ORDER BY p.name
`);
const lotQuery = database.prepare(`
  SELECT l.*, p.name product, p.code productCode, p.unit
  FROM lots l JOIN products p ON p.id = l.product_id ORDER BY l.expiry
`);
const toPublicLot = (lot) => {
  const today = new Date();
  const expiryDate = new Date(`${lot.expiry}T12:00:00`);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
  const expiryNote = lot.quality !== "Liberado" ? "Revisión requerida" : daysUntilExpiry < 0 ? "Vencido" : daysUntilExpiry <= 30 ? `Vence en ${daysUntilExpiry} días` : "Vigente";
  return { ...lot, lot: lot.code, quantity: lot.quantity.toLocaleString("es-BO"), expiryDate: lot.expiry, expiry: expiryDate.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }), expiryNote };
};

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/dashboard", (_req, res) => {
  const products = database.prepare("SELECT COUNT(*) count, COALESCE(SUM(stock), 0) stock FROM (SELECT p.id, COALESCE(SUM(l.quantity), 0) stock FROM products p LEFT JOIN lots l ON l.product_id=p.id GROUP BY p.id)").get();
  const lowStock = database.prepare("SELECT COUNT(*) count FROM (SELECT p.id FROM products p LEFT JOIN lots l ON l.product_id=p.id GROUP BY p.id HAVING COALESCE(SUM(l.quantity),0) <= p.reorder_point)").get().count;
  const expiring = database.prepare("SELECT COUNT(*) count FROM lots WHERE date(expiry) <= date('now', '+30 day') AND date(expiry) >= date('now')").get().count;
  const blocked = database.prepare("SELECT COUNT(*) count FROM lots WHERE quality <> 'Liberado' OR date(expiry) < date('now')").get().count;
  const movementsToday = database.prepare("SELECT COUNT(*) count FROM movements WHERE date(created_at) = date('now')").get().count;
  res.json({ products: products.count, stock: products.stock, lowStock, expiring, blocked, movementsToday, policies: { inventory: "Perpetuo", rotation: "FEFO para perecederos / FIFO para materiales", traceability: "Por lote", qualityGate: "Despacho bloqueado si no está liberado" } });
});
app.get("/api/products", (_req, res) => res.json(productQuery.all()));
app.get("/api/warehouses", (_req, res) => res.json(database.prepare("SELECT * FROM warehouses ORDER BY name").all()));
app.post("/api/products", (req, res) => {
  const { code, name, category, unit, reorderPoint = 0, safetyStock = 0, abcClass = "C", rotationPolicy = "FEFO" } = req.body;
  if (![code, name, category, unit].every((value) => typeof value === "string" && value.trim())) return res.status(400).json({ error: "Código, nombre, categoría y unidad son obligatorios." });
  try {
    const result = database.prepare("INSERT INTO products (code,name,category,unit,reorder_point,safety_stock,abc_class,rotation_policy) VALUES (?,?,?,?,?,?,?,?)").run(code.trim(), name.trim(), category.trim(), unit.trim(), Number(reorderPoint), Number(safetyStock), abcClass, rotationPolicy);
    res.status(201).json(database.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "El código del producto ya existe." });
    throw error;
  }
});
app.get("/api/lots", (_req, res) => res.json(lotQuery.all().map(toPublicLot)));
app.post("/api/lots", (req, res) => {
  const { productCode, code, quantity, warehouse, expiry, responsible = "María Flores" } = req.body;
  const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  const product = database.prepare("SELECT id FROM products WHERE code=? AND status='Activo'").get(productCode);
  const location = database.prepare("SELECT name FROM warehouses WHERE name=? AND status='Activo'").get(warehouse);
  if (!product || !normalizedCode || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !location || !/^[A-Z0-9]+-\d{6}-[A-Z0-9]+$/.test(normalizedCode) || !/^\d{4}-\d{2}-\d{2}$/.test(String(expiry || ""))) {
    return res.status(400).json({ error: "Producto, código con formato AAA-YYMMDD-X, cantidad, almacén y vencimiento válido son obligatorios." });
  }
  if (String(expiry) <= new Date().toISOString().slice(0, 10)) return res.status(400).json({ error: "El vencimiento debe ser posterior a la fecha actual." });
  try {
    const create = database.transaction(() => {
      const lot = database.prepare("INSERT INTO lots (product_id,code,quantity,warehouse,expiry,quality) VALUES (?,?,?,?,?,'Pendiente')").run(product.id, normalizedCode, Number(quantity), location.name, expiry);
      database.prepare("INSERT INTO movements (type,product_id,lot_id,quantity,origin,destination,responsible) VALUES (?,?,?,?,?,?,?)").run("Ingreso de lote", product.id, lot.lastInsertRowid, Number(quantity), "Recepción", location.name, responsible);
      return lot.lastInsertRowid;
    });
    const id = create();
    res.status(201).json(toPublicLot(database.prepare("SELECT l.*, p.name product, p.code productCode, p.unit FROM lots l JOIN products p ON p.id=l.product_id WHERE l.id=?").get(id)));
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ error: "El código de lote ya existe." });
    throw error;
  }
});
app.get("/api/traceability/:lotCode", (req, res) => {
  const lot = database.prepare(`
    SELECT l.*, p.name product, p.code productCode, p.unit,
           COALESCE((
             SELECT i.status FROM quality_inspections i
             WHERE i.lot_id = l.id ORDER BY i.id DESC LIMIT 1
           ), l.quality) quality
    FROM lots l JOIN products p ON p.id = l.product_id
    WHERE lower(l.code) = lower(?)
  `).get(req.params.lotCode);
  if (!lot) return res.status(404).json({ error: "No existe un lote con ese código." });
  const events = [
    ...database.prepare(`
      SELECT 'Movimiento de inventario' stage, m.created_at eventDate, m.type detail,
             m.destination place, m.responsible user
      FROM movements m WHERE m.lot_id = ?
    `).all(lot.id),
    ...database.prepare(`
      SELECT 'Control de calidad' stage, i.created_at eventDate,
             i.status || ' · ' || i.test detail, 'Laboratorio de calidad' place,
             'Control de calidad' user
      FROM quality_inspections i WHERE i.lot_id = ?
    `).all(lot.id),
    ...database.prepare(`
      SELECT 'Despacho' stage, d.scheduled_at eventDate,
             d.status || ' · ' || d.client detail, d.route place,
             'Despachos' user
      FROM dispatches d WHERE d.lot_id = ?
    `).all(lot.id),
  ].sort((first, second) => String(first.eventDate).localeCompare(String(second.eventDate)));
  res.json({ lot: toPublicLot(lot), events });
});
app.get("/api/movements", (_req, res) => res.json(database.prepare(`
  SELECT m.*, p.name product, l.code lot FROM movements m JOIN products p ON p.id=m.product_id JOIN lots l ON l.id=m.lot_id ORDER BY m.created_at DESC LIMIT 50
`).all()));
app.post("/api/movements", (req, res) => {
  const { type, lotCode, quantity, origin, destination, responsible } = req.body;
  const lot = database.prepare("SELECT l.*, p.id product_id FROM lots l JOIN products p ON p.id=l.product_id WHERE l.code=?").get(lotCode);
  if (!lot || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) return res.status(400).json({ error: "Lote y cantidad válida son obligatorios." });
  const amount = Number(quantity);
  if (type === "Salida por despacho" && lot.quality !== "Liberado") return res.status(422).json({ error: "El lote está retenido por Control de Calidad." });
  if (type === "Salida por despacho" && lot.expiry < new Date().toISOString().slice(0, 10)) return res.status(422).json({ error: "El lote está vencido y no puede despacharse." });
  if (["Salida por despacho", "Transferencia interna"].includes(type) && lot.quantity < amount) return res.status(422).json({ error: "La cantidad supera la existencia disponible." });
  const change = type === "Ingreso desde producción" ? amount : type === "Ajuste de inventario" ? amount : -amount;
  const transaction = database.transaction(() => {
    database.prepare("UPDATE lots SET quantity = quantity + ?, warehouse = ? WHERE id = ?").run(change, destination || lot.warehouse, lot.id);
    return database.prepare("INSERT INTO movements (type,product_id,lot_id,quantity,origin,destination,responsible) VALUES (?,?,?,?,?,?,?)").run(type, lot.product_id, lot.id, amount, origin || lot.warehouse, destination || lot.warehouse, responsible || "María Flores");
  });
  res.status(201).json({ id: transaction().lastInsertRowid });
});
const purchaseQuery = database.prepare("SELECT * FROM purchase_orders ORDER BY expected_date DESC, id DESC");
app.get("/api/purchase-orders", (_req, res) => res.json(purchaseQuery.all()));
app.post("/api/purchase-orders", (req, res) => {
  const { supplier, item, expectedDate, quantity, unit } = req.body;
  if (![supplier, item, expectedDate, unit].every((value) => typeof value === "string" && value.trim()) || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) return res.status(400).json({ error: "Proveedor, insumo, fecha, unidad y cantidad válida son obligatorios." });
  const code = `OC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const result = database.prepare("INSERT INTO purchase_orders (code,supplier,item,expected_date,quantity,unit) VALUES (?,?,?,?,?,?)").run(code, supplier.trim(), item.trim(), expectedDate, Number(quantity), unit.trim());
  res.status(201).json(database.prepare("SELECT * FROM purchase_orders WHERE id=?").get(result.lastInsertRowid));
});
app.post("/api/receipts", (req, res) => {
  const { purchaseOrderId, quantity, document, warehouse } = req.body;
  const order = database.prepare("SELECT * FROM purchase_orders WHERE id=?").get(purchaseOrderId);
  if (!order || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !document || !warehouse) return res.status(400).json({ error: "Orden, cantidad, documento y ubicación son obligatorios." });
  const transaction = database.transaction(() => {
    const receipt = database.prepare("INSERT INTO receipts (purchase_order_id,quantity,document,warehouse) VALUES (?,?,?,?)").run(purchaseOrderId, Number(quantity), document, warehouse);
    database.prepare("UPDATE purchase_orders SET status='Recibida' WHERE id=?").run(purchaseOrderId);
    return receipt.lastInsertRowid;
  });
  res.status(201).json({ id: transaction() });
});
app.get("/api/production-orders", (_req, res) => res.json(database.prepare("SELECT o.*, p.name product FROM production_orders o JOIN products p ON p.id=o.product_id ORDER BY o.id DESC").all()));
app.post("/api/production-orders", (req, res) => {
  const { productCode, quantity, line, schedule } = req.body;
  const product = database.prepare("SELECT id FROM products WHERE code=?").get(productCode);
  if (!product || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !line || !schedule) return res.status(400).json({ error: "Producto, cantidad, línea y horario son obligatorios." });
  const code = `OP-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${String(Date.now()).slice(-2)}`;
  const result = database.prepare("INSERT INTO production_orders (code,product_id,planned_quantity,line,schedule) VALUES (?,?,?,?,?)").run(code, product.id, Number(quantity), line, schedule);
  res.status(201).json(database.prepare("SELECT o.*, p.name product FROM production_orders o JOIN products p ON p.id=o.product_id WHERE o.id=?").get(result.lastInsertRowid));
});
app.patch("/api/production-orders/:id", (req, res) => {
  const { status } = req.body;
  if (!["Planificada", "En proceso", "Completada"].includes(status)) return res.status(400).json({ error: "Estado de producción inválido." });
  database.prepare("UPDATE production_orders SET status=? WHERE id=?").run(status, req.params.id);
  res.json({ ok: true });
});
app.get("/api/quality-inspections", (_req, res) => res.json(database.prepare("SELECT i.*, l.code lot, p.name product FROM quality_inspections i JOIN lots l ON l.id=i.lot_id JOIN products p ON p.id=l.product_id ORDER BY i.id DESC").all()));
app.post("/api/quality-inspections", (req, res) => {
  const { lotCode, test, sample, notes } = req.body;
  const lot = database.prepare("SELECT id FROM lots WHERE code=?").get(lotCode);
  if (!lot || !test || !sample) return res.status(400).json({ error: "Lote, análisis y muestra son obligatorios." });
  const result = database.prepare("INSERT INTO quality_inspections (lot_id,test,sample,notes) VALUES (?,?,?,?)").run(lot.id, test, sample, notes || "");
  res.status(201).json({ id: result.lastInsertRowid });
});
app.patch("/api/quality-inspections/:id", (req, res) => {
  const { status } = req.body;
  if (!["Pendiente", "Liberado", "Retenido", "Rechazado"].includes(status)) return res.status(400).json({ error: "Resultado de calidad inválido." });
  const transaction = database.transaction(() => {
    database.prepare("UPDATE quality_inspections SET status=? WHERE id=?").run(status, req.params.id);
    const inspection = database.prepare("SELECT lot_id FROM quality_inspections WHERE id=?").get(req.params.id);
    if (inspection) database.prepare("UPDATE lots SET quality=? WHERE id=?").run(status, inspection.lot_id);
  });
  transaction();
  res.json({ ok: true });
});
app.get("/api/dispatches", (_req, res) => res.json(database.prepare("SELECT d.*, l.code lot, p.name product FROM dispatches d JOIN lots l ON l.id=d.lot_id JOIN products p ON p.id=l.product_id ORDER BY d.scheduled_at DESC").all()));
app.post("/api/dispatches", (req, res) => {
  const { client, route, lotCode, quantity, scheduledAt } = req.body;
  const lot = database.prepare("SELECT * FROM lots WHERE code=?").get(lotCode);
  if (!lot || lot.quality !== "Liberado" || !client || !route || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !scheduledAt) return res.status(422).json({ error: "Cliente, ruta, lote liberado, cantidad y fecha son obligatorios." });
  if (lot.quantity < Number(quantity)) return res.status(422).json({ error: "La cantidad supera la existencia disponible." });
  const code = `DES-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${String(Date.now()).slice(-2)}`;
  const result = database.prepare("INSERT INTO dispatches (code,client,route,lot_id,quantity,scheduled_at) VALUES (?,?,?,?,?,?)").run(code, client, route, lot.id, Number(quantity), scheduledAt);
  res.status(201).json({ id: result.lastInsertRowid });
});
app.patch("/api/dispatches/:id", (req, res) => {
  if (req.body.status !== "Despachado") return res.status(400).json({ error: "Solo se puede confirmar una salida como Despachado." });
  const dispatch = database.prepare("SELECT d.*, l.quality FROM dispatches d JOIN lots l ON l.id=d.lot_id WHERE d.id=?").get(req.params.id);
  if (!dispatch || dispatch.quality !== "Liberado") return res.status(422).json({ error: "El lote no está liberado por Calidad." });
  const transaction = database.transaction(() => {
    database.prepare("UPDATE dispatches SET status='Despachado' WHERE id=?").run(req.params.id);
    database.prepare("UPDATE lots SET quantity=quantity-? WHERE id=?").run(dispatch.quantity, dispatch.lot_id);
  });
  transaction();
  res.json({ ok: true });
});
const readSettings = () => Object.fromEntries(database.prepare("SELECT key,value FROM settings").all().map(({ key, value }) => [key, value === "true"]));
app.get("/api/settings", (_req, res) => res.json(readSettings()));
app.put("/api/settings", (req, res) => {
  const update = database.prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
  const transaction = database.transaction((entries) => entries.forEach(([key, value]) => update.run(key, String(Boolean(value)))));
  transaction(Object.entries(req.body));
  res.json(readSettings());
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`SIG API listening on http://localhost:${port}`));
