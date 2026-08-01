import { requireModule } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTasks, getAdminProfiles } from "@/lib/data/tasks";
import { PageHeader } from "@/components/ui/PageHeader";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskViews } from "@/components/tasks/TaskViews";
import { TaskFormButton } from "@/components/tasks/TaskFormButton";
import { GenerateTasksButton } from "@/components/tasks/GenerateTasksButton";

export default async function ProjetPage({
  searchParams,
}: {
  searchParams: { view?: string; assignee?: string };
}) {
  const user = await requireModule("projet");
  const view = searchParams.view === "kanban" ? "kanban" : "liste";

  const supabase = createClient();
  const [tasks, profiles, dropsRes] = await Promise.all([
    getTasks({ assignee: searchParams.assignee }),
    getAdminProfiles(),
    supabase.from("drops").select("id, name").order("start_date", { ascending: false }),
  ]);
  const drops = dropsRes.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation"
        title="Projet"
        description="Les tâches de l'équipe, en liste ou en Kanban. Assigne, commente, avance."
      />

      <div className="flex flex-wrap items-center gap-2">
        <TaskFormButton profiles={profiles} drops={drops} />
        <GenerateTasksButton />
      </div>

      <TaskFilters profiles={profiles} currentProfileId={user.id} />

      <TaskViews tasks={tasks} profiles={profiles} drops={drops} view={view} />
    </div>
  );
}
