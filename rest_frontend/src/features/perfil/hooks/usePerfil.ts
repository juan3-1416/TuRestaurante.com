import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore } from "@/store/authStore"
import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/axios"

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

  const changePasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      // El backend recibe current_password y password 
      // u otros campos definidos en la API
      const response = await apiClient.put('/users/me/', {
        // Asumiendo que el backend actualiza password así
        // TODO: Ajustar claves si el backend espera un formato diferente (e.g. current_password y new_password)
        password: values.newPassword,
        current_password: values.currentPassword
      })
      return response.data
    },
    onSuccess: () => {
      setIsSuccess(true)
      form.reset()
      setTimeout(() => setIsSuccess(false), 3000)
    },
    onError: (error) => {
      console.error("Error al cambiar la contraseña:", error)
      form.setError("currentPassword", { message: "Verifica tu contraseña actual o intentalo nuevamente." })
    }
  })

  const onSubmit = async (values: PasswordFormValues) => {
    setIsSuccess(false)
    await changePasswordMutation.mutateAsync(values)
  }

  return {
    user,
    form,
    isSubmitting: changePasswordMutation.isPending,
    isSuccess,
    onSubmit,
  }
}