export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-background min-h-screen overflow-hidden">
      {/* Background Gradients */}
      <div className="top-0 left-1/2 -z-10 absolute bg-primary/15 opacity-30 blur-3xl rounded-full w-[800px] h-[800px] -translate-x-1/2 pointer-events-none" />
      <div className="right-0 bottom-0 -z-10 absolute bg-secondary/15 opacity-20 blur-3xl rounded-full w-[600px] h-[600px] pointer-events-none" />
      {children}
    </div>
  );
}
