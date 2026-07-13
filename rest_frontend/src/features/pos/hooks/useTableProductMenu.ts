import { useState, useMemo, Dispatch, SetStateAction } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/axios"

export interface ApiProduct {
  id: number;
  name: string;
  price: string | number;
  category_name?: string;
  status?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  cartId?: string; // Añadido para identificar cada unidad de forma única en el carrito
  status?: string;
  isTakeaway?: boolean; // Para llevar
}

interface UseTableProductMenuProps {
  selectedProducts: Product[]
  setSelectedProducts: Dispatch<SetStateAction<Product[]>>
}

export function useTableProductMenu({ selectedProducts, setSelectedProducts }: UseTableProductMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos")

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/products/')
      // Transform incoming data to match expected Product interface
      return res.data.map((p: ApiProduct) => ({
        id: p.id,
        name: p.name,
        price: typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price),
        category: p.category_name || "General",
        status: p.status || "Disponible"
      }))
    }
  })

  // Función para agregar un producto generando una instancia única
  const handleAddProduct = (product: Product) => {
    // Si el estado es "Agotado", podríamos prevenir que lo agreguen, pero lo dejaremos así por ahora o mostramos una alerta
    if (product.status === "Agotado") {
      alert("Este producto está agotado actualmente.")
      return;
    }
    const newProductInstance = {
      ...product,
      cartId: crypto.randomUUID() // Genera un ID único para esta unidad específica
    };
    setSelectedProducts([...selectedProducts, newProductInstance]);
  }

  const handleRemoveProduct = (productId: number) => {
    const index = selectedProducts.findIndex(p => p.id === productId);
    if (index !== -1) {
      const newSelected = [...selectedProducts];
      newSelected.splice(index, 1);
      setSelectedProducts(newSelected);
    }
  }

  const handleRemoveAllOfProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  }

  const categories = useMemo(() => {
    return ["Todos", ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return selectedCategory === "Todos" 
      ? products 
      : products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const cartItems = useMemo(() => {
    // Se agrupa por id + isTakeaway para que "Pizza" y "Pizza (Para Llevar)" sean filas distintas
    const grouped = selectedProducts.reduce((acc, curr) => {
      const key = `${curr.id}-${curr.isTakeaway ?? false}`;
      if (!acc[key]) {
        acc[key] = { ...curr, quantity: 1, instances: [curr] };
      } else {
        acc[key].quantity += 1;
        acc[key].instances.push(curr);
      }
      return acc;
    }, {} as Record<string, Product & { quantity: number, instances: Product[] }>);
    return Object.values(grouped);
  }, [selectedProducts]);

  // Invierte el flag isTakeaway de todas las instancias del producto en el carrito
  const handleToggleTakeaway = (productId: number, isTakeaway: boolean) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === productId && (p.isTakeaway ?? false) === isTakeaway
          ? { ...p, isTakeaway: !isTakeaway }
          : p
      )
    );
  };

  return {
    products,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    cartItems,
    handleAddProduct,
    handleRemoveProduct,
    handleRemoveAllOfProduct,
    handleToggleTakeaway,
    isLoadingProducts: isLoading
  }
}
