"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundaryHandler extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 bg-[#333333] rounded-md my-4">
          <h3 className="text-red-400 font-bold mb-2">Something went wrong</h3>
          <p className="text-sm text-[#A0A0A0] mb-2">
            There was an error loading this component. Try refreshing the page.
          </p>
          <details className="text-xs text-[#888888] mt-2">
            <summary>Error details</summary>
            <pre className="mt-2 p-2 bg-[#222222] rounded overflow-auto">
              {this.state.error?.toString() || "Unknown error"}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-3 py-1 text-xs bg-[#444444] hover:bg-[#555555] rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
