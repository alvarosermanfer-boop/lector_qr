# lector_qr
Inserta en un excel salidas de materiales que lee a través de QR
# QR Scanner PWA (100% Estático)

Una aplicación web móvil ligera, rápida y 100% *frontend* para escanear códigos QR utilizando la cámara del dispositivo. No requiere backend, ni base de datos, ni procesos de compilación (Node/NPM).

## Características
* **WebRTC (`getUserMedia`):** Acceso nativo a la cámara desde el navegador.
* **jsQR:** Librería de decodificación ligera y sin dependencias.
* **Mobile-First:** Diseño responsive y botones táctiles optimizados.
* **Eficiente:** Escaneo limitado a ~10 fps para no drenar la batería del móvil.
* **Manejo de Errores:** Permite subir fotos de la galería si la cámara falla o se deniegan permisos.

## Despliegue en GitHub Pages (Paso a Paso)

GitHub Pages es ideal para esta app porque sirve los archivos estáticos y **fuerza HTTPS**, un requisito obligatorio de los navegadores (Chrome, Safari, Firefox) para permitir el acceso a la cámara (`getUserMedia`).

1.  **Crea un nuevo repositorio en GitHub:**
    * Ve a [github.com/new](https://github.com/new).
    * Ponle un nombre (ej. `qr-scanner`).
    * Márcalo como "Public" (Público).
    * Haz clic en "Create repository".

2.  **Sube los archivos:**
    * Sube los 3 archivos de este proyecto al repositorio: `index.html`, `styles.css` y `app.js`.
    * Haz *Commit* de los cambios.

3.  **Activa GitHub Pages:**
    * En tu repositorio de GitHub, ve a la pestaña **Settings** (Configuración).
    * En la barra lateral izquierda, busca la sección **Pages**.
    * Bajo "Build and deployment" > "Source", selecciona **Deploy from a branch**.
    * En "Branch", selecciona `main` (o `master`) y la carpeta `/ (root)`.
    * Haz clic en **Save**.

4.  **Espera un minuto y visita tu app:**
    * GitHub tardará unos segundos en desplegar.
    * Arriba en esa misma página de configuración aparecerá tu URL: `https://[tu-usuario].github.io/qr-scanner/`.
    * ¡Abre esa URL desde tu móvil y pruébalo!

## Notas Técnicas
* **HTTPS:** La cámara no funcionará en entornos `http://` puros (excepto `localhost` para desarrollo). GitHub Pages maneja el certificado SSL/HTTPS automáticamente.
* **Permisos iOS:** En dispositivos Apple (iOS Safari), el usuario debe interactuar con la pantalla (hacer clic en un botón) para que el video pueda hacer `autoplay` o arrancar la cámara. Por eso existe el botón "Iniciar Cámara".
