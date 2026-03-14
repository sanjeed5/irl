# irl

A mobile-first single-page app for displaying QR codes of your social and profile links at in-person events.

## Features

- QR codes for X (Twitter), LinkedIn, and Website
- One-tap platform switching
- Links saved locally via `localStorage` — no backend, no login
- Large, scannable QR codes
- Screen wake lock keeps display on while showing QR
- Works fully offline after first load

## Usage

1. Open the site on your phone
2. Enter your X, LinkedIn, and/or Website URLs and tap **Save Links**
3. Tap a platform button to show its QR code
4. Show the QR to someone to scan
5. Tap **Edit** any time to update your links

## Tech

- Plain HTML, CSS, and JavaScript
- [qrcode](https://github.com/soldair/node-qrcode) library via CDN
- `localStorage` for persistence
- Static hosting — no server required
