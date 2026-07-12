import { ReportesDashboard } from "@/features/reportes/components/ReportesDashboard"
import { RoleGuard } from "@/shared/components/RoleGuard"

export default function ReportesPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <ReportesDashboard />
    </RoleGuard>
  )
}