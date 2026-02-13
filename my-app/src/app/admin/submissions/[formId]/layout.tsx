export default function SubmissionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full min-w-0">
      {children}
    </div>
  );
}
