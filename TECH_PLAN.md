# Tech Plan: MVP Reservas Club de Padel

## 1. Propuesta tecnica breve

### Arquitectura general

La app se construira como una aplicacion Next.js desplegada en Vercel.

- Next.js renderiza la interfaz y expone endpoints server-side cuando hagan falta.
- Supabase guarda usuarios, pistas, reservas, holds, pricing y permisos.
- Supabase Auth gestiona login con Google y email.
- Stripe Checkout procesa pagos.
- Stripe webhooks confirman o expiran reservas.
- La UI de calendario sera custom para mantenerla simple y adaptada al padel.

Decision: no usar un calendario generico complejo. El caso real es acotado: 3 pistas, un dia, bloques de 30 minutos y scroll horizontal sincronizado.

### Modelo de datos

Entidades principales:

- `profiles`: datos publicos del usuario y rol.
- `courts`: pistas del club.
- `bookings`: reservas y estados principales.
- `booking_holds`: reservas temporales mientras el usuario paga.
- `pricing_rules`: reglas configurables por dia y franja.
- `payments`: pagos Stripe y estado.
- `admin_blocks`: bloqueos creados por el club.
- `events`: eventos internos tipo Americana.

Entidades futuras:

- `credit_wallets`: saldo de creditos.
- `memberships`: premium/cuotas/descuentos.

### Reglas de negocio

- Horario de club: 08:00-23:00.
- Bloques de 30 minutos.
- Duraciones permitidas: 60 y 90 minutos.
- Reservas maximo 7 dias en el futuro.
- Maximo 3 reservas activas por usuario.
- Cancelacion gratis hasta 6 horas antes.
- No permitir solapamientos en la misma pista.
- Permitir reservas consecutivas exactas.
- Precio calculado por bloques, no por duracion fija.
- Holds en naranja con expiracion de 10 minutos.
- Confirmacion de pago solo por webhook de Stripe.

### Flujos principales

1. Ver disponibilidad sin login.
2. Seleccionar dia y slot.
3. Abrir drawer/modal con duraciones 60/90.
4. Calcular precio por bloques.
5. Solicitar login si el usuario quiere reservar.
6. Crear reserva temporal o `pending_payment`.
7. Redirigir a Stripe Checkout.
8. Confirmar reserva por webhook.
9. Ver y cancelar reservas.
10. Admin gestiona reservas, bloqueos y eventos.

### Riesgos tecnicos

- Dobles reservas: se resuelve con proteccion real en base de datos, no solo UI.
- Solapes entre tablas: reservas, holds, bloqueos y eventos deben validarse entre si, no solo dentro de una tabla.
- Pagos incompletos: Stripe webhook debe ser la unica fuente de confirmacion.
- Holds que no expiran: crear expiracion automatica y jobs de limpieza.
- Pricing cruzando franjas: probar funciones puras por bloques.
- Scroll movil: mantener componente propio y simple.
- RLS mal configurado: separar claramente usuario normal y admin.

### Checklist por fases

- Fase 1: calendario visual, mocks y reglas en memoria.
- Fase 2: Supabase Auth, perfiles, reservas reales basicas.
- Fase 3: holds naranjas, expiracion y proteccion contra solapes.
- Fase 4: Stripe Checkout y webhooks.
- Fase 5: admin dashboard.
- Fase 6: creditos, premium y Americana avanzada.

## 2. Stack

- Frontend: Next.js App Router.
- UI: Tailwind CSS + componentes propios inspirados en shadcn/ui.
- Calendario: componente custom.
- Base de datos: Supabase Postgres.
- Auth: Supabase Auth.
- Login: Google principal + email alternativo.
- Pagos: Stripe Checkout.
- Deploy: Vercel.
- Tests: funciones puras testeables para disponibilidad, pricing y reglas.

## 3. Estructura inicial propuesta

```txt
app/
  globals.css
  layout.tsx
  page.tsx
components/
  availability-board.tsx
  booking-drawer.tsx
lib/
  booking-rules.ts
  mock-data.ts
supabase/
  schema.sql
tests/
  booking-rules.test.ts
PRODUCT_SPEC.md
TECH_PLAN.md
.env.example
```

## 4. Modelo de datos inicial

### `profiles`

- `id`: UUID, coincide con `auth.users.id`.
- `full_name`: nombre visible.
- `email`: email.
- `role`: `user` o `admin`.
- `created_at`.

### `courts`

- `id`.
- `name`.
- `is_active`.
- `created_at`.

### `bookings`

