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
  // Exclude temp directory and backup files from the build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  typescript: {
    // Exclude temp directory from TypeScript checking
    tsconfigPath: './tsconfig.json',
  },
  // Prevent 'ws' package from being included in client bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace the 'ws' module with an empty module on the client side
      config.resolve.alias.ws = false;
    }
    
    // Exclude temp directory and backup files from the build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/temp/**', '**/*.bak', '**/node_modules/**']
    };
    
    return config;
  },
};

module.exports = nextConfig;
