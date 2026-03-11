module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Optional: override any rules here
    "body-max-line-length": [1, "always", 100],
  },
};
