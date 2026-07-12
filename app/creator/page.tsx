import type { UserRole } from "@/lib/types";
import { getCurrentUser } from "@/lib/require-admin";
import UsersManager from "./UsersManager";

export default async function CreatorPage() {
  const user = await getCurrentUser();
  return (
    <UsersManager
      currentUserId={user?.id ?? -1}
      currentUserRole={user?.role ?? "user" as UserRole}
    />
  );
}
