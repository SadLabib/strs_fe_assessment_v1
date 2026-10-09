# Frontend

The Next.js app for the underwriting training platform.

- Setup, testing, architecture and trade-offs: [the main README](../README.md)
- Workflow and interface decisions: [docs/DESIGN.md](docs/DESIGN.md)

```bash
nvm use            # Node 24, from .nvmrc
npm ci
npm run dev        # http://localhost:3000 (expects the API on :8000, see ../backend)
npm run test       # unit tests
npx playwright install chromium   # once, before the first e2e run
npm run test:e2e   # end-to-end tests; starts and reseeds the backend itself
```
