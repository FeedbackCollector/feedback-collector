# Mockserver para el frontend

Simula la API sin backend ni base de datos. Necesitás tener Podman instalado (ver [PODMAN.md](PODMAN.md)).

## Levantar el mock

Desde la raíz del repo:

```bash
podman compose -f mock-server/docker-compose.yml up -d
```

Queda en http://localhost:4010.

## Usarlo desde el frontend

Guardá la URL de la API en `feedback-app-web/.env`:

```
VITE_API_URL=http://localhost:4010
```

y usala en el código con `import.meta.env.VITE_API_URL` en lugar de la URL escrita a mano.
Reiniciá `npm run dev` después de crear o cambiar el `.env`.

## Usuarios de prueba

Son los mismos que ya tienen

## Datos

Viven en memoria: lo que crees, edites o borres se mantiene mientras el mock esté corriendo.
Para volver a los datos iniciales:

```bash
podman restart feedback-mock
```

## Ver logs

```bash
podman logs -f feedback-mock
```

## Editar los datos o las rutas

Abrí `mock-server/mockoon-env.json` con la app de escritorio [Mockoon](https://mockoon.com/download/), editá y reiniciá el mock.

## Detener

```bash
podman compose -f mock-server/docker-compose.yml down
```
