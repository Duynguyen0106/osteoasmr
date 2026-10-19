import { StudioDashboard } from "@/components/StudioDashboard";

export async function JobEditContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <StudioDashboard
      initialStudioView="editor"
      deepLinkJobId={id}
      syncRoutes
    />
  );
}
