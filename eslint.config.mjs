import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
    globalIgnores(["node_modules", ".yarn", "main.js"]),
    ...obsidianmd.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["eslint.config.mjs", "esbuild.config.mjs"],
                },
            },
        },
    },
    {
        files: ["scripts/**", "esbuild.config.mjs"],
        rules: {
            "obsidianmd/no-nodejs-modules": "off",
            "obsidianmd/rule-custom-message": "off",
            "no-restricted-globals": "off",
        },
    },
    prettier,
]);
