
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The protocol package ships TypeScript source rather than a build, so both
  // the signer and the relayer read the same file when reasoning about a drop.
  transpilePackages: ["@dead-drop/protocol"],
  webpack(config) {
    // That package writes portable ESM specifiers (`./tx.js`) so the relayer can
    // run it under plain Node. Webpack needs telling that the file on disk is
    // still `.ts`; Turbopack works this out on its own.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ...config.resolve.extensionAlias,
    };
    return config;
  },
};

export default nextConfig;
