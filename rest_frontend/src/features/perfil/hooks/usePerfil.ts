import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore } from "@/store/authStore"

// Validación estricta sin any para typescript
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(1, "Confirma tu nueva contraseña."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
})

export type PasswordFormValues = z.infer<typeof passwordSchema>

export function usePerfil() {
  const user = useAuthStore((state) => state.user)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      setIsSuccess(false)
      // Simulación de llamada PUT a la API (Endpoint de cambio de contraseña)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      console.log(`Contraseña cambiada para ${user?.username}:`, values)
      
      setIsSuccess(true)
      form.reset()
      
      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error)
    }
  }

  return {
    user,
    form,
    isSubmitting: form.formState.isSubmitting,
    isSuccess,
    onSubmit,
  }
}