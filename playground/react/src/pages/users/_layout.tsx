export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="users-layout"
      style={{ border: '2px solid green', padding: '1rem' }}
    >
      <h3>Users セクションレイアウト (users/_layout)</h3>
      {children}
    </div>
  );
}
