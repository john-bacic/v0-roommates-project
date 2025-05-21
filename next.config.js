// Get the current git commit hash
const { execSync } = require('child_process');

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.error('Error getting git commit hash:', error);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GIT_COMMIT_HASH: commitHash,
  },
  // Prevent 'ws' package from being included in client bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace the 'ws' module with an empty module on the client side
      config.resolve.alias.ws = false;
    }
    return config;
  },
};

module.exports = nextConfig;
