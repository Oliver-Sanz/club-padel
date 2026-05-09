# Club Padel MVP

Guia sencilla para ejecutar la primera version de la app.

## 1. Que necesitas instalar

Necesitas Node.js. Node trae dos cosas:

- `node`: ejecuta JavaScript.
- `npm`: instala las librerias del proyecto.

Para empezar, instala la version LTS desde:

https://nodejs.org/

Descarga el instalador para macOS, abre el `.pkg` y acepta los pasos por defecto.

## 2. Comprobar que Node y npm estan instalados

Abre la app Terminal de macOS y ejecuta:

```bash
node --version
npm --version
```

Si ambos comandos muestran un numero de version, vamos bien.

## 3. Entrar en la carpeta del proyecto

En Terminal, ejecuta:

```bash
cd "/Users/oliver.sanz/Documents/New project"
```

Importante: las comillas son necesarias porque la carpeta tiene un espacio en el nombre.

## 4. Instalar dependencias

Dentro de la carpeta del proyecto, ejecuta:

```bash
npm install
```

Esto descarga las librerias que aparecen en `package.json`. Puede tardar unos minutos.

## 5. Arrancar la app

Ejecuta:

```bash
npm run dev
```

Si todo va bien, veras algo parecido a:

```txt
Local: http://localhost:3000
```

Abre esa direccion en el navegador:

```txt
http://localhost:3000
```

## 6. Ejecutar tests

Cuando quieras comprobar las reglas de negocio:

```bash
npm run test
```

Estos tests revisan cosas como:

- solapes de reservas;
- reservas consecutivas permitidas;
- precio por bloques de 30 minutos;
- deshabilitar 90 minutos si no hay hueco;
- cancelacion gratis hasta 6 horas antes.

## 7. Que incluye esta Fase 1

- Calendario visual con 3 pistas.
- Scroll horizontal sincronizado.
- Datos mock, sin base de datos real.
- Calculo de disponibilidad en memoria.
- Calculo de precio en memoria.
- Drawer/modal para elegir 60 o 90 minutos.
- Sin Stripe todavia.
- Sin Supabase todavia.

## 8. Configurar Supabase para Fase 2

La app ya esta preparada para usar Supabase Auth y datos reales.

Pasos:

1. Crea un proyecto en Supabase.
2. En Supabase, abre SQL Editor.
3. Ejecuta el contenido de:

```txt
supabase/schema.sql
```

Si el SQL falla a mitad de camino, ejecuta primero:

```txt
supabase/dev_reset.sql
```

Despues vuelve a ejecutar:

```txt
supabase/schema.sql
```

4. Crea un archivo `.env.local` en la raiz del proyecto.
5. Copia las variables de `.env.example` y rellena estas dos:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key_o_anon_key
```

Supabase tambien permite usar `NEXT_PUBLIC_SUPABASE_ANON_KEY`, pero recomendamos
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` porque es el nombre actual en su documentacion.

6. En Supabase Auth, configura las URLs:

```txt
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/auth/callback
```

7. Para Google Login, activa el proveedor Google en Supabase Auth Providers.

Cuando estas variables existen, la app deja de depender solo de mocks:

- muestra si los datos vienen de Supabase o mock local;
- permite login con Google;
- permite login por email con magic link;
- permite crear una reserva real confirmada sin pago para Fase 2.

Importante: la reserva sin pago es temporal. En Fase 4 se cambiara por Stripe Checkout.

## 9. Dar permisos de admin

Para entrar en `/admin`, tu usuario debe tener rol `admin`.

Despues de iniciar sesion al menos una vez, ve a Supabase SQL Editor y ejecuta:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-email@ejemplo.com';
```

Luego abre:

```txt
http://localhost:3000/admin
```

## 10. Si algo falla

Si `npm install` falla, copia el mensaje de error completo.

Si `npm run dev` funciona pero no se abre la web, revisa que estes entrando en:

```txt
http://localhost:3000
```

Si el puerto 3000 esta ocupado, Next.js suele ofrecer otro puerto, por ejemplo:

```txt
http://localhost:3001
```

Si ves una pantalla de error despues de varios cambios de codigo, limpia la cache de Next con:

```bash
npm run dev:clean
```

Ese comando no borra tu codigo. Solo borra la carpeta generada `.next` y arranca de nuevo.
