import RiskMap from "@/components/risk/RiskMap";
import RiskSidebar from "@/components/risk/RiskSidebar";

export default function RiskPage() {
  return (
    <main className="h-[calc(100vh-73px)]">
      <div className="flex h-full">
        <RiskSidebar />

        <section className="min-w-0 flex-1">
          <RiskMap />
        </section>
      </div>
    </main>
  );
}