"use client";

import * as React from "react";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type WeekSelectorProps = {
  onWeekChange: (start: Date, end: Date) => void;
};

export function WeekSelector({ onWeekChange }: WeekSelectorProps) {
  const [selectedRange, setSelectedRange] = React.useState<DateRange>(() => {
    const today = new Date();
    return {
      from: startOfWeek(today, { weekStartsOn: 1 }),
      to: endOfWeek(today, { weekStartsOn: 1 }),
    };
  });

  const [popoverOpen, setPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (selectedRange?.from && selectedRange?.to) {
      onWeekChange(selectedRange.from, selectedRange.to);
    }
  }, [selectedRange, onWeekChange]);

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range) {
      setSelectedRange(range);
    }
    if (range?.from && range?.to) {
      setPopoverOpen(false);
    }
  };

  const changeWeek = (direction: "prev" | "next") => {
    if (!selectedRange?.from || !selectedRange?.to) return;

    const diff = 7;
    const newFrom = addDays(selectedRange.from, direction === "prev" ? -diff : diff);
    const newTo = addDays(selectedRange.to, direction === "prev" ? -diff : diff);
    setSelectedRange({ from: newFrom, to: newTo });
  };

  const start = selectedRange?.from;
  const end = selectedRange?.to;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => changeWeek("prev")}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Semana anterior</span>
      </Button>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal",
              !selectedRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {start && end ? (
              <span>
                {format(start, "d MMM", { locale: ptBR })} -{" "}
                {format(end, "d MMM, yyyy", { locale: ptBR })}
              </span>
            ) : (
              <span>Selecione um intervalo</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full max-w-xs p-0 overflow-auto" 
          style={{ maxHeight: '350px' }} // Limita altura para evitar overflow vertical
        >
          <div className="min-w-0"> {/* Garante que o calendário não force overflow */}
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleDateSelect}
              initialFocus
              locale={ptBR}
              className="min-w-0"
            />
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={() => changeWeek("next")}>
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próxima semana</span>
      </Button>
    </div>
  );
}
