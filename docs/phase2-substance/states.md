# Phase 2 State Taxonomy

## Primary UI States

1. `idle`
   No file loaded.
2. `preflighting`
   File bytes are being sniffed and checked before decode.
3. `preflight-blocked`
   The file is invalid or unsafe to decode.
4. `decoding`
   Browser decode is running.
5. `decoded-ready`
   Audio metrics, source profile, and recommendations are available.
6. `auto-mastering`
   The app is generating the first guess automatically.
7. `manual-mastering`
   The user has requested a rerun with edits.
8. `mastered`
   A result with provenance exists.
9. `exporting`
   A rendered result is being encoded for download.
10. `cancelled`
    The most recent in-flight mastering/export run was cancelled.
11. `recoverable-error`
    The app can continue after showing a next step.
12. `fatal-error`
    Rendering or a non-recoverable browser capability problem prevents use.

## Exit Rules

1. Every non-terminal state exposes a visible exit:
   cancel, retry, import another file, or rerun mastering.
2. `preflight-blocked` preserves the prior successful result until a new file replaces it.
3. `cancelled` returns to the last stable analyzed state.
4. `recoverable-error` never clears the user's previous successful analysis or master.
