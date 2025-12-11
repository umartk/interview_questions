/**
 * =============================================================================
 * GLOBAL STYLES - CSS Reset and Base Styles
 * =============================================================================
 * 
 * PURPOSE:
 * Provides consistent base styles across all browsers and sets up
 * global CSS variables and resets.
 * 
 * INCLUDES:
 * - CSS reset (normalize browser defaults)
 * - Base typography
 * - Global CSS custom properties
 * - Accessibility improvements
 */

import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /**
   * CSS RESET
   * 
   * Removes default browser styling for consistency
   * Based on modern CSS reset best practices
   */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /**
   * ROOT ELEMENT
   * 
   * Sets base font size for rem calculations
   * 16px is browser default, good for accessibility
   */
  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  /**
   * BODY STYLES
   * 
   * Base typography and colors from theme
   */
  body {
    font-family: ${props => props.theme.typography.fontFamily};
    font-size: ${props => props.theme.typography.fontSize.md};
    line-height: 1.5;
    color: ${props => props.theme.colors.text};
    background-color: ${props => props.theme.colors.background};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /**
   * TYPOGRAPHY DEFAULTS
   */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
    line-height: 1.2;
    margin-bottom: ${props => props.theme.spacing.md};
  }

  p {
    margin-bottom: ${props => props.theme.spacing.md};
  }

  /**
   * LINK STYLES
   */
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    transition: color ${props => props.theme.transitions.fast};

    &:hover {
      color: ${props => props.theme.colors.primaryDark};
    }
  }

  /**
   * BUTTON RESET
   * 
   * Removes default button styling
   */
  button {
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }

  /**
   * INPUT RESET
   */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  /**
   * IMAGE DEFAULTS
   */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /**
   * LIST RESET
   */
  ul, ol {
    list-style: none;
  }

  /**
   * TABLE RESET
   */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /**
   * ACCESSIBILITY
   * 
   * Focus styles for keyboard navigation
   */
  :focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }

  /**
   * REDUCED MOTION
   * 
   * Respects user preference for reduced motion
   */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /**
   * SELECTION STYLES
   */
  ::selection {
    background-color: ${props => props.theme.colors.primary};
    color: white;
  }

  /**
   * SCROLLBAR STYLES (Webkit browsers)
   */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.gray[100]};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.gray[400]};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.gray[500]};
  }
`;

export default GlobalStyles;