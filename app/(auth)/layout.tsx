export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-center bg-background min-h-screen">
      <div className="px-4 w-full max-w-md">
        <div className="space-y-2 mb-8 text-center">
          <div className="flex justify-center">
            <div className="flex justify-center items-center bg-primary rounded-lg w-10 h-10 font-bold text-primary-foreground text-sm">
              SI
            </div>
          </div>
          <h1 className="font-bold text-foreground text-2xl">
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
