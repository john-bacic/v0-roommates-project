'use client';

import { useState, useEffect } from 'react';

export default function GitCommitHash() {
  const [commitHash, setCommitHash] = useState<string>('');

  useEffect(() => {
    // Function to fetch the latest commit hash
    async function fetchLatestCommitHash() {
      try {
        const response = await fetch('https://api.github.com/repos/john-bacic/v0-roommates-project/commits/main');
        if (response.ok) {
          const data = await response.json();
          // Get the short version of the commit hash (first 7 characters)
          const shortHash = data.sha.substring(0, 7);
          setCommitHash(shortHash);
        }
      } catch (error) {
        console.error('Error fetching commit hash:', error);
        // If there's an error, we can use a fallback value
        setCommitHash('8745596'); // Latest known commit hash
      }
    }

    fetchLatestCommitHash();

    // Set up an interval to refresh the commit hash every hour
    const intervalId = setInterval(fetchLatestCommitHash, 60 * 60 * 1000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return <span data-component-name="GitCommitHash">build: {commitHash}</span>;
}
