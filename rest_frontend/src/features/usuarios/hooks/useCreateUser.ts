import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/axios"
import { isAxiosError } from "axios"

export const createUserSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  last_name: z.string().optional(),
  username: z.string()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .regex(/^\S+$/, "El nombre de usuario no puede contener espacios."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  role: z.enum(["ADMIN", "CASHIER", "WAITER"], { error: "Debes seleccionar un rol." }),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  bank_account_number: z.string().optional(),
  phone_number: z.string().optional(),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function useCreateUser() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      role: "CASHIER",
      email: "",
      address: "",
      bank_account_number: "",
      phone_number: "",
    },
  })

  const createUserMutation = useMutation({
    mutationFn: async (values: CreateUserFormValues) => {
      const response = await apiClient.post('/users/', values)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsOpen(false)
      form.reset()
    },
    onError: (error: unknown) => {
      console.error("Error al crear usuario completo:", error)
      if (isAxiosError(error) && error.response && error.response.data) {
        console.error("Detalle de validación del backend:", error.response.data)
        alert("Error de validación del backend: " + JSON.stringify(error.response.data, null, 2))
      }
    }
  })

  async function onSubmit(values: CreateUserFormValues) {
    try {
      // Remover strings vacíos para evitar que el backend los rechace si espera null
      const payload: Partial<CreateUserFormValues> = { ...values }
      Object.keys(payload).forEach(key => {
        const k = key as keyof CreateUserFormValues;
        if (payload[k] === "") {
          delete payload[k]
        }
      })
      await createUserMutation.mutateAsync(payload as CreateUserFormValues)
    } catch (error) {
      // El error ya es manejado por el onError de la mutación, 
      // pero el catch previene el "Uncaught in promise" de react-hook-form
      console.error("Error capturado en onSubmit:", error)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) form.reset()
  }

  return {
    isOpen,
    setIsOpen,
    form,
    onSubmit,
    handleOpenChange,
    isSubmitting: createUserMutation.isPending
  }
}
