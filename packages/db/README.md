# @rufieltics/db

Database package for Rufieltics application. This package provides database connection and entity repositories for managing data related to users, stores, products, orders, and more.

## Features

- Database connection using Prisma ORM
- Entity repositories for various data models
- Utility functions for database operations

```bash
pnpm add @rufieltics/db --workspace-root
```

## Usage

Import the database connection and entity repositories in your application code:

```typescript
import { db } from '@rufieltics/db'
import { createUser } from '@rufieltics/db/entities/user'

async function main() {
  const newUser = await createUser({
    email: 'user@example.com',
    name: 'John Doe',
  })
  console.log('New User:', newUser)
}
main().catch(console.error)
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
