import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/axios"
import { User } from "@/store/authStore"

export const editUserSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  last_name: z.string().optional(),
  username: z.string()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .regex(/^\S+$/, "El nombre de usuario no puede contener espacios."),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "CASHIER", "WAITER"], { error: "Debes seleccionar un rol." }),
  address: z.string().optional(),
  bank_account_number: z.string().optional(),
  phone_number: z.string().optional(),
})

export type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UseEditUserProps {
  userToEdit: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function useEditUser({ userToEdit, isOpen, onClose }: UseEditUserProps) {
  const queryClient = useQueryClient()

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      role: "CASHIER",
      address: "",
      bank_account_number: "",
      phone_number: "",
    },
  })

  useEffect(() => {
    if (userToEdit && isOpen) {
      form.reset({
        first_name: userToEdit.first_name || "",
        last_name: userToEdit.last_name || "",
        username: userToEdit.username,
        password: "", // En blanco por seguridad
        role: userToEdit.role,
        bank_account_number: userToEdit.bank_account_number || "",
        address: userToEdit.address || "",
        phone_number: userToEdit.phone_number || "",
      })
    }
  }, [userToEdit, isOpen, form])

  const editUserMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string | number, values: EditUserFormValues }) => {
      // Si password está vacío, lo eliminamos antes de enviar al backend
      const payload = { ...values }
      if (!payload.password) {
        delete payload.password
      }
      const response = await apiClient.patch(`/users/${id}/`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (error) => {
      console.error("Error al editar usuario:", error)
    }
  })

  async function onSubmit(values: EditUserFormValues) {
    if (!userToEdit?.id) return;
    await editUserMutation.mutateAsync({ id: userToEdit.id, values })
  }

  return {
    form,
    onSubmit,
    isSubmitting: editUserMutation.isPending
  }
}
