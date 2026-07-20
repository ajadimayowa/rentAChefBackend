# Chef Platform Module

This module implements an enterprise-grade Chef Service Rental architecture using:

- Clean Architecture + DDD
- Workflow Registry Pattern
- Strategy Pattern (pricing + payment)
- Repository Pattern
- Booking State Machine

## Core Entry Points

- `bootstrap.ts` → module composition root
- `presentation/routes/platform.routes.ts` → API routes
- `application/engines/*` → booking, quotation, payment, chef assignment engines
- `application/workflows/*` → workflow definitions + zod validation
- `infrastructure/database/schemas/*` → Mongoose models and indexes
- `infrastructure/repositories/mongoRepositories.ts` → repository implementations

## Minimal Test Runner

Use project build to validate module compilation:

```bash
npm run build
```
