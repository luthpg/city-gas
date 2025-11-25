// biome-ignore lint/correctness/noUnusedImports: react is required for jsx
import * as React from 'react';
import { useNavigate } from '@/adapters/react/hooks';

const styles = `
:root {
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-surface: #FFFBFE;
  --md-sys-color-on-surface: #1C1B1F;
  --md-sys-color-outline: #79747E;
}

@media (prefers-color-scheme: dark) {
  :root {
    --md-sys-color-primary: #D0BCFF;
    --md-sys-color-on-primary: #381E72;
    --md-sys-color-surface: #1C1B1F;
    --md-sys-color-on-surface: #E6E1E5;
    --md-sys-color-outline: #938F99;
  }
}

.cg-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-family: Roboto, system-ui, -apple-system, sans-serif;
}

.cg-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--md-sys-color-outline);
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: cg-rotation 1s linear infinite;
}

@keyframes cg-rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cg-not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  font-family: Roboto, system-ui, -apple-system, sans-serif;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  text-align: center;
}

.cg-headline {
  font-size: 3rem;
  margin: 0 0 1rem;
  font-weight: 400;
}

.cg-body {
  font-size: 1.2rem;
  margin: 0 0 2rem;
  opacity: 0.8;
}

.cg-button {
  padding: 0 24px;
  height: 40px;
  font-size: 1rem;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: box-shadow 0.2s, opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cg-button:hover {
  box-shadow: 0 1px 3px 1px rgba(0, 0, 0, 0.15);
  opacity: 0.92;
}

.cg-button:active {
  opacity: 0.88;
}
`;

export const DefaultLoading = () => (
  <div className="cg-loading-container">
    <style>{styles}</style>
    <div className="cg-spinner" />
  </div>
);

export const DefaultNotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="cg-not-found-container">
      <style>{styles}</style>
      <h1 className="cg-headline">404</h1>
      <p className="cg-body">Page Not Found</p>
      <button
        type="button"
        className="cg-button"
        onClick={() => navigate('/', {})}
      >
        Go to Home
      </button>
    </div>
  );
};
