'use client';

import { Component } from 'react';

/**
 * Error boundary for a single section of a page. If anything inside throws (a browser without WebGL, a
 * bad data row, a server-component error...) only THIS section is replaced by `fallback`
 * (nothing by default) and the rest of the page keeps working.
 */
export default class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Visible in the browser console (F12) so the real cause is easy to find.
    console.error(`[SafeBoundary${this.props.name ? `: ${this.props.name}` : ''}]`, error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
