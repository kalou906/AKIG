module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        // Cible tous les navigateurs >0.25% de parts de marché, sauf obsolètes
        targets: ">0.25%, not dead",
        useBuiltIns: "usage", // n'importe que les polyfills nécessaires
        corejs: 3,
        modules: false // Pour tree-shaking en prod
      }
    ],
    "@babel/preset-react"
  ],
  plugins: [
    "@babel/plugin-transform-runtime", // optimise async/await et générateurs
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator"
  ],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-react"
      ]
    }
  }
};
