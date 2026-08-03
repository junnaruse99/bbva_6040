# 6040 — Presencialidad BBVA

App móvil (Android e iOS) super sencilla para registrar tu asistencia a la
oficina y saber en todo momento si vas a cumplir tu presencialidad del 60%.

## ¿Cómo funciona?

**La regla 60/40**: cada mes tienes que ir a la oficina el 60% de los días
laborables (lunes a viernes), descontando tus vacaciones y los feriados,
redondeando hacia arriba:

```
meta del mes = ⌈ (laborables − vacaciones − feriados) × 0.6 ⌉
```

Ejemplo: un mes con 21 días laborables y 2 días de vacaciones →
⌈19 × 0.6⌉ = ⌈11.4⌉ = **12 días de oficina**.

Los **feriados nacionales de Perú 🇵🇪 vienen precargados** (los 14 de fecha
fija más Jueves y Viernes Santo, calculados para cualquier año) y descuentan
automáticamente de la meta. Si fuiste a la oficina un feriado, puedes marcarlo
como asistido y tu marca tiene prioridad.

## Pantallas

1. **Marcar asistencia** — al abrir la app te pregunta con dos botones grandes:
   *¿Fuiste hoy a la oficina?* → **Sí, fui** / **No fui**, o **Saltar**.
   Si ya marcaste hoy, va directo al calendario.
2. **Calendario** — muestra el mes con colores (fui / no fui / vacaciones /
   feriado / planificado), tu meta del mes, cuántos días llevas, cuántos te
   faltan y cuántos días laborables quedan disponibles. Si ya no alcanzan los
   días del mes para cumplir la meta, aparece un **aviso en rojo**. Toca
   cualquier día para marcarlo o corregirlo.
3. **Plan** — marca en el calendario qué días planeas ir para cumplir tu meta
   y activa un **recordatorio de lunes a viernes** a la hora que elijas para
   que la app te pregunte si fuiste o no.

Todos los datos se guardan en tu teléfono (no hay servidor ni cuenta).

## Probarla solo con el celular (sin laptop)

**Opción A — Versión web (instantánea).** La app también corre en el navegador.
Abre el enlace del artifact publicado desde Claude (o genera uno nuevo con
`npx expo export --platform web`). Todo funciona igual salvo los
recordatorios, que solo existen en la app nativa.

**Opción B — APK de Android vía GitHub Actions (sin instalar nada).**
Todo se hace desde el navegador del celular:

1. Crea una cuenta gratuita en [expo.dev](https://expo.dev) y genera un token
   en *Settings → Access tokens*.
2. En GitHub: *Settings → Secrets and variables → Actions → New repository
   secret*, nombre `EXPO_TOKEN`, pega el token.
3. Pestaña *Actions → Build APK Android (EAS) → Run workflow*.
4. En unos minutos el APK aparece en [expo.dev](https://expo.dev) (sección
   *Builds*); descárgalo e instálalo en tu Android.

**Opción C — Expo Snack.** Si el repositorio es público, abre
`https://snack.expo.dev/@git/github.com/<usuario>/<repo>@<rama>` en el celular
y ejecútalo en la app **Expo Go** (pestaña *My Device*).

## Cómo ejecutarla

Requisitos: Node.js 20+ y la app **Expo Go** en tu teléfono
([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) /
[iOS](https://apps.apple.com/app/expo-go/id982107779)).

```bash
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android) o con la cámara (iOS) y la app se
abre en tu teléfono.

> Nota: en Expo Go las notificaciones programadas tienen limitaciones en
> Android; para probarlas al 100% usa un *development build* o el APK.

## Cómo generar la app instalable

Con [EAS Build](https://docs.expo.dev/build/introduction/) (cuenta gratuita de
Expo):

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # genera un APK para Android
eas build -p ios                          # requiere cuenta de Apple Developer
```

## Desarrollo

```bash
npm run typecheck   # verificación de tipos
npm test            # tests de la lógica de cálculo (node:test + tsx)
```

Estructura:

```
App.tsx                     # navegación y estado global
src/logic/attendance.ts     # cálculo 60/40 (funciones puras, con tests)
src/storage/store.ts        # persistencia local (AsyncStorage)
src/notifications.ts        # recordatorios lun-vie (expo-notifications)
src/screens/                # CheckIn, Calendario y Plan
src/components/             # grilla de calendario y cabecera de mes
tests/attendance.test.ts    # tests del cálculo
```

## Hoja de ruta

- [ ] **Auto check-in por ubicación**: usar geofencing (`expo-location` +
      `expo-task-manager`) para detectar cuando llegas a la oficina y enviar
      una push con un solo toque para marcar la asistencia.
- [x] Precargar feriados del país automáticamente (Perú 🇵🇪).
- [ ] Feriados de otros países / días no laborables decretados.
- [ ] Widget con el contador de días restantes.
- [ ] Exportar el historial del mes (CSV).
