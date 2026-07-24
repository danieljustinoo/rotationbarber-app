# Rotation Barber App

App React mobile-first com backend local em SQLite e wrapper iOS via Capacitor.

## Correr em desenvolvimento

Terminal 1:

```bash
npm run api
```

Terminal 2:

```bash
npm run dev
```

Depois abre:

- Mac: http://localhost:5180
- iPhone na mesma rede: http://192.168.0.47:5180

## Base de dados

A API corre em:

```text
http://localhost:5181
```

Endpoints principais:

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
GET    /api/services
GET    /api/barbers
GET    /api/appointments
POST   /api/appointments
PATCH  /api/appointments/:id/cancel
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:serviceId
```

O ficheiro SQLite é criado em `server/data/rotationbarber.sqlite`.

Marcações e favoritos exigem sessão iniciada. A app guarda o token de sessão no `localStorage`.

## App iOS

Para sincronizar o React com o projeto iOS:

```bash
npm run sync:ios
```

Para abrir no Xcode:

```bash
npm run open:ios
```

No Xcode, escolhe a tua conta Apple em **Signing & Capabilities**, seleciona um iPhone/simulador e carrega em Run.

Durante desenvolvimento, mantém a API ligada com `npm run api`. Se o IP do Mac mudar, corre novamente `npm run sync:ios`.

Para produção, troca `VITE_API_BASE_URL` para um domínio HTTPS real antes de compilar.
