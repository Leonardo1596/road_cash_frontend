"use client";

import { useState, useCallback, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, PlusCircle, Trash2, Edit, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { WeekSelector } from "../components/WeekSelector";
import { EntryForm } from "../components/EntryForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Entry {
  _id: string;
  weekDay: string;
  date: string;
  initialKm?: number;
  finalKm?: number;
  distance: number;
  grossGain?: number;
  liquidGain?: number;
  foodExpense?: number;
  otherExpense?: number;
  spent: number;
  percentageSpent?: number;
  costPerKm?: number;
  gasolinePrice?: number;
  timeWorked?: number;
  gasolineExpense?: number;
}

interface Expense {
  _id: string;
  weekDay: string;
  date: string;
  description: string;
  category: string;
  price: number;
}

type RecordType = Entry | Expense;

export default function LancamentosPage() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RecordType | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trabalho' | 'pessoal' | 'despesa'>('trabalho');

  const fetchEntries = useCallback(
    async (start: Date, end: Date) => {
      setIsLoading(true);
      setError(null);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setError("Usuário não autenticado.");
        setIsLoading(false);
        return;
      }

      const from = format(start, "yyyy-MM-dd");
      const to = format(end, "yyyy-MM-dd");
      let baseRoute = '';
      if (activeTab === 'trabalho') {
        baseRoute = 'get/entries';
      } else if (activeTab === 'pessoal') {
        baseRoute = 'get/personal-entries';
      } else if (activeTab === 'despesa') {
        baseRoute = 'get/expenses';
      }
      const url = `https://road-cash.onrender.com/${baseRoute}?userId=${userId}&from=${from}&to=${to}`;

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Falha ao buscar lançamentos.");
        const data = await response.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    if (dateRange) {
      fetchEntries(dateRange.start, dateRange.end);
    }
  }, [dateRange, fetchEntries, activeTab]);

  const handleWeekChange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);

  const handleAddClick = () => {
    setSelectedEntry(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (entry: RecordType) => {
    setSelectedEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (entryId: string) => {
    setEntryToDelete(entryId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    let url = '';
    if (activeTab === 'trabalho') {
      url = `https://road-cash.onrender.com/entry/delete/${userId}/${entryToDelete}`;
    } else if (activeTab === 'pessoal') {
      url = `https://road-cash.onrender.com/personal-entry/delete/${userId}/${entryToDelete}`;
    } else if (activeTab === 'despesa') {
      url = `https://road-cash.onrender.com/entry/delete/${userId}/${entryToDelete}`; // Assuming an endpoint for deleting expenses
    }

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Falha ao deletar lançamento.");

      toast({
        title: "Sucesso!",
        description: "Lançamento deletado.",
      });

      if (dateRange) fetchEntries(dateRange.start, dateRange.end);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro.",
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setEntryToDelete(null);
    }
  };


  const onFormSuccess = () => {
    if (dateRange) fetchEntries(dateRange.start, dateRange.end);
  };

  function formatMinutesToHours(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? `${m.toString().padStart(2, '0')}min` : ''}`;
  }

  const TableSkeleton = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        {[...Array(activeTab === 'despesa' ? 5 : 8)].map((__, j) => (
          <TableCell key={j}>
            <Skeleton className="h-4 w-20" />
          </TableCell>
        ))}
      </TableRow>
    ))
  );

  function formatCategoryName(category) {
    if (category === 'alimentacao') return 'Alimentação';
    if (category === 'manutencao') return 'Manutenção';
    return category;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <Tabs defaultValue="trabalho" value={activeTab} onValueChange={(value) => setActiveTab(value as 'trabalho' | 'pessoal' | 'despesa')}>
            <TabsList>
              <TabsTrigger value="trabalho">Trabalho</TabsTrigger>
              <TabsTrigger value="despesa">Despesa</TabsTrigger>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex w-full sm:w-auto items-center justify-end gap-2">
          <WeekSelector onWeekChange={handleWeekChange} />
          <Button onClick={handleAddClick}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <Card>
        {activeTab === 'despesa' ? (
          <CardHeader>
            <CardTitle>Histórico de Despesa</CardTitle>
            <CardDescription>Visualize e gerencie suas despesa.</CardDescription>
          </CardHeader>

        ) : (
          <CardHeader>
            <CardTitle>Histórico de Lançamentos</CardTitle>
            <CardDescription>Visualize e gerencie seus lançamentos {activeTab === 'pessoal' && 'pessoais'}.</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {/* Tabela desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Data</TableHead>
                  {activeTab === 'despesa' ? (
                    <>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Distância (km)</TableHead>
                      {activeTab === "trabalho" ? (
                        <>
                          <TableHead>Ganho Bruto</TableHead>
                          <TableHead>Ganho Líquido</TableHead>
                          <TableHead>Despesa</TableHead>
                          <TableHead>Gasto em %</TableHead>
                          <TableHead>Duração</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Gasto</TableHead>
                          <TableHead>R$/km</TableHead>
                          <TableHead>Preço Gasolina</TableHead>
                          <TableHead>Gasto Gasolina</TableHead>
                        </>
                      )}
                    </>
                  )}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableSkeleton /> : error ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'despesa' ? 5 : 8} className="text-center text-destructive">
                      <AlertCircle className="inline-block mr-2 h-5 w-5" /> {error}
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'despesa' ? 5 : 8} className="text-center">Nenhum lançamento encontrado.</TableCell>
                  </TableRow>
                ) : (
                  records.map(record => (
                    <TableRow key={record._id}>
                      <TableCell>{record.weekDay}</TableCell>
                      <TableCell>{format(parseISO(record.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      {activeTab === 'despesa' ? (
                        record && 'description' in record && 'category' in record && 'price' in record ? (
                          <>
                            <TableCell>{record.description}</TableCell>
                            <TableCell>{formatCategoryName(record.category)}</TableCell>
                            <TableCell className="text-red-600">R$ {record.price.toFixed(2).replace(".", ",")}</TableCell>
                          </>
                        ) : <TableCell colSpan={3}>Tipo de registro inesperado para Despesa.</TableCell>
                      ) : (
                        record && 'distance' in record ? (
                          <>
                            <TableCell>{record.distance.toFixed(1)} km</TableCell>
                            {activeTab === "trabalho" ? (
                              record && 'grossGain' in record && 'liquidGain' in record && 'spent' in record && 'percentageSpent' in record && 'timeWorked' in record ? (
                                <>
                                  <TableCell className={
                                    (record.grossGain || 0) > 0
                                      ? "text-green-600"
                                      : (record.grossGain || 0) < 0
                                        ? "text-red-600"
                                        : "text-muted-foreground"
                                  }>R$ {(record.grossGain || 0).toFixed(2).replace(".", ",")}</TableCell>
                                  <TableCell className={
                                    (record.liquidGain || 0) > 0
                                      ? "text-green-600"
                                      : (record.liquidGain || 0) < 0
                                        ? "text-red-600"
                                        : "text-muted-foreground"
                                  }>R$ {(record.liquidGain || 0).toFixed(2).replace(".", ",")}</TableCell>
                                  <TableCell className={(record.spent || 0) > 0 ? "text-red-600" : "text-muted-foreground"}>R$ {(record.spent || 0).toFixed(2).replace(".", ",")}</TableCell>
                                  <TableCell>{(record.percentageSpent || 0).toFixed(2).replace(".", ",")}%</TableCell>
                                  <TableCell>{formatMinutesToHours(record.timeWorked ?? 0)}</TableCell>
                                </>
                              ) : <TableCell colSpan={5}>Tipo de registro inesperado para Trabalho.</TableCell>
                            ) : (
                              record && 'spent' in record && 'costPerKm' in record && 'gasolinePrice' in record && 'gasolineExpense' in record ? (
                                <>
                                  <TableCell>R$ {(record.spent || 0).toFixed(2).replace(".", ",")}</TableCell>
                                  <TableCell>R$ {(record.costPerKm || 0).toFixed(2).replace(".", ",")}</TableCell>
                                  <TableCell>R$ {(record.gasolinePrice || 0).toFixed(2).replace(".", ",")}</TableCell>
                                  <TableCell className={(record.gasolineExpense || 0) > 0 ? "text-red-600" : "text-muted-foreground"}>
                                    R$ {(record.gasolineExpense || 0).toFixed(2).replace(".", ",")}</TableCell>
                                </>
                              ) : <TableCell colSpan={4}>Tipo de registro inesperado para Pessoal.</TableCell>
                            )}
                          </>
                        ) : <TableCell colSpan={6}>Tipo de registro inesperado.</TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {activeTab !== "despesa" && (
                              <DropdownMenuItem onSelect={() => handleEditClick(record)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => handleDeleteClick(record._id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Cards mobile */}
          <div className="sm:hidden space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <Card key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))
            ) : error ? (
              <div className="text-center text-destructive flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" /> {error}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center text-muted-foreground">Nenhum lançamento encontrado.</div>
            ) : (
              records.map((record) => (
                <Card key={record._id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      {record.weekDay} - {format(parseISO(record.date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    {activeTab === 'despesa' ? (
                      record && 'description' in record && 'category' in record && 'price' in record ? (
                        <>
                          <div className="text-sm"><strong>Descrição:</strong> {record.description}</div>
                          <div className="text-sm"><strong>Categoria:</strong> {record.category}</div>
                          <div className="text-sm text-red-600"><strong>Preço:</strong> R$ {record.price.toFixed(2).replace(".", ",")}</div>
                        </>
                      ) : <div className="text-sm text-destructive">Tipo de registro inesperado para Despesa.</div>
                    ) : (
                      record && 'distance' in record ? (
                        <>
                          <div className="text-sm"><strong>Distância:</strong> {record.distance.toFixed(1)} km</div>

                          {activeTab === "trabalho" ? (
                            record && 'grossGain' in record && 'liquidGain' in record && 'spent' in record && 'percentageSpent' in record && 'timeWorked' in record ? (
                              <>
                                <div className={`text-sm ${(record.grossGain || 0) > 0
                                  ? "text-green-600"
                                  : (record.grossGain || 0) < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                                  }`}><strong>Ganho Bruto:</strong> R$ {record.grossGain?.toFixed(2).replace(".", ",")}</div>
                                <div className={`text-sm ${(record.liquidGain || 0) > 0
                                  ? "text-green-600"
                                  : (record.liquidGain || 0) < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                                  }`}><strong>Ganho Líquido:</strong> R$ {record.liquidGain?.toFixed(2).replace(".", ",")}</div>
                                <div className={`text-sm ${(record.spent || 0) > 0 ? "text-red-600" : "text-muted-foreground"
                                  }`}><strong>Despesa:</strong> R$ {record.spent?.toFixed(2).replace(".", ",")}</div>
                                <div className="text-sm"><strong>Gasto em %:</strong> {record.percentageSpent?.toFixed(2).replace(".", ",")}%</div>
                                <div className="text-sm"><strong>Duração:</strong> {formatMinutesToHours(record.timeWorked ?? 0)}</div>
                              </>
                            ) : <div className="text-sm text-destructive">Tipo de registro inesperado para Trabalho.</div>
                          ) : (
                            record && 'spent' in record && 'costPerKm' in record && 'gasolinePrice' in record && 'gasolineExpense' in record ? (
                              <>
                                <div className={`text-sm ${(record.spent || 0) > 0 ? "text-red-600" : "text-muted-foreground"}`}><strong>Gasto:</strong> R$ {record.spent?.toFixed(2).replace(".", ",")}</div>
                                <div className="text-sm"><strong>R$/km:</strong> R$ {record.costPerKm?.toFixed(2).replace(".", ",")}</div>
                                <div className="text-sm"><strong>Preço Gasolina:</strong> R$ {record.gasolinePrice?.toFixed(2).replace(".", ",")}</div>
                                <div className="text-sm"><strong>Gasto Gasolina:</strong> R$ {record.gasolineExpense?.toFixed(2).replace(".", ",")}
                                </div>
                              </>
                            ) : <div className="text-sm text-destructive">Tipo de registro inesperado para Pessoal.</div>
                          )}
                        </>
                      ) : <div className="text-sm text-destructive">Tipo de registro inesperado.</div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activeTab !== "despesa" && handleEditClick(record)}
                        disabled={activeTab === "despesa"}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(record._id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" /> Deletar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <EntryForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={onFormSuccess}
        entry={selectedEntry}
        activeTab={activeTab}
      />


      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente o lançamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}