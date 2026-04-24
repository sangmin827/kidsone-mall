import { createClient } from '@/src/lib/supabase/server';

export type PublicOptionValue = {
  id: number;
  group_id: number;
  value: string;
  price_delta: number;
  is_sold_out: boolean;
  sort_order: number;
};

export type PublicOptionGroup = {
  id: number;
  name: string;
  sort_order: number;
  option_values: PublicOptionValue[];
};

export async function getPublicProductOptions(
  productId: number,
): Promise<PublicOptionGroup[]> {
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from('product_option_groups')
    .select('id, name, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  const { data: values } = await supabase
    .from('product_option_values')
    .select('id, group_id, value, price_delta, is_sold_out, sort_order')
    .in('group_id', groupIds)
    .eq('is_hidden', false)
    .order('sort_order', { ascending: true });

  return groups.map((g) => ({
    ...g,
    option_values: (values ?? []).filter((v) => v.group_id === g.id),
  })) as PublicOptionGroup[];
}
