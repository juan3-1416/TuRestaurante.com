import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-restaurante-oscuro via-restaurante-primario to-restaurante-acento relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-restaurante-claro/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-8%] w-[400px] h-[400px] rounded-full bg-restaurante-oscuro/20 blur-3xl" />
      <div className="absolute top-[50%] left-[60%] w-[250px] h-[250px] rounded-full bg-white/5 blur-2xl" />

      {/* Card de Login */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <LoginForm />
      </div>
    </main>
  );
}