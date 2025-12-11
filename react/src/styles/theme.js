/**
 * =============================================================================
 * THEME CONFIGURATION - Styled Components
 * =============================================================================
 * 
 * PURPOSE:
 * Centralizes design tokens for consistent styling across the application.
 * Used with styled-components ThemeProvider.
 * 
 * BENEFITS:
 * - Single source of truth for design values
 * - Easy theme switching (light/dark mode)
 * - Consistent spacing and colors
 * - Type-safe with TypeScript
 * 
 * USAGE:
 * const Button = styled.button`
 *   background: ${props => props.theme.colors.primary};
 *   padding: ${props => props.theme.spacing.md};
 * `;
 */

const theme = {
  /**
   * COLOR PALETTE
   * 
   * Organized by purpose:
   * - primary: Main brand color
   * - secondary: Supporting color
   * - success/error/warning: Status colors
   * - gray: Neutral colors for text and backgrounds
   */
  colors: {
    primary: '#3498db',
    primaryDark: '#2980b9',
    primaryLight: '#5dade2',
    
    secondary: '#2ecc71',
    secondaryDark: '#27ae60',
    
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
    
    // Gray scale
    gray: {
      25: '#fafafa',
      50: '#f5f5f5',
      100: '#eeeeee',
      200: '#e0e0e0',
      300: '#bdbdbd',
      400: '#9e9e9e',
      500: '#757575',
      600: '#616161',
      700: '#424242',
      800: '#212121',
    },
    
    // Semantic colors
    text: '#212121',
    textSecondary: '#757575',
    background: '#f5f5f5',
    surface: '#ffffff',
    border: '#e0e0e0',
  },
  
  /**
   * SPACING SCALE
   * 
   * Based on 4px base unit (common in design systems)
   * Provides consistent spacing throughout the app
   */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  /**
   * TYPOGRAPHY
   * 
   * Font sizes and weights for consistent text styling
   */
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  /**
   * BREAKPOINTS
   * 
   * For responsive design
   * Mobile-first approach (min-width)
   */
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
  },
  
  /**
   * SHADOWS
   * 
   * Elevation levels for depth
   */
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  
  /**
   * BORDER RADIUS
   * 
   * Consistent rounded corners
   */
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  
  /**
   * TRANSITIONS
   * 
   * Animation timing for smooth interactions
   */
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
};

export default theme;