"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#FAFAFA]">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-[#dc2626] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">!</span>
            </div>
            <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[#1A1A1A] mb-2">
              Quelque chose s&apos;est mal passé
            </h2>
            <p className="text-sm text-[#666666] mb-4">
              {this.state.error?.message || "Une erreur inattendue est survenue."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2 bg-[#0D6E6E] text-white rounded-lg text-sm hover:bg-[#0A5555]"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
