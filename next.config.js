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
  // Your other Next.js config options go here
};

module.exports = nextConfig;
