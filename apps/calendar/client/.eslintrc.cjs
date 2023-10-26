module.exports = {
  root: true,
  env: {
    jest: true,
    browser: true,
    node: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaFeatures: {
        jsx: true
    }
  },
  plugins: ['vue3-jsx'],
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:vuejs-accessibility/recommended',
    '@vue/eslint-config-prettier'
  ],
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'vuejs-accessibility/label-has-for': 'off'
  }
};
