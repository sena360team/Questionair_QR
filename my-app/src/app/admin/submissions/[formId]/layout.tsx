export default function SubmissionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full">
      {children}
    </div>
  );
}
