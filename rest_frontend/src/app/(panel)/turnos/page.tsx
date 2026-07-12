import { TurnosDashboard } from "@/features/turnos/components/TurnosDashboard"
import { RoleGuard } from "@/shared/components/RoleGuard"

export default function TurnosPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN", "CASHIER", "WAITER"]}>
      <TurnosDashboard />
    </RoleGuard>
  )
}
