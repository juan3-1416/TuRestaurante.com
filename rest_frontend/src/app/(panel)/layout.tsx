import { DashboardLayout } from "@/shared/layout/DashboardLayout"
import { AuthGuard } from "@/shared/components/AuthGuard"

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  )
}