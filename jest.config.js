module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'business/**/*.js',
    'data/repositories/InMemoryBookRepository.js'
  ],
  coverageThreshold: {
    global: {
      statements: 85,
    },
  },
};
