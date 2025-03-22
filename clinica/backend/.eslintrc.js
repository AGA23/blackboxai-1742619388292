module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended',
    'prettier'
  ],
  plugins: ['jest'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-duplicate-imports': 'error',
    'no-template-curly-in-string': 'error',
    'no-promise-executor-return': 'error',
    'no-unsafe-optional-chaining': 'error',

    // Best practices
    'array-callback-return': 'error',
    'consistent-return': 'error',
    'curly': ['error', 'multi-line'],
    'default-param-last': 'error',
    'eqeqeq': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'error',
    'no-floating-decimal': 'error',
    'no-param-reassign': 'error',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'require-await': 'error',
    'yoda': 'error',

    // Variables
    'no-use-before-define': ['error', { functions: false }],
    'no-var': 'error',
    'prefer-const': 'error',

    // Stylistic
    'array-bracket-spacing': ['error', 'never'],
    'block-spacing': 'error',
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': ['error', { before: false, after: true }],
    'comma-style': ['error', 'last'],
    'computed-property-spacing': ['error', 'never'],
    'eol-last': 'error',
    'func-call-spacing': ['error', 'never'],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'keyword-spacing': ['error', { before: true, after: true }],
    'linebreak-style': ['error', 'unix'],
    'max-len': ['error', { code: 100, ignoreComments: true }],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',

    // ES6
    'arrow-spacing': ['error', { before: true, after: true }],
    'no-useless-constructor': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-destructuring': ['error', {
      array: true,
      object: true
    }, {
      enforceForRenamedProperties: false
    }],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',
    'rest-spread-spacing': ['error', 'never'],

    // Jest
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  }
};