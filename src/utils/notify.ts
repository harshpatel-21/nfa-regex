type NotifyFn = (n: { message: string; type: 'info' | 'success' | 'error' }) => void;

let addNotificationFn: NotifyFn | null = null;

export function setNotificationHandler(fn: NotifyFn | null) {
  addNotificationFn = fn;
}

export function notify(message: string, type: 'info' | 'success' | 'error' = 'info') {
  addNotificationFn?.({ message, type });
}
