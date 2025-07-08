"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface EntryFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entry?: any;
  activeTab: "trabalho" | "pessoal";
}

export function EntryForm({
  isOpen,
  onOpenChange,
  onSuccess,
  entry,
  activeTab,
}: EntryFormProps) {
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [initialKm, setInitialKm] = useState("");
  const [finalKm, setFinalKm] = useState("");
  const [grossGain, setGrossGain] = useState("");
  const [foodExpense, setFoodExpense] = useState("");
  const [otherExpense, setOtherExpense] = useState("");
  const [distance, setDistance] = useState("");

  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setDate(entry.date ? new Date(entry.date) : new Date());
      setInitialKm(entry.initialKm?.toString() || "");
      setFinalKm(entry.finalKm?.toString() || "");
      setGrossGain(entry.grossGain?.toString() || "");
      setFoodExpense(entry.foodExpense?.toString() || "");
      setOtherExpense(entry.otherExpense?.toString() || "");
      setDistance(entry.distance?.toString() || "");
    } else {
      setDate(new Date());
      setInitialKm("");
      setFinalKm("");
      setGrossGain("");
      setFoodExpense("");
      setOtherExpense("");
      setDistance("");
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado.",
      });
      return;
    }

    if (!date) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Data é obrigatória.",
      });
      return;
    }

    const body: any = {
      userId,
      date: format(date, "yyyy-MM-dd"),
    };

    if (activeTab === "trabalho") {
      body.initialKm = Number(initialKm);
      body.finalKm = Number(finalKm);
      body.distance =
        Number(finalKm) > Number(initialKm)
          ? Number(finalKm) - Number(initialKm)
          : 0;
      body.grossGain = Number(grossGain);
      body.foodExpense = Number(foodExpense);
      body.otherExpense = Number(otherExpense);
    } else {
      body.distance = Number(distance);
      // removido campo gasto total
    }

    const baseUrl =
      activeTab === "pessoal"
        ? "https://road-cash.onrender.com/personal-entry"
        : "https://road-cash.onrender.com/entry";

    const url = isEditing
      ? `${baseUrl}/update/${userId}/${entry._id}`
      : `${baseUrl}/create`;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar o lançamento.");
      }

      toast({ title: "Sucesso", description: "Lançamento salvo com sucesso." });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          err instanceof Error ? err.message : "Erro ao salvar o lançamento.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto px-4 sm:px-6 rounded-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? "Editar" : "Adicionar"} Lançamento{" "}
            {activeTab === "pessoal" ? "Pessoal" : "de Trabalho"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do seu dia de{" "}
            {activeTab === "pessoal" ? "gasto pessoal" : "trabalho"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-left flex items-center justify-between"
                >
                  {date ? (
                    format(date, "PPP", { locale: ptBR })
                  ) : (
                    <span className="text-muted-foreground">Escolha uma data</span>
                  )}
                  <CalendarIcon className="ml-2 h-5 w-5 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("2000-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {activeTab === "trabalho" ? (
            <>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>KM Inicial</Label>
                  <Input
                    type="number"
                    value={initialKm}
                    onChange={(e) => setInitialKm(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>KM Final</Label>
                  <Input
                    type="number"
                    value={finalKm}
                    onChange={(e) => setFinalKm(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ganho Bruto</Label>
                <Input
                  type="number"
                  value={grossGain}
                  onChange={(e) => setGrossGain(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Gasto com Lanche</Label>
                  <Input
                    type="number"
                    value={foodExpense}
                    onChange={(e) => setFoodExpense(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Outros Gastos</Label>
                  <Input
                    type="number"
                    value={otherExpense}
                    onChange={(e) => setOtherExpense(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Distância (km)</Label>
              <Input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full">
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
