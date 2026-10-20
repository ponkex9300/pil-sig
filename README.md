# SIG - Sistema de Inventario y Gestión Operativa

SIG es una aplicación web para administrar inventario, lotes, movimientos, compras, recepciones, producción, control de calidad y despachos.

El proyecto está compuesto por:

- **Frontend:** React, TypeScript, Vite y Tailwind CSS.
- **Backend:** Node.js y Express.
- **Base de datos:** SQLite mediante `better-sqlite3`.
- **Persistencia:** los formularios y cambios operativos se guardan en la base de datos y se vuelven a cargar desde la API.

## Funcionalidades

- Catálogo de productos.
- Existencias por lote, ubicación, vencimiento y estado de calidad.
- Registro y validación de movimientos de inventario.
- Órdenes de compra y recepción de insumos.
- Órdenes de producción y actualización de estados.
- Inspecciones de calidad con liberación, retención o rechazo.
- Programación y confirmación de despachos.
- Reglas de inventario y bloqueo de despachos para lotes no liberados.
- Trazabilidad de los movimientos asociados a un lote.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Instalación

Desde la carpeta del proyecto:

```powershell
cd C:\Users\pinki\OneDrive\Documentos\Sebastian\SIG\pil-sig
npm install
```

La base de datos se crea automáticamente al iniciar el backend. El archivo se guarda en:

```text
data/inventory.sqlite
```

La primera ejecución también carga datos iniciales para poder probar los módulos.

## Ejecución en desarrollo

Se necesitan dos terminales.

### 1. Iniciar la API

```powershell
npm run api
```

La API queda disponible en:

```text
http://localhost:3001
```

Comprobación rápida:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

La respuesta esperada es:

```json
{
  "status": "ok"
}
```

### 2. Iniciar el frontend

```powershell
npm run dev
```

El frontend queda disponible en:

```text
http://localhost:8443
```

El servidor de desarrollo redirige automáticamente las solicitudes `/api` hacia el backend en el puerto `3001`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el frontend en modo desarrollo. |
| `npm run api` | Inicia la API y la base de datos SQLite. |
| `npm start` | Inicia la API. |
| `npm run build` | Genera la compilación de producción del frontend. |
| `npm run preview` | Sirve localmente la compilación generada. |
| `npm run format` | Formatea los archivos del proyecto. |

## API principal

### Productos e inventario

```text
GET  /api/products
POST /api/products
GET  /api/lots
GET  /api/movements
POST /api/movements
```

### Compras y recepción

```text
GET  /api/purchase-orders
POST /api/purchase-orders
POST /api/receipts
```

### Producción

```text
GET   /api/production-orders
POST  /api/production-orders
PATCH /api/production-orders/:id
```

### Control de calidad

```text
GET   /api/quality-inspections
POST  /api/quality-inspections
PATCH /api/quality-inspections/:id
```

### Despachos

```text
GET   /api/dispatches
POST  /api/dispatches
PATCH /api/dispatches/:id
```

### Configuración

```text
GET /api/settings
PUT /api/settings
```

## Reglas importantes

- No se puede registrar una salida superior al stock disponible.
- No se puede despachar un lote retenido, rechazado o que no esté liberado por Calidad.
- Confirmar una recepción actualiza la orden de compra.
- Confirmar un despacho descuenta la cantidad del lote.
- Liberar o rechazar una inspección actualiza el estado de calidad del lote.
- Todos los cambios permanecen después de recargar la página porque se guardan en SQLite.

## Validación

Para comprobar que el frontend compila:

```powershell
npm run build
```

Para consultar la base de datos directamente, se puede usar cualquier cliente SQLite apuntando a:

```text
data/inventory.sqlite
```

## Estructura principal

```text
pil-sig/
├── server/
│   └── index.mjs       # API Express, esquema y migración inicial
├── src/
│   ├── api.ts          # Cliente HTTP tipado
│   ├── App.tsx         # Interfaz y formularios
│   └── index.css       # Estilos globales
├── data/
│   └── inventory.sqlite
├── index.html
├── package.json
└── vite.config.ts
```
