//recommend using plugin because native formatting rules got deprecated: https://eslint.style/guide/migration
import js from '@eslint/js';
import globals from 'globals';
import StylisticPlugin from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	eslintConfigPrettier,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: { ...globals.browser },
		},
		plugins: {
			stylistic: StylisticPlugin,
		},
		rules: {
			'stylistic/indent': ['warn', 'tab'],
			'stylistic/quotes': ['warn', 'single'],
			'stylistic/semi': ['warn', 'always'],
			'stylistic/linebreak-style': ['warn', 'unix'],
			'stylistic/eol-last': ['warn', 'always'],
		},
	},
];
