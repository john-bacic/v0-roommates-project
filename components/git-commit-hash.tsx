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
    
    // We no longer need to fetch the latest commit hash
    // as we always use the local build hash
  }, []);

  // Only render the component on the client side
  if (!isClient) {
    return (
      <span 
        data-component-name="GitCommitHash"
        className="text-[10px] text-[#666666] whitespace-nowrap"
      >
        build: {BUILD_COMMIT_HASH} (local)
      </span>
    );
  }

  return (
    <span 
      data-component-name="GitCommitHash"
      className="text-[10px] text-[#666666] whitespace-nowrap"
    >
      build: {BUILD_COMMIT_HASH} (local)
    </span>
  );
}
