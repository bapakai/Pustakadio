// Device identity — no login, random ID persisted di localStorage.
// Pola identik dengan getDeviceId() di BapakAI js/shared/state.js.

export function getDeviceId() {
  if (typeof window === 'undefined') return null;
  const KEY = 'pustakadio_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}
