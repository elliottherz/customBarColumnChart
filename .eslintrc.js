module.exports = {
    "extends": "airbnb-base",
    "parserOptions": {
        "ecmaVersion": 6
    },
    "env": {
        "node": true
    },
    "rules": {
        "no-console": 0,
        "vars-on-top": 0,
        "valid-jsdoc": 2,
        "require-jsdoc": 0,
        "linebreak-style": 0,
        "consistent-return": 0,
        "id-length": ['error', {'min': 2, 'exceptions': ['x', 'y']}],
        "import/no-unresolved": 0,
        "func-names": ['error', 'as-needed'],
        "arrow-parens": ['error', 'always'],
        "comma-dangle": ['error', 'always-multiline'],
        "indent": ['error', 4, {"SwitchCase": 1}],
        "no-param-reassign": ['error', { props: false }],
        "function-paren-newline": ['error', 'consistent'],
        "no-underscore-dangle": ["error", { "allow": ["_id"] }],
        "no-plusplus": ['error', { allowForLoopAfterthoughts: true }],
        "no-unused-expressions": [2, { allowShortCircuit: true, allowTernary: true }],
        "capitalized-comments": ['error', 'always', { 'ignoreConsecutiveComments': true }],
        "jsx-a11y/href-no-hash": 'off',
        "max-len": ['error', {'code': 120}]
    },
    plugins: [],
    globals: {
        "prism": 0,
        "$$get": 0,
        "_": 0,
        "mod": 0,
        "$": 0,
        "Highcharts": 0,
        "defined": 0,
        "angular": 0,
        "document": 0,
        "window": 0,
        "$$set": 0,
        "$$": 0,
        "moment": 0,
        "navigator": 0,
        "location": 0
    }
};