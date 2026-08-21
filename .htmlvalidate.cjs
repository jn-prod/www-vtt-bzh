module.exports = {
  extends: ['html-validate:recommended'],
  rules: {
    'doctype-style': ['error', { style: 'lowercase' }],
    // Les templates Jekyll suivent le style XHTML déjà utilisé par le projet.
    'void-style': ['error', { style: 'selfclosing' }],
    // Liquid génère des lignes blanches avec indentation ; ce n'est pas un défaut HTML.
    'no-trailing-whitespace': 'off',
    // Les numéros sont des données publiques brutes ; les modifier au rendu serait trompeur.
    'tel-non-breaking': 'off',
  },
};
