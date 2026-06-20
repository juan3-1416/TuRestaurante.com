import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

export const createUserSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  username: z.string()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .regex(/^\S+$/, "El nombre de usuario no puede contener espacios."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  role: z.enum(["Admin", "Cajero", "Mesero"], { error: "Debes seleccionar un rol." }),
  address: z.string().optional(),
  accountNumber: z.string().optional(),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface UseCreateUserProps {
  onUserCreated: (user: CreateUserFormValues) => void;
}

export function useCreateUser({ onUserCreated }: UseCreateUserProps) {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      role: "Cajero", // Por defecto será Cajero
      address: "",
      accountNumber: "",
    },
  })

  async function onSubmit(values: CreateUserFormValues) {
    try {
      // Simulación de conexión a la API
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      onUserCreated(values) // Enviamos los datos a la tabla principal
      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error al crear usuario:", error)
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
    isSubmitting: form.formState.isSubmitting
  }
}
