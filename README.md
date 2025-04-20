# Generador de Videos Inspiradores

Esta aplicación permite generar videos a partir de tu texto, convirtiéndolo en audio y combinándolo con imágenes.

## Características

- Conversión de texto a voz con ElevenLabs
- Creación de videos con FFmpeg
- Interfaz de usuario moderna y atractiva
- Vista previa y descarga automática de videos

## Requisitos previos

- Node.js y npm
- Clave de API de ElevenLabs (para texto a voz)
- ID de voz de ElevenLabs

## Configuración

1. Clona este repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las claves de API:
   - Abre `src/app/services/tts.service.ts` y reemplaza `TU_ELEVEN_KEY` con tu clave de API de ElevenLabs
   - En `src/app/services/tts.service.ts`, reemplaza `VOICE_ID` con el ID de la voz que quieras usar

4. Añade imágenes:
   - Coloca tus imágenes en `src/assets/images/` con nombres como `img0.jpg`, `img1.jpg`, etc.
   - O modifica el método `loadImages()` en `src/app/components/video-generator/video-generator.component.ts` para usar tus propias rutas de imágenes

## Uso

1. Inicia el servidor de desarrollo:
   ```bash
   ng serve
   ```
2. Abre tu navegador en `http://localhost:4200`
3. Escribe el texto que quieres convertir en video
4. Haz clic en "Generar Video"
5. Espera a que se complete el proceso
6. El video se descargará automáticamente y también podrás ver una vista previa en la aplicación

## Tecnologías utilizadas

- Angular 19
- FFmpeg (para procesamiento de video)
- ElevenLabs API (para texto a voz)

## Solución de problemas

Si encuentras errores relacionados con FFmpeg, asegúrate de que tu navegador soporte WebAssembly y que no tengas bloqueadores de contenido activos.

Para problemas con la API de ElevenLabs, verifica que tu clave de API sea válida y tenga los permisos necesarios.
