# @rufieltics/emails

This package holds the transactional and security emails that Rufieltics sends. The templates are written with React Email, and the wording is kept in its own layer so the same template can render in more than one language.

The API renders these and hands them to its mail queue. Nothing outside this package needs to know the markup, only which email to send and the values to fill in.

## What is in here

- Templates in `src/templates/`. A code email for one time codes, a link email for actions such as password reset, an alert email for security notices, and a method email for changes to security settings.
- A copy layer in `src/copy/` that holds the wording for each template in English and Indonesian.
- A `renderEmail` function that takes an email name, a locale, and the values, then returns the subject, the HTML, and a plain text version ready to send.

## Usage

```typescript
import { renderEmail } from '@rufieltics/emails'

const message = await renderEmail('password-reset', 'en', {
  name: 'Owner',
  url: 'https://app.example.com/reset-password?token=...',
})
```

## Build

```bash
pnpm --filter @rufieltics/emails build
```
