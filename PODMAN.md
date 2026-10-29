# Correr con Podman

El `Dockerfile` y el `docker-compose.yml` no necesitan cambios.

## 1. Desinstalar Docker Desktop (si lo tenés)

Cerrá Docker Desktop y desinstalalo:

- macOS: `brew uninstall --cask docker` (o arrastrá la app a la Papelera)
- Windows: Configuración > Aplicaciones > Docker Desktop > Desinstalar

## 2. Instalar Podman Desktop

- macOS: `brew install --cask podman-desktop`
- Windows: `winget install RedHat.Podman-Desktop`

Abrí Podman Desktop y seguí el asistente inicial hasta que termine.

Después andá a **Settings > Resources**, y en el recuadro **Compose** hacé clic en **Setup**.

## 3. Correr el proyecto

```bash
podman compose up --build -d
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/docs

Ver los logs:

```bash
podman compose logs -f
```

Detener:

```bash
podman compose down
```

## Equivalencias: CLI y Podman Desktop

| Acción | CLI | Podman Desktop |
| --- | --- | --- |
| Ver contenedores | `podman ps` | Containers |
| Ver imágenes | `podman images` | Images |
| Ver logs | `podman logs -f feedback-collector_api_1` | Containers > contenedor > Logs |

Los comandos de `podman` son los mismos que los de `docker`: reemplazá `docker` por `podman`.
