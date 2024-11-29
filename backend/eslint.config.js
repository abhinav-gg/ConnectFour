import js from "@eslint/js"
import ts from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"

export default [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                ecmaVersion: 2020,
                sourceType: "module"
            },
            globals: {
                ...globals.node
            }
        },
        plugins: {
            "@typescript-eslint": ts
        },
        rules: {
            // TypeScript specific rules
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-empty-function": "warn",
            "@typescript-eslint/no-var-requires": "off",
            
            // General rules
            "no-console": "off",
            "no-debugger": "warn",
            "no-unused-vars": "off", // Using TypeScript's version instead
            "no-undef": "off", // TypeScript handles this
            "semi": ["warn", "never"],
            "quotes": ["off", "single"],
            "indent": ["off", 2],
            "comma-dangle": ["warn", "never"],
            "object-curly-spacing": ["warn", "always"]
        }
    }
]