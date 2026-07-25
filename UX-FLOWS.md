# Social QR: UX flows and redesign

## Product job

Let someone share the right profile in seconds while standing face-to-face, without searching, typing, or handing over an unlocked phone.

## Primary users

- **New user:** has not saved any links on this browser.
- **Returning user:** has one or more links saved locally.
- **Person scanning:** opens the selected profile with their phone camera.

## New-user flow

1. Open Social QR.
2. See a single setup screen, not an empty QR viewer.
3. Understand that links stay on this device.
4. Add at least one X handle, LinkedIn handle, or website URL.
5. Submit.
6. Invalid fields stay visible with a specific inline error.
7. Valid values are normalized into full HTTPS URLs.
8. Links are saved in local browser storage.
9. Move directly to the sharing view with the first configured profile selected.
10. Show a large, immediately scannable QR code.

## Returning-user flow

1. Open Social QR.
2. Restore saved links and the last selected profile.
3. Land directly on the QR sharing view.
4. Tap a configured profile to switch the QR code instantly.
5. Choose one of four actions:
   - Let the other person scan the visible code.
   - Open presentation mode for a larger code.
   - Copy the profile link.
   - Open the profile directly.
6. Tap **Edit** to update, add, or remove links.
7. Save changes and return to the selected QR code, or cancel without changing saved links.

## Presentation flow

1. Tap the QR code or **Show full screen**.
2. Open a high-contrast overlay with the selected profile name and a large QR code.
3. Keep the display awake when the browser supports Screen Wake Lock.
4. Close with the visible close button or Escape.
5. Release the wake lock and return to the sharing view.

## Editing and recovery flows

### Edit existing links

1. Tap **Edit**.
2. Existing values appear in editable fields.
3. Clear a field to remove that profile.
4. Save at least one valid profile.
5. Preserve the current selection when it still exists; otherwise select the first saved profile.

### Cancel editing

1. Tap **Cancel**.
2. Discard unsaved field changes.
3. Restore the saved links and return to sharing.

### Clear saved data

1. Tap **Edit**.
2. Tap **Clear saved data from this device**.
3. Tap the armed confirmation a second time within three seconds.
4. Remove all local data and return to the fresh setup screen.

### Invalid or unavailable state

- Invalid values get an inline platform-specific message and focus moves to the first invalid field.
- If storage is unavailable, the current session still works and the user gets a clear warning.
- If QR generation fails, the direct profile link remains available.
- The QR library is hosted with the app, so sharing does not depend on a third-party CDN after the page loads.

## Problems in the previous version and fixes

| Previous experience | Redesigned experience | Why |
| --- | --- | --- |
| New users saw setup and a dead QR viewer together | New users see only the setup task | Removes competing hierarchy and empty controls |
| Header button said **Save links** but did not submit the form | Setup has one clear submit button; the header action is **Edit** only while sharing | Labels now match behavior |
| Disabled tabs advertised profiles that were not configured | Only configured profiles appear | Removes dead ends and visual noise |
| Returning users had to scan multiple cards to find the QR | QR and profile switcher are the primary view | Matches the event-time job |
| QR code was visually nested inside several large cards | One focused QR stage with strong contrast and more usable area | Faster scanning and better use of a phone screen |
| No dedicated presentation mode | Full-screen overlay, larger QR, optional wake lock | Better for face-to-face sharing |
| Inputs accepted URLs only in practice | X and LinkedIn handles are accepted and normalized | Faster setup with less formatting work |
| Validation appeared as one distant status line | Errors appear beside the relevant input | Easier correction and better accessibility |
| Saved-link privacy was unclear | Setup and sharing views state that data stays on-device | Builds trust and explains persistence |
| There was no way to remove all locally saved data | Editing includes a guarded two-tap clear action | Gives shared-device users explicit control without accidental deletion |
| CDN failure could break QR generation | QR dependency is vendored with the site | More reliable at events and on weak networks |
| No quick utility actions | Copy and open actions sit beside full-screen sharing | Supports non-scanning fallbacks |
| Long raw URLs dominated the visual hierarchy | Compact platform handle or hostname is shown | Keeps attention on the QR code |
| Editing could overwrite values before canceling | Cancel restores persisted values | Makes edits reversible |
| Tabs lacked keyboard navigation | Arrow keys, Home, and End move between profile tabs | Correct tablist behavior |
| Motion and hover behavior was generic | Short property-specific transitions, press feedback, reduced-motion support | Feels responsive without slowing repeated use |

## Design principles

- QR first for returning users.
- One task per screen state.
- No disabled or decorative controls.
- Minimum 44px touch targets.
- High contrast around the QR code.
- Local-first and transparent about storage.
- Useful without installation, account creation, or a backend.
- Motion only for state feedback, always respecting reduced-motion preferences.
