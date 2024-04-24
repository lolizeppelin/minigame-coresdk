module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // ecmaVersion用来指定你想要使用的 ECMAScript 版本
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',

    'prettier/prettier': 'off',
    'spaced-comment': 'off',
    'camelcase': 'off',
    'object-shorthand': 'off',
    'class-methods-use-this': 'off',
    'dot-notation': 'off',

    'no-console': 'off',
    'no-unused-expressions': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',

    'prefer-template': 'off',
    'prefer-destructuring': 'off',

    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'lines-between-class-members':'off',
    'no-shadow':'off',
  },
};
