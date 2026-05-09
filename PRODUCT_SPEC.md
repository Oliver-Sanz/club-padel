# Product Spec: MVP Reservas Club de Padel

## 1. Objetivo

Crear una webapp MVP para un club de padel con 3 pistas. La app debe permitir a usuarios ver disponibilidad, reservar 60 o 90 minutos, pagar online y gestionar sus reservas. Tambien debe existir una zona admin para que el club pueda ver, crear, cancelar, bloquear y gestionar reservas.

El producto debe ser simple, rapido y mobile-first. La primera entrega no incluye Supabase ni Stripe reales: primero se construye el calendario visual, reglas de disponibilidad y pricing con datos mock.

## 2. Usuarios

### Usuario jugador

- Puede ver disponibilidad sin iniciar sesion.
- Debe iniciar sesion para reservar.
- Puede iniciar sesion con Google como opcion principal.
- Puede iniciar sesion con email como alternativa.
- Puede ver sus reservas.
- Puede cancelar gratis hasta 6 horas antes.
- Si faltan menos de 6 horas, ve el mensaje: "Contacta con el club".

### Admin del club

- Puede ver reservas por dia.
- Puede filtrar por pista.
- Puede crear reserva manual.
- Puede cancelar reserva.
- Puede bloquear una pista en una franja.
- Puede crear evento interno tipo Americana.
- Puede ver pagos y estado basico de pago.

## 3. Pistas

El club tiene 3 pistas:

- Pista 1
- Pista 2
- Pista 3

## 4. Horario y granularidad

- El club abre a las 08:00.
- El club cierra a las 23:00.
- Las reservas solo pueden caer completamente dentro de ese rango.
- El sistema trabaja en bloques de 30 minutos.
- Una reserva de 60 minutos ocupa 2 bloques.
- Una reserva de 90 minutos ocupa 3 bloques.
- Las duraciones permitidas son 60 y 90 minutos.

## 5. Ventana de reserva

- Se puede reservar con efecto inmediato.
- No hay antelacion minima.
- Solo se puede reservar hasta 7 dias en el futuro.
- Si el usuario intenta reservar fuera de esa ventana, se muestra un aviso claro.

## 6. Vista principal de disponibilidad

La pantalla principal muestra las 3 pistas en paralelo:

- Tres filas, una por pista.
- Cada fila muestra una linea temporal horizontal del dia.
- El usuario puede hacer scroll horizontal por el horario.
- El scroll horizontal esta sincronizado entre las tres pistas.
- Si el usuario mueve Pista 1, tambien se mueven Pista 2 y Pista 3.

El objetivo es comparar rapidamente disponibilidad entre pistas.

## 7. Estados visuales de slots

- `available`: disponible, se puede reservar.
- `confirmed`: ocupado por reserva confirmada.
- `blocked`: bloqueado por el club.
- `event`: reservado por evento interno o Americana.
- `pending_payment`: en proceso, marcado visualmente en naranja.

El estado naranja significa: "alguien esta intentando reservar este horario, puede que se confirme antes que tu".

## 8. Regla de holds/en proceso

Cuando un usuario empieza una reserva:

- Se crea un hold temporal.
- El slot se muestra en naranja a otros usuarios.
- El hold no bloquea para siempre.
- Expira automaticamente, sugerencia MVP: 10 minutos.
- Si no hay pago confirmado antes de expirar, el slot vuelve a disponible.

## 9. Flujo de reserva

1. Usuario entra en la app.
2. Puede ver disponibilidad sin login.
3. Elige dia.
4. El sistema solo permite fechas hasta 7 dias en el futuro.
5. Ve las 3 pistas con sus horarios.
6. Toca un slot disponible.
7. Se abre un modal/drawer de reserva.
8. El modal muestra pista, fecha, hora, duraciones, precio y disponibilidad.
9. Si solo cabe 60 minutos, 90 aparece deshabilitado con explicacion visual.
10. Usuario confirma.
11. Se crea una reserva `pending_payment`.
12. Usuario pasa a Stripe Checkout.
13. Stripe confirma mediante webhook.
14. La reserva pasa a `confirmed`.
15. Si el pago falla o expira, la reserva queda `expired` y el slot vuelve a disponible.

## 10. Regla importante de duracion

Al seleccionar un slot:

- La opcion de 60 minutos aparece habilitada si caben 2 bloques libres.
- La opcion de 90 minutos aparece habilitada si caben 3 bloques libres.
- Si no cabe 90 minutos, aparece deshabilitada.
- La UI debe explicar por que: por ejemplo, "No hay 90 minutos seguidos disponibles desde esta hora".

