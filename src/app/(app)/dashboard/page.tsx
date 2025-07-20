"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekSelector } from "../components/WeekSelector";
import { format, getDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Milestone,
  Utensils,
  ShoppingCart,
  Fuel,
  Wrench,
  Clock,
  GitCommitHorizontal,
  Footprints,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ResumeData {
  liquidGain: number;
  totalSpent: number;
  totalDistance: number;
  grossGain: number;
  foodExpense: number;
  otherExpense: number;
  gasolineExpense: number;
  timeWorked: string;
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

interface DailyGrossGainData {
  date: string; // Keep the date string here
  day: string; // Keep the day name for X-axis
  grossGain: number;
}

interface Entry {
  date: string;
  grossGain: number;
  // Include other properties of an entry if needed for other calculations
}

/** ------------------------------------------------------------------
 * Utility helpers
 * -----------------------------------------------------------------*/
const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

const getDayName = (dateString: string) => {
  const date = parseISO(dateString);
  const dayOfWeek = getDay(date);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return dayNames[dayOfWeek];
};


/** Class name helper that decides the bg + icon tint based on title.
 *  NOTE: This is intentionally string-based because the calling sites
 *  already pass semantic Portuguese titles. If you later i18n, consider
 *  adding a `variant` prop instead.
 */
function getStatVariantClasses(title: string) {
  const gainTitles = ["Ganho Líquido", "Ganho (Bruto)"];
  const expenseTitles = [
    "Despesas",
    "Gasto com Alimentação",
    "Outros Gastos",
    "Gasto com gasolina",
    "Despesas de Manutenção e Combustível", // <— newly added so it styles consistently
  ];

  if (gainTitles.includes(title)) {
    return {
      card: "bg-green-50 dark:bg-green-900",
      icon: "text-green-600 dark:text-green-300",
      value: "text-green-700 dark:text-green-200", // optional value tint (not used currently)
    } as const;
  }
  if (expenseTitles.includes(title)) {
    return {
      card: "bg-red-50 dark:bg-red-900",
      icon: "text-red-600 dark:text-red-300",
      value: "text-red-700 dark:text-red-200",
    } as const;
  }
  return {
    card: "bg-card",
    icon: "text-muted-foreground",
    value: "",
  } as const;
}

/**
 * Generic StatCard used across dashboard summary grids.
 */
const StatCard = ({
  title,
  value,
  icon,
  isLoading,
  currency = false,
  unit = "",
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  isLoading: boolean;
  currency?: boolean;
  unit?: string;
}) => {
  const Icon = icon;
  const variant = getStatVariantClasses(title);
  return (
    <Card className={`shadow-sm ${variant.card}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variant.icon}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold">
            {currency ? formatCurrency(value) : value}
            {unit && <span className="text-xs text-muted-foreground"> {unit}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [maintenanceFuelData, setMaintenanceFuelData] = useState<MaintenanceFuelData | null>(null);
  const [personalExpenseData, setPersonalExpenseData] = useState<MaintenanceFuelData | null>(null);
  const [dailyGrossGainData, setDailyGrossGainData] = useState<DailyGrossGainData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWeekChange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);

  // Convenience derived totals ------------------------------------------------
  const maintenanceFuelTotal =
    (maintenanceFuelData?.oleo ?? 0) +
    (maintenanceFuelData?.relacao ?? 0) +
    (maintenanceFuelData?.pneuDianteiro ?? 0) +
    (maintenanceFuelData?.pneuTraseiro ?? 0) +
    (maintenanceFuelData?.gasolina ?? 0);

  // Fetch data when dateRange changes -----------------------------------------
  useEffect(() => {
    if (!dateRange) return;

    const fetchData = async () => {
      setIsLoading(true);
      setMaintenanceFuelData(null);
      setPersonalExpenseData(null);
      setDailyGrossGainData([]);
      setError(null);

      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      if (!userId || !token) {
        setError("Usuário não autenticado.");
        setIsLoading(false);
        return;
      }

      const from = format(dateRange.start, "yyyy-MM-dd");
      const to = format(dateRange.end, "yyyy-MM-dd");

      try {
        // Fetch all entries ---------------------------------------------------
        const entriesResponse = await fetch(
          `https://road-cash.onrender.com/get/entries?userId=${userId}&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!entriesResponse.ok) throw new Error("Erro ao buscar lançamentos.");
        const entries: Entry[] = await entriesResponse.json();

        // Calculate daily gross gain and format date to day name --------------
        const dailyDataMap = new Map<string, { grossGain: number; date: string }>();
        entries.forEach(entry => {
          // Format date to yyyy-MM-dd to ensure correct daily aggregation
          const date = format(parseISO(entry.date), 'yyyy-MM-dd');
           if (dailyDataMap.has(date)) {
            dailyDataMap.get(date)!.grossGain += entry.grossGain;
          } else {
            dailyDataMap.set(date, { grossGain: entry.grossGain, date: entry.date });
          }
        });

        // Convert map to array for the chart, format date to day name and sort by date
        const dailyGrossGainArray = Array.from(dailyDataMap.entries()).map(([date, data]) => ({
          day: getDayName(date),
          date: data.date, // Include the date here
          grossGain: data.grossGain
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sorting by date

        setDailyGrossGainData(dailyGrossGainArray);

        // Resume (can potentially be calculated from entries too if needed) -------
        const resumeResponse = await fetch(
          `https://road-cash.onrender.com/entries/resume?userId=${userId}&type=week&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resumeResponse.ok) throw new Error("Erro ao buscar resumo.");
        const resume = await resumeResponse.json();
        setResumeData(resume);

        // Maintenance ---------------------------------------------------------
        const maintenanceResponse = await fetch(
          `https://road-cash.onrender.com/maintenance-expense?userId=${userId}&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!maintenanceResponse.ok) throw new Error("Erro ao buscar manutenção.");
        const maintenance = await maintenanceResponse.json();
        setMaintenanceFuelData(maintenance);

        // Personal ------------------------------------------------------------
        const personalResponse = await fetch(
          `https://road-cash.onrender.com/personal-maintenance-expense?userId=${userId}&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!personalResponse.ok) throw new Error("Erro ao buscar despesas pessoais.");
        const personal = await personalResponse.json();
        setPersonalExpenseData(personal);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido.");
        setResumeData(null);
        setMaintenanceFuelData(null);
        setPersonalExpenseData(null);
        setDailyGrossGainData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Week Selector --------------------------------------------------------*/}
      <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-4">
        <WeekSelector onWeekChange={handleWeekChange} />
      </div>

      {/* Error message ---------------------------------------------------------*/}
      {error && (
        <Card className="bg-destructive/10 text-destructive border-destructive/20 p-4">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* High-level summary ----------------------------------------------------*/}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Ganho Líquido"
          value={resumeData?.liquidGain ?? 0}
          icon={TrendingUp}
          isLoading={isLoading}
          currency
        />
        <StatCard
          title="Despesas"
          value={resumeData?.totalSpent ?? 0}
          icon={TrendingDown}
          isLoading={isLoading}
          currency
        />

        {/* Distância stays in the top summary row */}
        <StatCard
          title="Distância"
          value={parseFloat((resumeData?.totalDistance ?? 0).toFixed(1))}
          icon={Milestone}
          isLoading={isLoading}
          unit="km"
        />
        <StatCard
          title="Tempo Trabalhado"
          value={resumeData?.timeWorked}
          icon={Clock}
          isLoading={isLoading}
          unit="horas"
        />
      </section>

      {/* Daily Gross Gain Chart ------------------------------------------------*/}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Ganho Bruto Diário</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyGrossGainData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string, payload: any[]) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return format(parseISO(data.date), "dd/MM/yyyy");
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="grossGain" fill="#8884d8" name="Ganho Bruto" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>


      {/* Detalhes Financeiros --------------------------------------------------*/}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Detalhes Financeiros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Ganho (Bruto)"
            value={resumeData?.grossGain ?? 0}
            icon={TrendingUp}
            isLoading={isLoading}
            currency
          />
          <StatCard
            title="Gasto com Alimentação"
            value={resumeData?.foodExpense ?? 0}
            icon={Utensils}
            isLoading={isLoading}
            currency
          />
          <StatCard
            title="Outros Gastos"
            value={resumeData?.otherExpense ?? 0}
            icon={ShoppingCart}
            isLoading={isLoading}
            currency
          />
          <StatCard
            title="Despesas de Manutenção e Combustível"
            value={maintenanceFuelTotal}
            icon={Wrench}
            isLoading={isLoading}
            currency
          />
          <StatCard
            title="Gasto com gasolina"
            value={resumeData?.gasolineExpense ?? 0}
            icon={ShoppingCart}
            isLoading={isLoading}
            currency
          />
          {/* New: Despesas de Manutenção e Combustível integrated & styled */}
        </CardContent>
      </Card>

      {/* Detalhes de Manutenção e Combustível (Tabulado por Trabalho/Pessoal) */}
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

            {/* ABA TRABALHO ---------------------------------------------------*/}
            <TabsContent value="trabalho">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-full" />
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
                      <div
                        className={`text-lg font-bold ${(maintenanceFuelData?.oleo ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(maintenanceFuelData?.oleo ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Relação</div>
                      <div
                        className={`text-lg font-bold ${(maintenanceFuelData?.relacao ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(maintenanceFuelData?.relacao ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Dianteiro</div>
                      <div
                        className={`text-lg font-bold ${(maintenanceFuelData?.pneuDianteiro ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(maintenanceFuelData?.pneuDianteiro ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Traseiro</div>
                      <div
                        className={`text-lg font-bold ${(maintenanceFuelData?.pneuTraseiro ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(maintenanceFuelData?.pneuTraseiro ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Gasolina</div>
                      <div
                        className={`text-lg font-bold ${(maintenanceFuelData?.gasolina ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(maintenanceFuelData?.gasolina ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Distância</div>
                      <div className="text-lg font-bold">
                        {(maintenanceFuelData?.totalDistance ?? 0)
                          .toFixed(1)
                          .replace('.', ',')} km
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ABA PESSOAL ----------------------------------------------------*/}
            <TabsContent value="pessoal">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </>
                ) : (
                  <>"
                    <div>
                      <div className="text-xs text-muted-foreground">Óleo</div>
                      <div
                        className={`text-lg font-bold ${(personalExpenseData?.oleo ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(personalExpenseData?.oleo ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Relação</div>
                      <div
                        className={`text-lg font-bold ${(personalExpenseData?.relacao ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(personalExpenseData?.relacao ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Dianteiro</div>
                      <div
                        className={`text-lg font-bold ${(personalExpenseData?.pneuDianteiro ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(personalExpenseData?.pneuDianteiro ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pneu Traseiro</div>
                      <div
                        className={`text-lg font-bold ${(personalExpenseData?.pneuTraseiro ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(personalExpenseData?.pneuTraseiro ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Gasolina</div>
                      <div
                        className={`text-lg font-bold ${(personalExpenseData?.gasolina ?? 0) > 0
                          ? "text-red-600 dark:text-red-300"
                          : ""
                          }`}
                      >
                        {formatCurrency(personalExpenseData?.gasolina ?? 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Distância</div>
                      <div className="text-lg font-bold">
                        {(personalExpenseData?.totalDistance ?? 0)
                          .toFixed(1)
                          .replace('.', ',')} km
                      </div>
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
