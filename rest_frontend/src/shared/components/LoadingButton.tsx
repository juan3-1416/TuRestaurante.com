import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Extendemos las propiedades normales de un botón para agregar las nuestras
interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button 
      disabled={isLoading || disabled} 
      {...props}
    >
      {/* Si está cargando, mostramos el spinner */}
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      
      {/* Si está cargando y le pasamos un texto alternativo, lo mostramos. 
          Si no, mostramos el contenido normal del botón */}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  )
}