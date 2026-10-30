/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#18342D',
    tint: '#24584A',

    // Core surfaces
    background: '#F5F6F0',
    foreground: '#18342D',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#18342D',

    // Primary action color (buttons, links, active states)
    primary: '#24584A',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E6EEE7',
    secondaryForeground: '#24584A',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EDF0E9',
    mutedForeground: '#74827A',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#DDF278',
    accentForeground: '#24372B',

    // Destructive actions (delete, error states)
    destructive: '#BC5A4A',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E1E7DF',
    input: '#E7EBE4',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 20,
};

export default colors;
