# SIGC - Software de Gestión de Proyectos de Construcción

Esqueleto inicial del proyecto, basado en la arquitectura definida en el informe final de práctica.

## Estructura

```
backend/    API REST (Node.js, Express, Prisma, PostgreSQL)
frontend/   PWA (HTML, CSS, JavaScript)
docker-compose.yml  Orquesta base de datos, backend y frontend
```

## Arquitectura

Cliente-servidor por capas:

1. **Presentación**: PWA responsiva (frontend/).
2. **Comunicación**: API REST sobre HTTPS/JSON.
3. **Aplicación/API**: Node.js + Express, con capas de autenticación/permisos (JWT, bcrypt, RBAC) y lógica de negocio por módulo (`backend/src/modules`).
4. **Persistencia**: Prisma ORM + PostgreSQL.

## Requisitos

- Node.js 20+
- PostgreSQL 16 (o usar el contenedor incluido)
- Docker y Docker Compose (opcional, para levantar todo junto)

## Puesta en marcha (desarrollo local)

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

El frontend es estático: abre `frontend/src/index.html` con un servidor local (por ejemplo, la extensión Live Server) o sírvelo con cualquier servidor HTTP.

## Puesta en marcha con Docker

```bash
docker compose up --build
```

- API: http://localhost:4000
- Frontend: http://localhost:8080
- PostgreSQL: localhost:5432

## Módulos implementados como esqueleto

- `auth`: login y registro (JWT + bcrypt)
- `users`: gestión de usuarios y roles
- `projects`: proyectos (casas, edificios, lotes)
- `properties`: unidades/propiedades e inventario
- `finance`: inversiones, ingresos, egresos, conciliaciones bancarias
- `sales`: clientes, leads, planes de pago, cartera vencida
- `materials`: materiales y compras
- `hr`: empleados y asignaciones de personal

Cada módulo expone rutas base conectadas a Prisma; la lógica de negocio detallada de cada uno queda pendiente de desarrollo.
