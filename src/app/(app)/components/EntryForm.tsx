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
import { NumericFormat } from "react-number-format";

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
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [grossGain, setGrossGain] = useState("");
  const [foodExpense, setFoodExpense] = useState("");
  const [otherExpense, setOtherExpense] = useState("");
  const [distance, setDistance] = useState("");

  const isEditing = !!entry;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && entry) {
        setDate(entry.date ? new Date(entry.date + "T00:00:00") : new Date());
        setInitialKm(entry.initialKm?.toString() || "");
        setFinalKm(entry.finalKm?.toString() || "");
        setHours(Math.floor(entry.timeWorked / 60).toString());
        setMinutes((entry.timeWorked % 60).toString());
        setGrossGain(entry.grossGain?.toString() || "");
        setFoodExpense(entry.foodExpense?.toString() || "");
        setOtherExpense(entry.otherExpense?.toString() || "");
        setDistance(entry.distance?.toString() || "");
        console.log(entry);
      } else {
        setDate(new Date());
        setInitialKm("");
        setFinalKm("");
        setHours("");
        setMinutes("");
        setGrossGain("");
        setFoodExpense("");
        setOtherExpense("");
        setDistance("");
      }
    }
  }, [isOpen, isEditing, entry]);


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

    const timeWorked =
      (parseInt(hours || "0", 10) * 60) + parseInt(minutes || "0", 10);

    const body: any = {
      userId,
      date: format(date, "yyyy-MM-dd"),
    };

    if (activeTab === "trabalho") {
      body.initialKm = Number(initialKm) || 0;
      body.finalKm = Number(finalKm) || 0;
      body.distance =
        Number(finalKm) > Number(initialKm)
          ? Number(finalKm) - Number(initialKm)
          : 0;
      body.grossGain = Number(grossGain) || 0;
      body.timeWorked = Number(timeWorked) || 0;
      body.foodExpense = Number(foodExpense) || 0;
      body.otherExpense = Number(otherExpense) || 0;
    } else {
      body.distance = Number(distance) || 0;
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
                    placeholder="0 km"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>KM Final</Label>
                  <Input
                    type="number"
                    value={finalKm}
                    onChange={(e) => setFinalKm(e.target.value)}
                    placeholder="0 km"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Horas</Label>
                  <Input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="horas"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Minutos</Label>
                    <Input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="minutos"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ganho Bruto</Label>
                <NumericFormat
                  value={grossGain}
                  onValueChange={(values) => setGrossGain(values.value)}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale={true}
                  allowLeadingZeros={false}
                  placeholder="R$ 0,00"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  customInput={Input}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Gasto com Lanche</Label>
                  <NumericFormat
                    value={foodExpense}
                    onValueChange={(values) => setFoodExpense(values.value)}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale={true}
                    allowLeadingZeros={false}
                    placeholder="R$ 0,00"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    customInput={Input}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Outros Gastos</Label>
                  <NumericFormat
                    value={otherExpense}
                    onValueChange={(values) => setOtherExpense(values.value)}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale={true}
                    allowLeadingZeros={false}
                    placeholder="R$ 0,00"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    customInput={Input}
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
                placeholder="0"
              />
            </div>
          )}

          <Button type="submit" className="w-full">
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog >
  );
}
