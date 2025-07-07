"use client";

import { useState, useCallback, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, PlusCircle, Trash2, Edit, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { WeekSelector } from "../components/WeekSelector";
import { EntryForm } from "../components/EntryForm";
import { Skeleton } from "@/components/ui/skeleton";

interface Entry {
  _id: string;
  weekDay: string;
  date: string;
  initialKm: number;
  finalKm: number;
  distance: number;
  grossGain: number;
  liquidGain: number;
  foodExpense: number;
  otherExpense: number;
  spent: number;
  percentageSpent: number;
}

export default function LancamentosPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const fetchEntries = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
      setError("Usuário não autenticado.");
      setIsLoading(false);
      return;
    }

    const from = format(start, "yyyy-MM-dd");
    const to = format(end, "yyyy-MM-dd");
    const url = `https://road-cash.onrender.com/get/entries?userId=${userId}&from=${from}&to=${to}`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Falha ao buscar lançamentos.");
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateRange) {
      fetchEntries(dateRange.start, dateRange.end);
    }
  }, [dateRange, fetchEntries]);

  const handleWeekChange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);

  const handleAddClick = () => {
    setSelectedEntry(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (entry: Entry) => {
    setSelectedEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (entryId: string) => {
    setEntryToDelete(entryId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://road-cash.onrender.com/entry/delete/${userId}/${entryToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Falha ao deletar lançamento.");
      toast({ title: "Sucesso!", description: "Lançamento deletado." });
      if (dateRange) fetchEntries(dateRange.start, dateRange.end);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro." });
    } finally {
      setIsDeleteAlertOpen(false);
      setEntryToDelete(null);
    }
  };

  const onFormSuccess = () => {
    if (dateRange) {
      fetchEntries(dateRange.start, dateRange.end);
    }
  };

  const TableSkeleton = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        {[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1" />
        <div className="flex w-full sm:w-auto items-center justify-end gap-2">
          <WeekSelector onWeekChange={handleWeekChange} />
          <Button onClick={handleAddClick}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lançamentos</CardTitle>
          <CardDescription>Visualize e gerencie seus lançamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabela para desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Distância (km)</TableHead>
                  <TableHead>Ganho Bruto</TableHead>
                  <TableHead>Ganho Líquido</TableHead>
                  <TableHead>Despesas</TableHead>
                  <TableHead>Gasto em %</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableSkeleton /> : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-destructive">
                      <AlertCircle className="inline-block mr-2 h-5 w-5" /> {error}
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Nenhum lançamento encontrado.</TableCell>
                  </TableRow>
                ) : (
                  entries.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell>{entry.weekDay}</TableCell>
                      <TableCell>{format(parseISO(entry.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{entry.distance.toFixed(1)} km</TableCell>
                      <TableCell>R$ {(entry.grossGain || 0).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>R$ {(entry.liquidGain || 0).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>R$ {(entry.spent).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>{(entry.percentageSpent).toFixed(2).replace('.', ',')}%</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(entry)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDeleteClick(entry._id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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

          {/* Cards para mobile */}
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
            ) : entries.length === 0 ? (
              <div className="text-center text-muted-foreground">Nenhum lançamento encontrado.</div>
            ) : (
              entries.map((entry) => (
                <Card key={entry._id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      {entry.weekDay} - {format(parseISO(entry.date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <div className="text-sm"><strong>Distância:</strong> {entry.distance.toFixed(1)} km</div>
                    <div className="text-sm"><strong>Ganho Bruto:</strong> R$ {(entry.grossGain || 0).toFixed(2).replace('.', ',')}</div>
                    <div className="text-sm"><strong>Ganho Líquido:</strong> R$ {(entry.liquidGain || 0).toFixed(2).replace('.', ',')}</div>
                    <div className="text-sm"><strong>Despesas:</strong> R$ {(entry.spent).toFixed(2).replace('.', ',')}</div>
                    <div className="text-sm"><strong>Gasto em %:</strong> {(entry.percentageSpent).toFixed(2).replace('.', ',')}%</div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(entry)}>
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(entry._id)} className="text-destructive">
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
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá deletar permanentemente o lançamento.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
