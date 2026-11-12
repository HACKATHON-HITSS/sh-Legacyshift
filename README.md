# Legacyshift

Shell Angular 20 con Native Federation para Legacyshift. Conserva los estilos existentes y organiza el menu en tres etapas desplegables:

- **Codigo fuente:** crear o seleccionar proyecto, con adjuntos de archivos o carpetas en el microfrontend.
- **Analisis:** reglas, logica, condiciones, entradas/salidas, datos hardcodeados, deuda tecnica, vulnerabilidades, dependencias y arquitectura actual.
- **Decisiones:** aprobacion de reglas, tecnologia de destino, arquitectura objetivo, chat y exportacion.

Los submenus cargan las pantallas del microfrontend remoto `template`. La pantalla de proyecto permite seleccionar archivos o carpetas y ejecutar un analisis basico local en el navegador, sin backend ni IA. Los accesos a carga de codigo, exploracion de archivos y lenguajes/componentes se retiraron del menu, y sus modulos y rutas se eliminaron del microfrontend.

Al abrir la aplicacion en `/` o `/default`, se muestra directamente `/codigo-fuente/proyecto`, la pantalla de adjuntar documentos o carpetas. Los enlaces directos a otras secciones mantienen su destino.

## Requisitos

- Node.js 20 LTS o superior.
- npm con acceso a `https://registry.npmjs.org/`.

## Desarrollo local

```bash
npm install
npm run dev
```

La URL local por defecto es `http://localhost:4201`. El manifiesto apunta al dominio estable de produccion `https://mf-legacyshift-5ill.vercel.app/remoteEntry.json`. Para usar el remoto local, cambia la entrada `template` de `src/public/federation.manifest.json` a `http://localhost:4211/remoteEntry.json`.

## Build

```bash
npm run build
```

El resultado estatico se genera en `dist/legacyshift/browser`.

La shell usa la URL publicada del manifiesto por defecto. `REMOTE_TEMPLATE_URL` permite reemplazarla durante el build:

```bash
REMOTE_TEMPLATE_URL=https://mf-legacyshift-5ill.vercel.app/remoteEntry.json npm run build
```

El manifiesto final y la Content Security Policy se generan con esa misma URL. Los builds de produccion rechazan remotos `localhost`.

## Despliegue en Vercel

1. Crea un proyecto Vercel con `mf-PR-Guardian-AI` como Root Directory y despliegalo primero.
2. Copia la URL de `remoteEntry.json` del proyecto publicado.
3. Crea otro proyecto Vercel con `sh-PR-Guardian-AI` como Root Directory.
4. En sus variables de entorno de Build, agrega `REMOTE_TEMPLATE_URL` con la URL copiada.
5. Despliega la shell.

El despliegue del microfrontend debe permitir acceso publico, sin redirigir a login de Vercel. Revisa **Settings > Deployment Protection**: `remoteEntry.json`, los archivos JavaScript y los estilos deben ser accesibles desde el navegador de la shell. Una variable `REMOTE_TEMPLATE_URL` existente en Vercel reemplaza el manifiesto; actualizala o eliminala si apunta a otro despliegue.

La autenticacion actual es local para demostracion. Antes de habilitar usuarios reales, integra un proveedor OIDC publico y valida tokens del lado servidor.