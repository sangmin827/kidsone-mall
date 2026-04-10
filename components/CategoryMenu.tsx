import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoryMenu() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("id", { ascending: true });

  return (
    <div className="hidden md:flex gap-8 overflow-x-auto">
      <Link href="/products" className="whitespace-nowrap">
        전체상품
      </Link>

      {categories?.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="whitespace-nowrap"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
