'use client';

import { useState, useEffect } from 'react';

// This will be replaced with the actual commit hash at build time
const BUILD_COMMIT_HASH = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || 'dev';

export default function GitCommitHash() {
  const [commitHash, setCommitHash] = useState<string>(BUILD_COMMIT_HASH);
  const [isLocal, setIsLocal] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true when component mounts on the client side
    setIsClient(true);

    // Only try to fetch the latest commit hash in production
    if (process.env.NODE_ENV === 'production') {
      // Function to fetch the latest commit hash from GitHub
      const fetchLatestCommitHash = async () => {
        try {
          const response = await fetch('https://api.github.com/repos/john-bacic/v0-roommates-project/commits/clean-start');
          if (response.ok) {
            const data = await response.json();
            // Get the short version of the commit hash (first 7 characters)
            const shortHash = data.sha.substring(0, 7);
            if (shortHash !== BUILD_COMMIT_HASH) {
              setCommitHash(shortHash);
              setIsLocal(false);
            }
          }
        } catch (error) {
          console.error('Error fetching latest commit hash:', error);
        }
      };

      fetchLatestCommitHash();

      // Set up an interval to refresh the commit hash every hour
      const intervalId = setInterval(fetchLatestCommitHash, 60 * 60 * 1000);
      
      // Clean up the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, []);

  // Only render the component on the client side
  if (!isClient) {
    return (
      <span 
        data-component-name="GitCommitHash"
        className="text-[10px] text-[#666666] whitespace-nowrap"
      >
        build: {BUILD_COMMIT_HASH}
      </span>
    );
  }

  return (
    <span 
      data-component-name="GitCommitHash"
      className="text-[10px] text-[#666666] whitespace-nowrap"
    >
      build: {commitHash} {isLocal ? '(local)' : '(update available)'}
    </span>
  );
}
