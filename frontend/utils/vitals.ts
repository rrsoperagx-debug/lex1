import { onCLS, onINP, onLCP, onTTFB, onFCP } from 'web-vitals';

const logVitals = (metric: any) => {
  console.log('[Web Vitals]', metric.name, metric.value);
};

export function reportWebVitals() {
  onCLS(logVitals);
  onINP(logVitals);
  onLCP(logVitals);
  onFCP(logVitals);
  onTTFB(logVitals);
}
