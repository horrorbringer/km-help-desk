import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export function useToast() {
  const { flash, error_details } = usePage().props as { 
    flash?: { success?: string; error?: string; warning?: string; info?: string };
    error_details?: string[];
  };

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success, {
        duration: 4000,
      });
    }
    if (flash?.error) {
      const description = error_details && error_details.length > 0 
        ? error_details.slice(0, 3).map((detail: string, idx: number) => `• ${detail}`).join('\n') + 
          (error_details.length > 3 ? `\n\n...and ${error_details.length - 3} more error${error_details.length - 3 !== 1 ? 's' : ''}` : '')
        : undefined;
      
      toast.error(flash.error, {
        description: description,
        duration: 8000,
      });
    }
    if (flash?.warning) {
      const description = error_details && error_details.length > 0 
        ? error_details.slice(0, 3).map((detail: string, idx: number) => `• ${detail}`).join('\n') + 
          (error_details.length > 3 ? `\n\n...and ${error_details.length - 3} more error${error_details.length - 3 !== 1 ? 's' : ''}` : '')
        : undefined;
      
      toast.warning(flash.warning, {
        description: description,
        duration: 8000,
      });
    }
    if (flash?.info) {
      toast.info(flash.info, {
        duration: 4000,
      });
    }
  }, [flash, error_details]);

  return {
    toast,
  };
}

