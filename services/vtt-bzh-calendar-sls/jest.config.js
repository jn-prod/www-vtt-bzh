module.exports = {
  preset: 'ts-jest',
  globalSetup: './jest.global-setup.js',
  transform: {
    "^.+\\.(j|t)sx?$": "esbuild-jest"
  }
};
