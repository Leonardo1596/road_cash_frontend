"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const entrySchema = z
  .object({
    date: z.date({ required_error: "A data é obrigatória." }),
    initialKm: z.coerce.number().min(0, "KM inicial deve ser positivo."),
    finalKm: z.coerce.number().min(0, "KM final deve ser positivo."),
    grossGain: z.coerce.number().min(0, "Ganho bruto deve ser positivo."),
    foodExpense: z.coerce.number().min(0, "Gasto com alimentação deve ser positivo."),
    otherExpense: z.coerce.number().min(0, "Outros gastos devem ser positivos."),
  })
  .refine((data) => data.finalKm >= data.initialKm, {
    message: "KM final deve ser maior ou igual ao KM inicial.",
    path: ["finalKm"],
  });

type EntryFormValues = z.infer<typeof entrySchema>;

interface EntryFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entry?: any;
}

export function EntryForm({
  isOpen,
  onOpenChange,
  onSuccess,
  entry,
}: EntryFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!entry;

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (entry) {
        form.reset({
          ...entry,
          date: entry.date ? new Date(entry.date) : new Date(),
        });
      } else {
        form.reset({
          date: new Date(),
          initialKm: 0,
          finalKm: 0,
          grossGain: 0,
          foodExpense: 0,
          otherExpense: 0,
        });
      }
    }
  }, [entry, form, isOpen]);

  const onSubmit = async (data: EntryFormValues) => {
    setIsLoading(true);
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userId || !token) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado.",
      });
      setIsLoading(false);
      return;
    }

    const payload = {
      ...data,
      userId,
      date: format(data.date, "yyyy-MM-dd"),
    };

    const url = isEditing
      ? `https://road-cash.onrender.com/entry/update/${userId}/${entry._id}`
      : `https://road-cash.onrender.com/entry/create`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Falha ao ${
            isEditing ? "atualizar" : "criar"
          } lançamento.`
        );
      }

      toast({
        title: "Sucesso!",
        description: `Lançamento ${
          isEditing ? "atualizado" : "criado"
        } com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Aqui o modal tem largura limitada, centralizado e padding */}
      <DialogContent className="w-full max-w-md mx-auto p-6">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? "Editar Lançamento" : "Adicionar Lançamento"}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do seu dia de trabalho.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(field.value, "PPP", { locale: ptBR })
                            : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2000-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="initialKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finalKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Final</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="grossGain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ganho (Bruto)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      placeholder="R$ 0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="foodExpense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gasto com Alimentação</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        placeholder="R$ 0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otherExpense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outros Gastos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        placeholder="R$ 0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
