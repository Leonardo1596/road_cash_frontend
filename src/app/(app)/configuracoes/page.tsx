"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
    oleo: z.object({ lifeSpan: z.coerce.number(), price: z.coerce.number() }),
    relacao: z.object({ lifeSpan: z.coerce.number(), price: z.coerce.number() }),
    pneuDianteiro: z.object({ lifeSpan: z.coerce.number(), price: z.coerce.number() }),
    pneuTraseiro: z.object({ lifeSpan: z.coerce.number(), price: z.coerce.number() }),
    gasoline: z.object({ lifeSpan: z.coerce.number(), price: z.coerce.number() }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const maintenanceItems = [
    { id: 'oleo' as const, label: 'Óleo', lifeSpanLabel: 'Vida Útil (km)', priceLabel: 'Preço (R$)' },
    { id: 'relacao' as const, label: 'Relação', lifeSpanLabel: 'Vida Útil (km)', priceLabel: 'Preço (R$)' },
    { id: 'pneuDianteiro' as const, label: 'Pneu Dianteiro', lifeSpanLabel: 'Vida Útil (km)', priceLabel: 'Preço (R$)' },
    { id: 'pneuTraseiro' as const, label: 'Pneu Traseiro', lifeSpanLabel: 'Vida Útil (km)', priceLabel: 'Preço (R$)' },
    { id: 'gasoline' as const, label: 'Gasolina', lifeSpanLabel: 'Consumo (km/L)', priceLabel: 'Preço por Litro (R$)' },
];

export default function SettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [costPerKmId, setCostPerKmId] = useState<string | null>(null);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            oleo: { lifeSpan: 0, price: 0 },
            relacao: { lifeSpan: 0, price: 0 },
            pneuDianteiro: { lifeSpan: 0, price: 0 },
            pneuTraseiro: { lifeSpan: 0, price: 0 },
            gasoline: { lifeSpan: 0, price: 0 },
        },
    });

  const updateCostPerKm = async (userId: string, costPerKmId: string, data: any, token: string) => {
    const url = `https://road-cash-backend.onrender.com/cost_per_km/update/${userId}/${costPerKmId}`;
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Error updating cost per km: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

    useEffect(() => {
        const fetchSettings = async () => {
            setIsFetching(true);
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
    
            if (!userId || !token) {
                // Handle case where user is not authenticated, maybe redirect to login
                console.error('User not authenticated');
                setIsFetching(false);
                return;
            }
    
            try {
                const response = await fetch(`https://road-cash-backend.onrender.com/get/costPerKm/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
    
                // Transform the fetched data to match the form structure
                setCostPerKmId(data._id); // Assuming the response includes the _id
                const transformedData = {
                    oleo: { lifeSpan: data.oleo.km, price: data.oleo.value },
                    relacao: { lifeSpan: data.relacao.km, price: data.relacao.value },
                    pneuDianteiro: { lifeSpan: data.pneuDianteiro.km, price: data.pneuDianteiro.value },
                    pneuTraseiro: { lifeSpan: data.pneuTraseiro.km, price: data.pneuTraseiro.value },
                    gasoline: { lifeSpan: data.gasolina.km, price: data.gasolina.value },
                };
    
                form.reset(transformedData);
    
            } catch (error) {
                console.error('Error fetching settings:', error);
                toast({
                    title: 'Erro ao carregar configurações',
                    description: 'Não foi possível carregar as configurações existentes.',
                    variant: 'destructive',
                });
            } finally {
                setIsFetching(false);
            }
        };
    
        fetchSettings();
    }, [form, toast]); // Added toast to dependency array

    const onSubmit = async (data: SettingsFormValues) => {
        console.log(data);
        if (!costPerKmId) {
            toast({
                title: 'Erro ao salvar configurações',
                description: 'Não foi possível encontrar o ID das configurações existentes.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);        
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!userId || !token) {
            console.error('User not authenticated');
            setIsLoading(false);
            toast({
                title: 'Erro',
                description: 'Usuário não autenticado. Faça login novamente.',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Transform data to the expected backend format (km and value)
            const transformedData = {
                oleo: { km: data.oleo.lifeSpan, value: data.oleo.price },
                relacao: { km: data.relacao.lifeSpan, value: data.relacao.price },
                pneuDianteiro: { km: data.pneuDianteiro.lifeSpan, value: data.pneuDianteiro.price },
                pneuTraseiro: { km: data.pneuTraseiro.lifeSpan, value: data.pneuTraseiro.price },
                gasolina: { km: data.gasoline.lifeSpan, value: data.gasoline.price },
 };
            await updateCostPerKm(userId, costPerKmId, transformedData, token);
            toast({
                title: 'Configurações Salvas',
                description: 'Suas configurações de custo por KM foram atualizadas com sucesso.',
            });
        } catch (error) {
             console.error('Error saving settings:', error);
        } finally { setIsLoading(false); }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Custos de Manutenção e Desempenho</CardTitle>
                <CardDescription>Configure a vida útil e o preço dos itens para calcular os custos por KM de forma precisa.</CardDescription>
            </CardHeader>
            <CardContent>
                {isFetching ? (
                    <div className="space-y-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                <div className="md:col-span-1"><Skeleton className="h-6 w-3/4" /></div>
                                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {maintenanceItems.map((item, index) => (
                                <div key={item.id}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 items-start">
                                        <h3 className="font-medium md:pt-2">{item.label}</h3>
                                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`${item.id}.lifeSpan`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{item.lifeSpanLabel}</FormLabel>
                                                        <FormControl><Input type="number" step="any" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`${item.id}.price`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{item.priceLabel}</FormLabel>
                                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    {index < maintenanceItems.length - 1 && <Separator className="mt-6" />}
                                </div>
                            ))}
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