- `id`.
- `user_id`.
- `court_id`.
- `start_time`.
- `end_time`.
- `duration_minutes`.
- `status`.
- `price_total_cents`.
- `currency`.
- `price_breakdown`.
- `payment_id`.
- `created_at`.
- `cancelled_at`.
- `cancellation_policy_status`.

### `booking_holds`

- `id`.
- `user_id`.
- `court_id`.
- `start_time`.
- `end_time`.
- `expires_at`.
- `status`.
- `created_at`.

### `pricing_rules`

- `id`.
- `day_of_week`: 0 domingo, 1 lunes, etc.
- `start_time`.
- `end_time`.
- `price_per_30_min_cents`.
- `currency`.
- `label`.
- `is_active`.

### `payments`

- `id`.
- `booking_id`.
- `stripe_checkout_session_id`.
- `stripe_payment_intent_id`.
- `amount_cents`.
- `currency`.
- `status`.
- `created_at`.
- `updated_at`.

### `admin_blocks`

- `id`.
- `court_id`.
- `start_time`.
- `end_time`.
- `reason`.
- `created_by`.
- `created_at`.

### `events`

- `id`.
- `name`.
- `event_type`.
- `court_ids`.
- `start_time`.
- `end_time`.
- `created_by`.
- `created_at`.

## 5. Variables de entorno

Ver tambien `.env.example`.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Notas:

- Las variables `NEXT_PUBLIC_*` pueden usarse en navegador.
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` nunca deben llegar al frontend.

## 6. Roadmap de implementacion

### Fase 1: calendario visual y reglas en memoria

Objetivo: validar la experiencia de reserva sin dependencias externas.

- Crear proyecto base Next.js.
- Crear UI base mobile-first.
- Mock de 3 pistas.
- Mock de reservas/bloqueos/eventos/holds.
- Calendario horizontal custom.
- Scroll horizontal sincronizado.
- Drawer de reserva.
- Calculo de disponibilidad 60/90.
- Calculo de precio por bloques.
- Tests de reglas puras.

### Fase 2: login y Supabase

Objetivo: usuarios reales y reservas persistidas.

- Configurar Supabase. Implementado en codigo; pendiente rellenar `.env.local`.
- Crear tablas y RLS. Esquema preparado en `supabase/schema.sql`.
- Login Google. Implementado.
- Login email. Implementado con magic link.
- Crear perfiles. Trigger SQL preparado.
- Leer disponibilidad real. Implementado con fallback a mock.
- Crear reservas basicas sin pago real todavia. Implementado como politica temporal de Fase 2.

### Fase 3: holds y concurrencia

Objetivo: evitar dobles reservas.

- Crear `booking_holds`.
- Mostrar holds activos en naranja.
- Expirar holds a los 10 minutos.
- Crear funciones SQL/transacciones para evitar overlaps.
- Probar reservas consecutivas exactas.
- Probar reservas solapadas rechazadas.

### Fase 4: Stripe Checkout

Objetivo: pago online obligatorio.

- Crear Checkout Session desde backend.
- Guardar `payment`.
- Mantener booking en `pending_payment`.
- Confirmar solo por webhook.
- Expirar si Stripe falla o caduca.
- Preparar tarjeta y Bizum si Stripe lo permite.

### Fase 5: admin

Objetivo: gestion operativa del club.

- Dashboard admin.
- Ver reservas por dia.
- Filtrar por pista.
- Crear reserva manual.
- Cancelar reserva.
- Crear bloqueo.
- Crear evento interno/Americana simple.
- Ver estado de pagos.

### Fase 6: evolucion producto

Objetivo: monetizacion y eventos avanzados.

- Creditos/saldo.
- Membresias premium.
- Descuentos por usuario.
- Americanas con multiples pistas y participantes.
- Penalizaciones/no-show.

## 7. Estrategia de testing

Funciones a probar desde Fase 1:

- Calculo de disponibilidad.
- Calculo de precio por bloques.
- Deteccion de overlaps.
- Limite de 3 reservas activas.
- Ventana maxima de 7 dias.
- Cancelacion gratis hasta 6 horas antes.
- Expiracion de holds.
- Disponibilidad/deshabilitado para 60/90.

## 8. Decisiones explicadas sin jerga

- Primero mock, luego base de datos: reduce riesgo y permite validar la experiencia visual pronto.
- Calendario propio: el producto necesita algo muy concreto, no una agenda compleja.
- Precio por bloques: evita errores cuando una reserva cruza de precio barato a caro.
- Webhook de Stripe: es la confirmacion fiable del pago, no depende de que el usuario vuelva a la web.
- Proteccion en base de datos: la UI puede fallar o llegar tarde; la base de datos debe ser el guardia final.
