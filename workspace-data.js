const hosted = document.querySelector('meta[name="meal-ledger-mode"]')?.content === 'browser';
export const workspaceNamespace = () => hosted ? localStorage.getItem('meal-ledger-workspace') || 'imports' : 'local';
const modeKey = () => 'meal-ledger-data-mode:' + workspaceNamespace();
export const getDataMode = () => localStorage.getItem(modeKey());
export function setDataMode(mode) {
  if (!['personal','shared'].includes(mode)) throw new Error('Unknown data view.');
  localStorage.setItem(modeKey(), mode);
}
const database = new Promise(resolve => {
  const request = indexedDB.open('meal-ledger-card-history', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('summaries');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => resolve(null);
});
export async function readDiningSummary() {
  const db = await database;
  if (!db) return null;
  return new Promise((resolve,reject) => {
    const request = db.transaction('summaries').objectStore('summaries').get(workspaceNamespace());
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Could not read your dining history.'));
  });
}
export async function saveDiningSummary(summary) {
  const db = await database;
  if (!db) throw new Error('Allow browser site storage to save your history.');
  return new Promise((resolve,reject) => {
    const transaction = db.transaction('summaries','readwrite');
    transaction.objectStore('summaries').put(summary, workspaceNamespace());
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(new Error('Your dining history could not be saved.'));
    transaction.onabort = transaction.onerror;
  });
}
