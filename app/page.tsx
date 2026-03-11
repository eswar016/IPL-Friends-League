import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";
import { MatchResults } from "@/components/MatchResults";
import { PointsTable } from "@/components/PointsTable";
import { getLeagueDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getLeagueDashboardData();

  return (
    <div className="dashboard-shell">
      <Header
        source={dashboard.source}
        refreshedAt={dashboard.refreshedAt}
        nextSyncAt={dashboard.nextSyncAt}
        nextSyncReason={dashboard.nextSyncReason}
      />

      <main className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <Leaderboard rows={dashboard.standings} />
          <PointsTable rows={dashboard.pointsTable} />
        </div>

        <div className="space-y-6">
          <MatchResults matches={dashboard.matches} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
