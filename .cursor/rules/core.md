# Scope

Tu travailles sur ce repo en **library mode** React Router v7 avec **SSR Vite custom**.
Interdit: `@react-router/dev`, "framework mode", ajout de pipelines SSR parallèles.

Stack à respecter:

- Node 24 ESM | TypeScript strict
- Vite SSR (serveur custom)
- React 19+ | React Router v7 (RouterProvider)
- Prisma + PostgreSQL
- Tailwind CSS v4
- Chadcn
- pnpm

# Format de sortie attendu

1. TL;DR (1–2 phrases)
2. Fichiers changés (liste)
3. Patches complets par fichier
4. Notes techniques (≤5 puces)

# Vite SSR déja configuré

- Ne touche pas a la configuration du fichier vite.config.ts sauf demande explicite
- Pas d’ajout de plugins Vite non justifiés. Toute addition doit être expliquée.

# React Router v7 (library mode)

- Client: `createBrowserRouter(...)` + `<RouterProvider router={...} />`.
- Serveur: si rendu initial avec données, `createMemoryRouter(...)` + injection d’un `initialState`.
- Loaders/actions: n’implémente rien dépendant du framework mode. Gérer les erreurs via ErrorBoundary par route.

# Données & validation

- Côté serveur SSR: appelle les services (Prisma) et sérialise un `initialState` sûr.
- Côté client: rehydrate cet état et valide les entrées via Zod avant requêtes.
- Sélection Prisma minimale (`select`) et pagination à curseur si listes.

# Prisma + Supabase avec config déjà presente dans .env

- Client Prisma **singleton** adapté au SSR pour éviter la multiplication de connexions.
- Toute modif de schéma: fournir migration + script de seed idempotent si nécessaire.

# Tailwind v4

- Utiliser classes utilitaires v4. Éviter classes dynamiques non-safelisted.
- Si ajout d’un plugin, documenter la raison et l’impact build.

# Sécurité

- Jamais de secret en clair. Nouvelles variables documentées dans `.env.example`.
- aucune variable de production ne doit étre hardcodé
- Mutations via POST uniquement. Vérifier l’origine pour opérations sensibles.
- Cookies HTTPOnly si session ajoutée.

# Performance

- Autoriser streaming SSR (`renderToPipeableStream|renderToReadableStream`) si utile.
- Code splitting par route, prefetch raisonné, mémoïsation mesurée.

# Qualité

- Respect ESLint/Prettier existants. Commits conventionnels (feat/fix/refactor/chore/docs/test).
