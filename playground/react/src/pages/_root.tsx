import type React from 'react';
import { Navigation } from '../components/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header>Header</header>
      <main>
        <h1>city-gas Playground</h1>
        <Navigation />
        <hr />
        {children}
      </main>
      <footer>Footer</footer>
    </>
  );
}
