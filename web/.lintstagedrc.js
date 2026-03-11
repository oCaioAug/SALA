module.exports = {
  // Format TS/JS files and run ESLint
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  // Format other file types
  "*.{json,css,md,html}": ["prettier --write"],
};
