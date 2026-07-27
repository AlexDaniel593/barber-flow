# BarberFlow — Frontend Cliente

Aplicación Web para usuarios con rol `client` en **BarberFlow**.

## 🚀 Funcionalidades
- **Autenticación (Login):** Inicio de sesión para clientes (`POST /auth/login`), validación de rol y almacenamiento persistente en Zustand.
- **Catálogo de Servicios:** Consulta de servicios activos (`GET /services`), filtrado por categoría o nombre, detalle de duraciones y precios.
- **Directorio de Estilistas:** Consulta de estilistas disponibles (`GET /stylists`), especialidades e información de contacto.
- **Agendamiento de Citas:** Formulario interactivo para agendar citas (`POST /appointments`) seleccionando servicio, estilista, fecha, hora y notas.
- **Mis Citas & Cancelación:** Consulta de citas propias del cliente (`GET /appointments/by-client/:clientEmail`), filtrado por estado y opción de cancelación (`POST /appointments/:id/cancel`).

## 🛠️ Tecnologías
- **React 19 + TypeScript + Vite 8**
- **Tailwind CSS v4 + Framer Motion**
- **React Query + Zustand**
- **Sonner (Notificaciones toast)**

## 💻 Desarrollo Local
```bash
npm install
npm run dev
# Disponible en http://localhost:5174
```