## 11. Solapamientos

Una reserva no puede solaparse con otra reserva confirmada, bloqueo, evento o Americana en la misma pista.

Se permiten reservas consecutivas exactas.

Permitido:

- 18:00-19:30
- 19:30-21:00

No permitido:

- 18:00-19:30
- 19:00-20:00

La base de datos debe impedir dobles reservas, aunque la UI tenga algun retraso.

## 12. Limite de reservas activas

- Un usuario puede tener maximo 3 reservas activas al mismo tiempo.
- Activas significa reservas futuras confirmadas que no han sido canceladas.
- Si ya tiene 3 reservas activas, se muestra aviso antes de pagar.

## 13. Cancelaciones

- Cancelacion gratis hasta 6 horas antes de la reserva.
- Si faltan menos de 6 horas, el usuario no puede cancelar gratis.
- Para MVP se muestra: "Contacta con el club".
- No implementar no-show ni penalizaciones en MVP.

## 14. Pricing

El precio se calcula por bloques de 30 minutos.

No se guarda un unico precio fijo por duracion, porque una reserva puede cruzar tramos de precio.

Reglas actuales:

- Lunes a viernes 08:00-17:00: precio valle.
- Lunes a viernes 17:00-23:00: precio punta.
- Si una reserva cruza de valle a punta, se calcula proporcionalmente por bloques de 30 minutos.
- Fin de semana tendra reglas propias configurables en el futuro.

Ejemplo:

- Reserva 16:30-18:00.
- 16:30-17:00: valle.
- 17:00-17:30: punta.
- 17:30-18:00: punta.
- Total: suma de los 3 bloques.

## 15. Pagos

MVP de pagos:

- Stripe Checkout.
- Pago online obligatorio para confirmar.
- La reserva queda `pending_payment` hasta confirmacion real.
- La confirmacion solo ocurre mediante webhook de Stripe.
- No confirmar solo por redireccion del usuario.
- Metodos deseados: tarjeta y Bizum si esta disponible en la cuenta/pais.
- No asumir Bizum para futuras membresias recurrentes.

## 16. Estados de reserva

- `pending_payment`
- `confirmed`
- `cancelled`
- `expired`
- `blocked`
- `event`

## 17. Seguridad

- Supabase Auth para autenticacion.
- Row Level Security en Supabase.
- Usuario normal solo ve y gestiona sus propias reservas.
- Admin puede ver y gestionar todas.
- No exponer claves secretas en frontend.
- Stripe secret keys solo en backend/server.
- Supabase service role nunca en navegador.

## 18. Pantallas minimas

1. Home / Disponibilidad.
2. Login.
3. Modal/drawer de reserva.
4. Checkout redirect.
5. Reserva confirmada.
6. Mis reservas.
7. Cancelar reserva.
8. Admin dashboard.

## 19. Futuro preparado, no MVP

### Creditos

El usuario podra pagar, por ejemplo, 100 EUR y recibir 120 EUR de saldo para reservas. No implementar ahora.

### Premium

Usuarios con cuota mensual y descuento en alquileres. No implementar ahora.

### Americana/eventos avanzados

Eventos que bloquean varios bloques consecutivos y posiblemente varias pistas. En MVP, admin puede crear eventos internos simples.

## 20. Criterios de aceptacion

- Un usuario puede iniciar sesion con Google o email.
- Un usuario puede ver disponibilidad de las 3 pistas.
- Un usuario puede seleccionar un slot.
- El sistema muestra opciones de 60 y 90 minutos.
- Si no hay hueco para 90, 90 aparece deshabilitado.
- El precio se muestra antes de pagar.
- El precio se calcula por bloques de 30 minutos.
- Si la reserva cruza tramo barato/caro, el precio se calcula correctamente.
- No se puede reservar fuera de 08:00-23:00.
- No se puede reservar mas alla de 7 dias.
- No se pueden tener mas de 3 reservas activas.
- No pueden existir reservas solapadas en la misma pista.
- Si pueden existir reservas consecutivas exactas.
- Cuando alguien inicia reserva, otros usuarios ven el slot en naranja temporalmente.
- Si el pago se confirma, la reserva queda `confirmed`.
- Si el pago falla o expira, el slot vuelve a estar disponible.
- El usuario puede ver sus reservas.
- El usuario puede cancelar gratis hasta 6 horas antes.
- Si faltan menos de 6 horas, se le indica que contacte con el club.
- El admin puede bloquear pistas y crear eventos internos.
