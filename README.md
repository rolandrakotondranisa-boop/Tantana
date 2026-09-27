# Générateur d'Ordre de Mission

Application React + Vite + Tailwind permettant de remplir un formulaire et de générer un PDF A4.

## Installation

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse affichée par Vite.

## Build production

```bash
npm run build
npm run preview
```

## Personnalisation

Remplacer :
- `public/assets/logo.png`
- `public/assets/tampon.png`

Les positions et tailles des éléments fixes se règlent dans `src/App.jsx`.

Le PDF est généré côté navigateur avec `html2canvas` + `jsPDF`.
