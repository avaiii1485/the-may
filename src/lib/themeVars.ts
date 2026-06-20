import { vars } from 'nativewind';

// NativeWind's class-based dark mode does NOT apply `.dark { --var }` CSS-variable
// overrides on native (it works on web only). To make the token colors flip on
// native too, we set the same variables via vars() on the root view in _layout.
// Values mirror global.css (RGB channels). Keep the two in sync.
export const lightThemeVars = vars({
  '--cream': '252 246 238',
  '--cream-deep': '246 234 216',
  '--bg': '255 255 255',
  '--bg-card': '255 252 247',
  '--ink': '15 23 42',
  '--ink-soft': '71 85 105',
  '--ink-mute': '148 163 184',
  '--path-soft': '252 235 211',
  '--bubble-bg': '241 245 249',
  '--line': '241 245 249',
  '--line-strong': '226 232 240',
});

export const darkThemeVars = vars({
  '--cream': '22 15 9',
  '--cream-deep': '31 22 14',
  '--bg': '22 15 9',
  '--bg-card': '36 27 18',
  '--ink': '210 195 175',
  '--ink-soft': '173 156 134',
  '--ink-mute': '138 120 96',
  '--path-soft': '43 32 20',
  '--bubble-bg': '36 27 18',
  '--line': '51 39 26',
  '--line-strong': '58 44 28',
});
