"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekSelector } from "../components/WeekSelector";
import { format } from "date-fns";
import { Loader2, TrendingUp, TrendingDown, Milestone, Utensils, ShoppingCart, Fuel, Wrench, GitCommitHorizontal, Footprints, AlertCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Card className={`shadow-sm ${title === "Ganho Líquido" || title === "Ganho (Bruto)"
        ? 'bg-green-50 dark:bg-green-900'
        : title === "Despesas" || title === "Gasto com Alimentação" || title === "Outros Gastos" || title === "Gasto com gasolina"
          ? 'bg-red-50 dark:bg-red-900'
          : 'bg-card'
      }`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${title === "Ganho Líquido" || title === "Ganho (Bruto)" ? 'text-green-600 dark:text-green-300'
            : title === "Despesas" || title === "Gasto com Alimentação" || title === "Outros Gastos" || title === "Gasto com gasolina" ? 'text-red-600 dark:text-red-300'
              : 'text-muted-foreground'
          }`} />
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
  const [personalExpenseData, setPersonalExpenseData] = useState<MaintenanceFuelData | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWeekChange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);


  useEffect(() => {
    if (dateRange) {
      const fetchData = async () => {
        setIsLoading(true);
        setMaintenanceFuelData(null);
        setPersonalExpenseData(null);
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

        try {
          // Fetch resume
          const resumeResponse = await fetch(
            `https://road-cash.onrender.com/entries/resume?userId=${userId}&type=week&from=${from}&to=${to}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (!resumeResponse.ok) throw new Error("Erro ao buscar resumo.");
          const resume = await resumeResponse.json();
          setResumeData(resume);

          // Fetch maintenance
          const maintenanceResponse = await fetch(
            `https://road-cash.onrender.com/maintenance-expense?userId=${userId}&from=${from}&to=${to}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (!maintenanceResponse.ok) throw new Error("Erro ao buscar manutenção.");
          const maintenance = await maintenanceResponse.json();
          setMaintenanceFuelData(maintenance);

          // Fetch personal
          const personalResponse = await fetch(
            `https://road-cash.onrender.com/personal-maintenance-expense?userId=${userId}&from=${from}&to=${to}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (!personalResponse.ok) throw new Error("Erro ao buscar despesas pessoais.");
          const personal = await personalResponse.json();
          setPersonalExpenseData(personal);

        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro desconhecido.");
          setResumeData(null);
          setMaintenanceFuelData(null);
          setPersonalExpenseData(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
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
              <div className={`text-2xl font-bold ${((maintenanceFuelData?.oleo ?? 0) + (maintenanceFuelData?.relacao ?? 0) + (maintenanceFuelData?.pneuDianteiro ?? 0) + (maintenanceFuelData?.pneuTraseiro ?? 0) + (maintenanceFuelData?.gasolina ?? 0)) > 0 ? 'text-red-600 dark:text-red-300' : ''
                }`}>R$ {((maintenanceFuelData?.oleo ?? 0) + (maintenanceFuelData?.relacao ?? 0) + (maintenanceFuelData?.pneuDianteiro ?? 0) + (maintenanceFuelData?.pneuTraseiro ?? 0) + (maintenanceFuelData?.gasolina ?? 0)).toFixed(2).replace('.', ',')}</div>
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
        <CardContent>
          <Tabs defaultValue="trabalho" className="w-full">
            <TabsList>
              <TabsTrigger value="trabalho">Trabalho</TabsTrigger>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
            </TabsList>

            {/* ABA TRABALHO */}
            <TabsContent value="trabalho">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                      <div className={`text-lg font-bold ${(maintenanceFuelData?.oleo ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(maintenanceFuelData?.oleo ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Relação</div>
                      <div className={`text-lg font-bold ${(maintenanceFuelData?.relacao ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(maintenanceFuelData?.relacao ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Dianteiro</div>
                      <div className={`text-lg font-bold ${(maintenanceFuelData?.pneuDianteiro ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(maintenanceFuelData?.pneuDianteiro ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Traseiro</div>
                      <div className={`text-lg font-bold ${(maintenanceFuelData?.pneuTraseiro ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(maintenanceFuelData?.pneuTraseiro ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Gasolina</div>
                      <div className={`text-lg font-bold ${(maintenanceFuelData?.gasolina ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(maintenanceFuelData?.gasolina ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>



            {/* ABA PESSOAL */}
            <TabsContent value="pessoal">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                      <div className={`text-lg font-bold ${(personalExpenseData?.oleo ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(personalExpenseData?.oleo ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Relação</div>
                      <div className={`text-lg font-bold ${(personalExpenseData?.relacao ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(personalExpenseData?.relacao ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Dianteiro</div>
                      <div className={`text-lg font-bold ${(personalExpenseData?.pneuDianteiro ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(personalExpenseData?.pneuDianteiro ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Traseiro</div>
                      <div className={`text-lg font-bold ${(personalExpenseData?.pneuTraseiro ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(personalExpenseData?.pneuTraseiro ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Gasolina</div>
                      <div className={`text-lg font-bold ${(personalExpenseData?.gasolina ?? 0) > 0 ? 'text-red-600 dark:text-red-300' : ''
                        }`}>R$ {(personalExpenseData?.gasolina ?? 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
