export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ height: '100vh', margin: 0, padding: 0 }}>
      {children}
    </div>
  );
}