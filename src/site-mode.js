export const siteModes = [
  { id: 'morning', name: 'Morning Calm' },
  { id: 'night', name: 'After Hours' },
];

let selectedMode = 'night';
export const getSiteMode = () => selectedMode;
export function applySiteMode() {
  document.documentElement.dataset.siteMode = selectedMode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', selectedMode === 'night' ? '#101e22' : '#e6eeea');
}
export function selectSiteMode(id) {
  if (selectedMode === id || !siteModes.some(mode => mode.id === id)) return;
  selectedMode = id;
  applySiteMode();
  // Stay inside the choice's user gesture so sound can start on mobile too.
  window.dispatchEvent(new CustomEvent('portfolio-mode-change', { detail: { mode: id } }));
}
