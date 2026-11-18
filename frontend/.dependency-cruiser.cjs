// GUARDRAIL: architecture & dependency rules for the frontend.
//
// Layers (top may depend on bottom, never the reverse):
//
//   app        → composition root: routing, providers, page wiring
//   features/* → one folder per business capability, isolated from each other
//   shared     → framework-level building blocks with zero business knowledge
//
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make code impossible to reason about and to split.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'shared-is-leaf',
      severity: 'error',
      comment: 'shared/ must not know about features or app.',
      from: { path: '^src/shared/' },
      to: { path: '^src/(features|app)/' },
    },
    {
      name: 'features-not-depend-on-app',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      comment:
        'Features are isolated. Share code by moving it to shared/, or compose features in app/.',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/([^/]+)/', pathNot: '^src/features/$1/' },
    },
    {
      name: 'app-uses-feature-public-api-only',
      severity: 'error',
      comment: 'app/ may only import a feature through its index.ts.',
      from: { path: '^src/app/' },
      to: { path: '^src/features/[^/]+/.+', pathNot: '^src/features/[^/]+/index\\.ts$' },
    },
    {
      name: 'ui-does-not-call-api-directly',
      severity: 'error',
      comment: 'Components go through hooks (model/), never straight to api/.',
      from: { path: '^src/features/[^/]+/ui/' },
      to: { path: '^src/(features/[^/]+/api|shared/api)/' },
    },
    {
      name: 'no-test-code-in-prod',
      severity: 'error',
      from: { pathNot: '\\.test\\.tsx?$|^src/test/' },
      to: { path: '\\.test\\.tsx?$|^src/test/' },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      comment: 'Dead files left behind by an agent.',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '^src/test/',
          '\\.test\\.tsx?$',
        ],
      },
      to: {},
    },
    {
      name: 'only-allowlisted-runtime-deps',
      severity: 'error',
      comment:
        'Adding a runtime dependency is an architectural decision. Extend this allowlist in a human-reviewed PR.',
      from: { pathNot: '\\.test\\.tsx?$|^src/test/' },
      to: {
        dependencyTypes: ['npm'],
        pathNot: '^node_modules/(react|react-dom|zod|scheduler)/',
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      from: { path: '^src/', pathNot: '\\.test\\.tsx?$|^src/test/' },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js'],
    },
  },
};
