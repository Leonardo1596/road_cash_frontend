"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekSelector } from "../components/WeekSelector";
import { format } from "date-fns";
import { Loader2, TrendingUp, TrendingDown, Milestone, Utensils, ShoppingCart, Fuel, Wrench, GitCommitHorizontal, Footprints, AlertCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from "lucide-react";

interface ResumeData {
  liquidGain: number;
  totalSpent: number;
  totalDistance: number;
  grossGain: number;
  foodExpense: number;
  otherExpense: number;
  gasolineExpense: number;
  maintenance: {
    oleo: number;
    relacao: number;
    pneuDianteiro: number;
    pneuTraseiro: number;
    gasolina: number;
  };
}
interface MaintenanceFuelData {
  oleo: number;
  relacao: number;
  pneuDianteiro: number;
  pneuTraseiro: number;
  gasolina: number;
  totalDistance: number;
}


const StatCard = ({ title, value, icon, isLoading, currency = false, unit = '' }: { title: string, value: number, icon: LucideIcon, isLoading: boolean, currency?: boolean, unit?: string }) => {
  const Icon = icon;
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
          <div className="text-2xl font-bold">
            {currency ? `R$ ${value.toFixed(2).replace('.', ',')}` : value}
            {unit && <span className="text-xs text-muted-foreground"> {unit}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceFuelData, setMaintenanceFuelData] = useState<MaintenanceFuelData | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWeekChange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);


  useEffect(() => {
    if (dateRange) {
      const fetchResume = async () => {
        setIsLoading(true);
 setMaintenanceFuelData(null); // Reset maintenance data on new fetch
 setError(null);
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (!userId || !token) {
          setError("Usuário não autenticado.");
          setIsLoading(false);
          return;
        }

        const from = format(dateRange.start, "yyyy-MM-dd");
        const to = format(dateRange.end, "yyyy-MM-dd");
        const url = `https://road-cash.onrender.com/entries/resume?userId=${userId}&type=week&from=${from}&to=${to}`;

        try {
 // Fetch resume data
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error("Falha ao buscar dados do resumo. Verifique sua conexão ou tente mais tarde.");
          const data = await response.json();

 // Fetch maintenance and fuel data
          const maintenanceFuelUrl = `https://road-cash.onrender.com/maintenance-expense?userId=${userId}&from=${from}&to=${to}`;
          const maintenanceFuelResponse = await fetch(maintenanceFuelUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!maintenanceFuelResponse.ok) throw new Error("Falha ao buscar dados de manutenção e combustível. Verifique sua conexão ou tente mais tarde.");
          const maintenanceFuelData = await maintenanceFuelResponse.json();
          setMaintenanceFuelData(maintenanceFuelData);
          
          setResumeData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
          setResumeData(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResume();
    }
  }, [dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-4">
        <WeekSelector onWeekChange={handleWeekChange} />
      </div>

      {error && <Card className="bg-destructive/10 text-destructive border-destructive/20 p-4"><CardContent className="flex items-center gap-2 pt-6"><AlertCircle className="h-5 w-5" />{error}</CardContent></Card>}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Ganho Líquido" value={resumeData?.liquidGain ?? 0} icon={TrendingUp} isLoading={isLoading} currency />
        <StatCard title="Despesas" value={resumeData?.totalSpent ?? 0} icon={TrendingDown} isLoading={isLoading} currency />

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas de Manutenção e Combustível</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
              <div className="text-2xl font-bold">R$ {((maintenanceFuelData?.oleo ?? 0) + (maintenanceFuelData?.relacao ?? 0) + (maintenanceFuelData?.pneuDianteiro ?? 0) + (maintenanceFuelData?.pneuTraseiro ?? 0) + (maintenanceFuelData?.gasolina ?? 0)).toFixed(2).replace('.', ',')}</div>
 )}
 </CardContent>
 </Card>
        <StatCard title="Distância" value={parseFloat((resumeData?.totalDistance ?? 0).toFixed(1))} icon={Milestone} isLoading={isLoading} unit="km" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Detalhes Financeiros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Ganho (Bruto)" value={resumeData?.grossGain ?? 0} icon={TrendingUp} isLoading={isLoading} currency />
          <StatCard title="Gasto com Alimentação" value={resumeData?.foodExpense ?? 0} icon={Utensils} isLoading={isLoading} currency />
          <StatCard title="Outros Gastos" value={resumeData?.otherExpense ?? 0} icon={ShoppingCart} isLoading={isLoading} currency />
          <StatCard title="Gasto com gasolina" value={resumeData?.gasolineExpense ?? 0} icon={ShoppingCart} isLoading={isLoading} currency />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
 <CardHeader>
 <CardTitle className="text-sm font-medium">Detalhes de Manutenção e Combustível</CardTitle>
 </CardHeader>
 <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
 {isLoading ? (
 <>
 <Skeleton className="h-8 w-full" />
 <Skeleton className="h-8 w-full" />
 <Skeleton className="h-8 w-full" />
 <Skeleton className="h-8 w-full" />
 <Skeleton className="h-8 w-full" />
 </>
 ) : (
 <>
 <div>
 <div className="text-xs text-muted-foreground">Óleo</div>
 <div className="text-lg font-bold">R$ {(maintenanceFuelData?.oleo ?? 0).toFixed(2).replace('.', ',')}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">Relação</div>
 <div className="text-lg font-bold">R$ {(maintenanceFuelData?.relacao ?? 0).toFixed(2).replace('.', ',')}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">Pneu Dianteiro</div>
 <div className="text-lg font-bold">R$ {(maintenanceFuelData?.pneuDianteiro ?? 0).toFixed(2).replace('.', ',')}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">Pneu Traseiro</div>
 <div className="text-lg font-bold">R$ {(maintenanceFuelData?.pneuTraseiro ?? 0).toFixed(2).replace('.', ',')}</div>
 </div>
 <div>
 <div className="text-xs text-muted-foreground">Gasolina</div>
 <div className="text-lg font-bold">R$ {(maintenanceFuelData?.gasolina ?? 0).toFixed(2).replace('.', ',')}</div>
 </div>
 </>
 )}
 </CardContent>
 </Card>
    </div>
  );
}
