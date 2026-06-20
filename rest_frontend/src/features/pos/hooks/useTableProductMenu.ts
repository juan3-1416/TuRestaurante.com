import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react"
import { apiClient } from "@/lib/axios"

export interface ApiProduct {
  id: number;
  name: string;
  price: string | number;
  category_name?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  cartId?: string; // Añadido para identificar cada unidad de forma única en el carrito
}

interface UseTableProductMenuProps {
  selectedProducts: Product[]
  setSelectedProducts: Dispatch<SetStateAction<Product[]>>
}

export function useTableProductMenu({ selectedProducts, setSelectedProducts }: UseTableProductMenuProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/inventory/products/')
        // Transform incoming data to match expected Product interface
        const mappedProducts = res.data.map((p: ApiProduct) => ({
          id: p.id,
          name: p.name,
          price: typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price),
          category: p.category_name || "General"
        }))
        setProducts(mappedProducts)
      } catch (err) {
        console.error("Error fetching products", err)
      }
    }
    fetchProducts()
  }, [])

  // Función para agregar un producto generando una instancia única
  const handleAddProduct = (product: Product) => {
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
    const grouped = selectedProducts.reduce((acc, curr) => {
      if (!acc[curr.id]) {
        acc[curr.id] = { ...curr, quantity: 1, instances: [curr] };
      } else {
        acc[curr.id].quantity += 1;
        acc[curr.id].instances.push(curr);
      }
      return acc;
    }, {} as Record<number, Product & { quantity: number, instances: Product[] }>);
    return Object.values(grouped);
  }, [selectedProducts]);

  return {
    products,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    cartItems,
    handleAddProduct,
    handleRemoveProduct,
    handleRemoveAllOfProduct
  }
}
