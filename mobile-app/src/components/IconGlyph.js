import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6',
  report: 'M6 3h9l3 3v15H6zM9 12h6M9 16h6M9 8h3',
  radar: 'M12 21a9 9 0 1 0-9-9M12 12l6-6M12 12l-5 5',
  chat: 'M4 5h16v11H8l-4 4zM8 9h8M8 13h5',
  settings: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4',
  shield: 'M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6zM9 12l2 2 4-4',
  search: 'M10.5 4a6.5 6.5 0 1 0 4 11.6L20 21M15 15l5 5',
  close: 'M6 6l12 12M18 6 6 18',
  warning: 'M12 4l9 16H3zM12 10v4M12 17v.5',
};

export default function IconGlyph({ name, size = 22, color = '#00B4FF', label, style }) {
  const path = PATHS[name] || PATHS.shield;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityLabel={label} style={style}>
      <Path d={path} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
