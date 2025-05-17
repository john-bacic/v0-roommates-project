const { execSync } = require('child_process');

try {
  // Get the current commit hash
  const commitHash = execSync('git rev-parse HEAD').toString().trim();
  const shortHash = commitHash.substring(0, 7);
  
  // Output the hash in a format that can be used by Next.js
  console.log(`NEXT_PUBLIC_GIT_COMMIT_HASH=${shortHash}`);
} catch (error) {
  console.error('Error getting git commit hash:', error);
  // Fallback to a default value if git is not available
  console.log('NEXT_PUBLIC_GIT_COMMIT_HASH=dev');
}
