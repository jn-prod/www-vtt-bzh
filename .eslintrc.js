module.exports = {
  extends: ['custom', 'plugin:prettier/recommended'],
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
