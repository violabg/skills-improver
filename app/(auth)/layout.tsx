export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex justify-center items-center bg-background min-h-screen overflow-hidden">
      {/* Background Gradients */}
      <div className="top-0 left-1/2 -z-10 absolute bg-primary/20 opacity-20 blur-3xl rounded-full w-[600px] h-[600px] -translate-x-1/2 pointer-events-none" />
      <div className="right-0 bottom-0 -z-10 absolute bg-secondary/20 opacity-20 blur-3xl rounded-full w-[500px] h-[500px] pointer-events-none" />

      <div className="px-4 w-full max-w-md">
        <div className="space-y-2 mb-8 text-center">
          <div className="flex justify-center">
            <div className="flex justify-center items-center bg-primary shadow-lg rounded-xl w-12 h-12 font-bold text-primary-foreground text-lg">
              SI
            </div>
          </div>
          <h1 className="font-bold text-foreground text-3xl tracking-tight">
            Skills Improver
          </h1>
          <p className="text-muted-foreground text-sm">
            AI-powered skill gap analysis
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
