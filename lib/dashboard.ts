import { getCachedDashboardData } from "@/lib/sync-engine";
import type { LeagueDashboardData } from "@/types/league";

export const getLeagueDashboardData = async (): Promise<LeagueDashboardData> => getCachedDashboardData();
