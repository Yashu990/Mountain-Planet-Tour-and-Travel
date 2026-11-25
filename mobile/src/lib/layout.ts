// Responsive layout helpers. On tablets and wide screens every page sits in a centred column
// (see app/_layout.tsx), so screens size their content from the column, not the whole window.
import { useWindowDimensions } from 'react-native';

/** Widest the app column gets; wider screens show the page centred with margins. */
export const MAX_CONTENT_WIDTH = 720;

/** Width of the app column: the window width on phones, capped on tablets. */
export function useLayoutWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_CONTENT_WIDTH);
}

/** Number of columns for card lists: 1 on phones, 2 when the column is roomy enough. */
export function useColumns(minCardWidth = 300) {
  const w = useLayoutWidth();
  return w >= minCardWidth * 2 + 48 ? 2 : 1;
}
