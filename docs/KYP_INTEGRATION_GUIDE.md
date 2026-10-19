# KYP integration guide (planned boundary)

No KYP repository was available during preflight, so this document records a future boundary rather than a completed integration. The recommended boundary is a named `EcgLab` component with typed props for initial lead, paper speed, gain, grid visibility, rhythm preset, learning mode, optional case ID, and event callbacks.

The engine should be imported independently from `src/engine/`. The host should own routing and authentication. Styles must be scoped or token-mapped; no global reset should be copied into KYP. The standalone module currently has no KYP dependency and no credentials. A future adapter should be added only after inspecting KYP's actual build, routing, and CSS conventions.

Illustrative usage:

```tsx
<EcgLab initial={{ lead: 'V3', paperSpeed: 25, gain: 20, showGrid: true }} />
```

This example is not a completed KYP integration.

