import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export function useToast() {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string; warning?: string; info?: string } };

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (flash?.warning) {
      toast.warning(flash.warning);
    }
    if (flash?.info) {
      toast.info(flash.info);
    }
  }, [flash]);

  return {
    toast,
  };
}

