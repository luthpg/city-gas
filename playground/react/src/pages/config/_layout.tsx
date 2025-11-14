export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="users-layout"
      style={{ border: '2px solid green', padding: '1rem' }}
    >
      <h3>Config セクションレイアウト (config/_layout)</h3>
      {children}
    </div>
  );
}
