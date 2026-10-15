export const siteModes = [
  { id: 'morning', name: 'Morning Calm' },
  { id: 'night', name: 'After Hours' },
];

const storageKey = 'pranav-site-mode-v1';
let selectedMode = 'morning';
try {
  const saved = localStorage.getItem(storageKey);
  if (siteModes.some(mode => mode.id === saved)) selectedMode = saved;
} catch { /* The switch still works when storage is unavailable. */ }
export const getSiteMode = () => selectedMode;
export function applySiteMode() {
  document.documentElement.dataset.siteMode = selectedMode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', selectedMode === 'night' ? '#101e22' : '#e6eeea');
}
export function selectSiteMode(id) {
  if (selectedMode === id || !siteModes.some(mode => mode.id === id)) return;
  selectedMode = id;
  try { localStorage.setItem(storageKey, id); } catch { /* Memory-only preference. */ }
  applySiteMode();
  // Stay inside the choice's user gesture so sound can start on mobile too.
  window.dispatchEvent(new CustomEvent('portfolio-mode-change', { detail: { mode: id } }));
}
