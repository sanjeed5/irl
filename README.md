# Social QR

A local-first, mobile-friendly page for sharing X, LinkedIn, and website profiles through large QR codes.

## How it works

- Add one or more handles or links.
- Links are stored only in that browser's local storage.
- Switch profiles and show a presentation-sized QR code at events.
- No account, backend, or analytics.

See [UX-FLOWS.md](./UX-FLOWS.md) for the complete new-user, returning-user, editing, and presentation flows.

## Development

```bash
python3 -m http.server 4173
npm test
```

## Deployment

```bash
wrangler pages deploy . --project-name=irl --branch=main
```

The QR generator is vendored from [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) under the MIT license so the core sharing flow does not depend on a third-party CDN.
