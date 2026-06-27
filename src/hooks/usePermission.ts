import { useAuth } from '@/src/components/auth/AuthProvider';

export interface Permission {
  canEdit: boolean;
  canDelete: boolean;
  canAdmin: boolean;
  role: string;
  roleLabel: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: '관리자',
  member: '위원',
  viewer: '조회자',
};

export function usePermission(): Permission {
  const { user } = useAuth();
  const role = user?.role ?? 'viewer';

  return {
    canEdit: role === 'admin' || role === 'member',
    canDelete: role === 'admin',
    canAdmin: role === 'admin',
    role,
    roleLabel: ROLE_LABELS[role] ?? '조회자',
  };
}
