export type ProductCategory = 'Vestidos de noche' | 'Blusas' | 'Vestidos de XV' | 'Camisas' | 'Trajes Panameños';
export interface ProductColor { name: string; hex: string; }
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
  backImage?: string;
  madeToMeasure: boolean;
  sizes: string[];
  colors: ProductColor[];
  featured?: boolean;
}
