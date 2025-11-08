// src/components/ProductSearchBar.tsx
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { ProductSearchFilters } from "../types"; // Import our type

// --- TYPESCRIPT: Define props interface ---
interface ProductSearchBarProps {
  onSearch: (data: ProductSearchFilters) => void;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({ onSearch }) => {
  const { register, handleSubmit } = useForm<ProductSearchFilters>();

  // --- FUNCTIONALITY ---
  // This function is now type-checked
  const onSubmit: SubmitHandler<ProductSearchFilters> = (data) => {
    onSearch(data);
  };

  return (
    <form
      onChange={handleSubmit(onSubmit)} // Auto-submits on any change
      className="mb-6 rounded-lg border border-brand-gray-medium bg-white p-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Search by Name/ID */}
        <div className="md:col-span-2">
          <label
            htmlFor="query"
            className="block text-sm font-medium text-gray-700"
          >
            Search Products
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="query"
              type="search"
              placeholder="Search by product name or ID..."
              {...register("query")}
              className="block w-full rounded-md border-gray-300 pl-10 shadow-sm"
            />
          </div>
        </div>

        {/* Filter by Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            {...register("category")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">All Categories</option>
            <option value="eyeglasses">Eyeglasses</option>
            <option value="frames">Frames</option>
            <option value="lens">Lens</option>
            <option value="goggles">Goggles</option>
            <option value="prisms">Prisms</option>
            <option value="eyedrop">Eyedrop</option>
            <option value="sunglasses">Sunglasses</option>
          </select>
        </div>

        {/* Filter by Stock Level */}
        <div>
          <label
            htmlFor="stockLevel"
            className="block text-sm font-medium text-gray-700"
          >
            Stock Status
          </label>
          <select
            id="stockLevel"
            {...register("stockLevel")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">All Items</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="overstocked">Overstocked</option>
          </select>
        </div>
      </div>
    </form>
  );
};

export default ProductSearchBar;
