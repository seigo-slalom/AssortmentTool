import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSampleItem, listSampleItems, type SampleItem } from '../lib/placeholderService';

export function useSampleItems() {
  return useQuery<SampleItem[]>({
    queryKey: ['sample-items'],
    queryFn: listSampleItems,
  });
}

// Worked example of the read+write pattern generated services follow: a query hook for
// reads (above) and a mutation hook for writes that invalidates the query on success.
export function useCreateSampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createSampleItem(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-items'] });
    },
  });
}
