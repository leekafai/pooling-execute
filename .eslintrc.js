module.exports = {
    "overrides": [
        {
            "files": ['*.js'],
            "parser": "babel-eslint",
            "env": {
                "commonjs": true,
                "es2021": true,
                "node": true
            },
            "extends": "eslint:recommended",
            "parserOptions": {
                "ecmaVersion": 12
            },
            "rules": {
            }
        },
        {
            "files": ['*.ts', '*.tsx'],
            "env": {
                "es2021": true,
                "node": true
            },
            "extends": [
                "eslint:recommended",
                "plugin:@typescript-eslint/recommended"
            ],
            "parser": "@typescript-eslint/parser",
            "parserOptions": {
                "ecmaVersion": 12,
                "sourceType": "module"
            },
            "plugins": [
                "@typescript-eslint"
            ],
            "rules": {
            }
        },
    ]

};
