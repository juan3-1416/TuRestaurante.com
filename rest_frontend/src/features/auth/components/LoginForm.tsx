"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, 
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form" 
import { Input } from "@/components/ui/input" 

//Definiendo el esquema de validacion de Zod
const formSchema = z.object({
    username: z.string().min(3, {
        message: "El usuario debe tener al menos 3 caracteres."
    }),
    password: z.string().min(5, {
        message: "La contraseña debe tener al menos 5 caracteres."
    })
});

export function LoginForm(){
    const login = useAuthStore((state) => state.login)
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues:{
            username: "",
            password: ""
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            console.log("Enviando credenciales al servidor...", values);
            
            // Petición POST oficial a Django (`/api/auth/token/`)
            const response = await api.post('/auth/token/', values);
            
            // Django devuelve un token "access" y "refresh" en su diccionario
            const token = response.data.access;

            // Guardar el token en el estado global (Zustand) y saltar
            login(token);
            router.push("/dashboard");
      
        } catch (error) {
            console.error("Error al iniciar sesión", error)
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-8 sm:p-10 space-y-5">
            {/* Logotipo e icono */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-restaurante-primario to-restaurante-acento shadow-lg shadow-restaurante-primario/30">
                    <svg
                        viewBox="0 0 100 100"
                        className="w-11 h-11"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <ellipse cx="50" cy="62" rx="38" ry="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
                        <ellipse cx="50" cy="58" rx="30" ry="9" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                        <path d="M22 62 Q22 30 50 22 Q78 30 78 62" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M44 22 Q50 14 56 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M38 18 Q36 12 38 6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M50 14 Q48 8 50 2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M62 18 Q64 12 62 6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-bold text-restaurante-oscuro tracking-tight">
                        Bienvenido
                    </h1>
                </div>
            </div>

            {/* Separador */}
            <div className="w-full h-px bg-linear-to-r from-transparent via-restaurante-claro/40 to-transparent" />

            {/* Formulario */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-semibold text-restaurante-oscuro">
                                    Nombre de Usuario
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-restaurante-acento/60">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <Input
                                            placeholder="aireyu"
                                            className="pl-11 h-12 bg-gray-50 border-gray-200 rounded-xl text-base transition-all duration-200 focus:bg-white focus:border-restaurante-acento focus:ring-2 focus:ring-restaurante-acento/20"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-semibold text-restaurante-oscuro">
                                        Contraseña
                                    </FormLabel>
                                </div>
                                <FormControl>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-restaurante-acento/60">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-11 h-12 bg-gray-50 border-gray-200 rounded-xl text-base transition-all duration-200 focus:bg-white focus:border-restaurante-acento focus:ring-2 focus:ring-restaurante-acento/20"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <button type="button" className="text-xs text-restaurante-acento hover:text-restaurante-primario transition-colors font-medium">
                                    ¿Olvidaste tu contraseña?
                                </button>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Botón de login */}
                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-12 bg-linear-to-r from-restaurante-primario to-restaurante-acento hover:from-restaurante-oscuro hover:to-restaurante-primario text-white text-base font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-restaurante-primario/25 hover:shadow-restaurante-oscuro/30 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Ingresando...
                            </div>
                        ) : (
                            "Iniciar Sesión"
                        )}
                    </Button>
                </form>
            </Form>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 pt-1">
                © 2026 Todos los derechos reservados.
            </p>
        </div>
    )
}