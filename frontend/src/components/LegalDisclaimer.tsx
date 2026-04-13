import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type LegalDisclaimerProps = {
  className?: string;
  compact?: boolean;
};

export function LegalDisclaimer({ className, compact = false }: LegalDisclaimerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50/80 text-amber-950",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className={cn("flex items-center gap-2 font-bold", compact ? "text-xs" : "text-sm")}>
        <AlertTriangle className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
        <span>Aviso Legal e Isenção de Responsabilidade</span>
      </div>
      <ol
        className={cn(
          "mt-2 list-decimal space-y-1.5 pl-4",
          compact ? "text-[11px] leading-4" : "text-xs leading-5"
        )}
      >
        <li>Dados extraídos de fontes públicas (Receita/Caixa) podem sofrer atrasos de sincronização.</li>
        <li>A conferência no edital oficial é obrigatória antes de qualquer lance.</li>
        <li>Não nos responsabilizamos por decisões de investimento tomadas a partir destes dados.</li>
      </ol>
    </div>
  );
}
