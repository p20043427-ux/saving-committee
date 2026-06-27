import { useAuth } from '@/src/components/auth/AuthProvider';
import { supabase } from '@/src/lib/supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'LOGIN';

export interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: AuditAction;
  target_table: string;
  target_id: string;
  detail: string;
  created_at: string;
}

export function useAuditLog() {
  const { user } = useAuth();

  const log = async (
    action: AuditAction,
    target_table: string,
    target_id: string,
    detail?: string
  ) => {
    try {
      await supabase.from('sc_audit_log').insert({
        id: 'AL-' + Date.now().toString(36).toUpperCase(),
        user_id: user?.uid ?? 'anonymous',
        user_name: user?.name ?? user?.email ?? 'unknown',
        action,
        target_table,
        target_id,
        detail: detail ?? '',
        created_at: new Date().toISOString(),
      });
    } catch {
      // sc_audit_log 테이블이 없으면 무시 (graceful degradation)
    }
  };

  return { log };
}
