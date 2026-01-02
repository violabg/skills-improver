export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-center bg-slate-50 min-h-screen">
      <div className="px-4 w-full max-w-md">
        <div className="space-y-2 mb-8 text-center">
          <div className="flex justify-center">
            <div className="flex justify-center items-center bg-blue-600 rounded-lg w-10 h-10 font-bold text-white text-sm">
              SI
            </div>
          </div>
          <h1 className="font-bold text-slate-900 text-2xl">Skills Improver</h1>
          <p className="text-slate-600 text-sm">
            AI-powered skill gap analysis
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
