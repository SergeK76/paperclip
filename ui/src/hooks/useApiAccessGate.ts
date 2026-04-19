import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { healthApi } from "@/api/health";
import { queryKeys } from "@/lib/queryKeys";

// Разрешено ли обращаться к защищённым API-эндпоинтам:
// - local_trusted: как только загружен health
// - authenticated: только при валидной сессии и после bootstrap
export function useApiAccessGate(): boolean {
  const { data: health } = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.get(),
    retry: false,
  });

  const isAuthenticatedMode = health?.deploymentMode === "authenticated";
  const isBootstrapPending =
    isAuthenticatedMode && health?.bootstrapStatus === "bootstrap_pending";

  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    enabled: isAuthenticatedMode && !isBootstrapPending,
    retry: false,
  });

  if (!health) return false;
  if (isBootstrapPending) return false;
  if (isAuthenticatedMode) return !!session;
  return true;
}
