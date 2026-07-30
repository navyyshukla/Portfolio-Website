import next from "eslint-config-next";

// eslint-config-next v16 ships flat config directly — no FlatCompat needed.
const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
