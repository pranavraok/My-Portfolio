export const siteModes = [
  { id: 'morning', name: 'Morning Calm', eyebrow: 'A SOFT START', description: 'My melody. A little daylight. Settle in.', action: 'Enter Morning Calm' },
  { id: 'night', name: 'After Hours', eyebrow: 'STAY A LITTLE LONGER', description: 'An evening soundtrack. A deeper shade of green.', action: 'Enter After Hours' },
];

let selectedMode = null;
export const getSiteMode = () => selectedMode;
export function selectSiteMode(id) {
  if (!siteModes.some(mode => mode.id === id)) return;
  selectedMode = id;
  document.documentElement.dataset.siteMode = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', id === 'night' ? '#111f1b' : '#e6eeea');
  // Stay inside the choice's user gesture so sound can start on mobile too.
  window.dispatchEvent(new CustomEvent('portfolio-mode-change', { detail: { mode: id } }));
}
