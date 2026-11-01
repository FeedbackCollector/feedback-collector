# Contribuir

> Ensayo de convenciones: por ahora las ramas permanentes son `developmentv2` y `mainv2`.
> Los nombres definitivos serán `development` y `main`.

## Flujo

`feat/login-form` → PR (squash) → `development` → PR (merge commit) → `main`

Todo cambio entra por PR hacia `development`, con 1 aprobación, conversaciones resueltas y checks en verde.
Nadie hace push directo a `development` ni a `main`. La rama de feature se borra después del merge.

## Ramas

Formato `tipo/nombre-en-kebab-case` (minúsculas, números y guiones).

- Válidas: `feat/login-form`, `fix/jwt-expiry`, `docs/readme`, `chore/update-deps`
- Inválidas: `Feat/login`, `feature/login`, `feat/Login`, `feat/login_form`, `fix/a--b`

Expresión: `^(feat|fix|docs|chore|refactor|test)/[a-z0-9]+(-[a-z0-9]+)*$`

## Commits y título de PR

Formato `tipo: descripción` o `tipo(scope): descripción`. Descripción corta (hasta 72 caracteres), en imperativo y sin punto final.

- Válidos: `feat: add login form`, `fix(api): handle expired token`
- Inválidos: `Feat: add login`, `feat:add login`, `update stuff`

Los merge commits y los `Revert "…"` se aceptan.

## Tipos

- `feat`: funcionalidad nueva
- `fix`: corrección de un error
- `docs`: solo documentación
- `chore`: CI/CD, dependencias, configuración
- `refactor`: cambia el código sin cambiar el comportamiento
- `test`: agrega o corrige tests
