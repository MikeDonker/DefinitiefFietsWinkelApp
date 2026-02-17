import { useState, useRef } from "react";
import {
  Sparkles,
  Camera,
  FileText,
  AlertTriangle,
  Search,
  X,
  Copy,
  TrendingDown,
  Brain,
  ImageIcon,
  Zap,
  Check,
  RefreshCw,
  Loader2,
  Upload,
} from "lucide-react";
import {
  useAIStatus,
  useSmartSearch,
  usePhotoRecognition,
  useInvoiceParser,
  useAISignals,
} from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BikeStatusBadge, BIKE_STATUS_LABELS } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { Bike, AISignal } from "@/lib/types";

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "-";
  return `\u20AC ${amount.toFixed(2)}`;
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

function FeatureCard({ icon, title, subtitle, color, onClick, disabled }: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-slate-800 rounded-2xl p-4 border border-slate-700 text-left transition-all",
        "hover:bg-slate-800/80 hover:border-slate-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-3", color)}
      >
        {icon}
      </div>
      <h3 className="text-slate-100 text-sm font-bold mb-1">{title}</h3>
      <p className="text-gray-500 text-xs leading-relaxed">{subtitle}</p>
    </button>
  );
}

// Bike Result Card
function BikeResultCard({ bike }: { bike: Bike }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-slate-100 text-sm font-semibold truncate">
          {bike.brand?.name ?? "Onbekend"} {bike.model?.name ?? ""}
        </p>
        <p className="text-gray-500 text-xs mt-1">Frame: {bike.frameNumber}</p>
        {bike.color ? (
          <p className="text-gray-500 text-xs">Kleur: {bike.color}</p>
        ) : null}
      </div>
      <div className="text-right ml-4">
        <p className="text-green-400 text-sm font-bold">
          {formatCurrency(bike.sellingPrice)}
        </p>
        <BikeStatusBadge status={bike.status} className="mt-1" />
      </div>
    </div>
  );
}

// Signal Card
function SignalCard({ signal }: { signal: AISignal }) {
  const isCritical = signal.severity === "critical";
  const color = isCritical ? "red" : "orange";

  const iconMap: Record<AISignal["type"], React.ReactNode> = {
    duplicate_frame: <Copy className="w-4 h-4" />,
    price_outlier: <TrendingDown className="w-4 h-4" />,
    negative_stock: <AlertTriangle className="w-4 h-4" />,
  };

  const typeLabels: Record<AISignal["type"], string> = {
    duplicate_frame: "Dubbel framenummer",
    price_outlier: "Prijsafwijking",
    negative_stock: "Negatieve voorraad",
  };

  return (
    <div
      className={cn(
        "bg-slate-800 rounded-xl p-4 border-l-4",
        isCritical ? "border-l-red-500 border-red-500/40" : "border-l-orange-500 border-orange-500/40",
        "border border-slate-700"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isCritical ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
          )}
        >
          {iconMap[signal.type]}
        </div>
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            {typeLabels[signal.type]}
          </p>
        </div>
        <span
          className={cn(
            "text-xs font-bold uppercase px-2 py-0.5 rounded",
            isCritical ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
          )}
        >
          {isCritical ? "Kritiek" : "Waarschuwing"}
        </span>
      </div>
      <p className="text-slate-100 text-sm">{signal.message}</p>
    </div>
  );
}

// Confidence Bar
function ConfidenceBar({ confidence }: { confidence: number }) {
  const barColor =
    confidence >= 0.8 ? "bg-green-500" : confidence >= 0.5 ? "bg-orange-500" : "bg-red-500";
  const label = confidence >= 0.8 ? "Hoog" : confidence >= 0.5 ? "Gemiddeld" : "Laag";

  return (
    <div className="mt-4">
      <div className="flex justify-between mb-2">
        <span className="text-gray-400 text-sm">Betrouwbaarheid</span>
        <span className={cn("text-sm font-bold", barColor.replace("bg-", "text-"))}>
          {Math.round(confidence * 100)}% - {label}
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
    </div>
  );
}

// Detail Row
function DetailRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-700">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-slate-100 text-sm font-semibold">{String(value)}</span>
    </div>
  );
}

export default function AIPage() {
  const [activeModal, setActiveModal] = useState<"search" | "photo" | "invoice" | "signals" | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [invoiceText, setInvoiceText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: aiStatus, isLoading: statusLoading, isError: statusError } = useAIStatus();
  const smartSearchMutation = useSmartSearch();
  const photoMutation = usePhotoRecognition();
  const invoiceMutation = useInvoiceParser();
  const { data: signals, isLoading: signalsLoading, refetch: refetchSignals, isRefetching: signalsRefetching } = useAISignals();

  const handleSmartSearch = () => {
    if (!searchQuery.trim()) return;
    smartSearchMutation.mutate(searchQuery.trim());
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        // Extract base64 data without prefix
        const base64Data = base64.split(",")[1];
        photoMutation.mutate(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleParseInvoice = () => {
    if (!invoiceText.trim()) return;
    invoiceMutation.mutate(invoiceText.trim());
  };

  const features = aiStatus?.features;

  if (statusLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-red-400 text-xl font-semibold mb-2">AI niet bereikbaar</h2>
        <p className="text-gray-500 text-center mb-6">
          Kan de AI-status niet laden. Probeer het opnieuw.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-slate-100 text-2xl lg:text-3xl font-extrabold">AI Assistent</h1>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-6">Slimme tools voor je fietswinkel</p>

      {/* AI Status Pill */}
      <div className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 flex items-center gap-3 mb-6">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            aiStatus?.enabled ? "bg-green-400" : "bg-red-400"
          )}
        />
        <span className="text-slate-100 text-sm font-semibold flex-1">
          AI is {aiStatus?.enabled ? "actief" : "uitgeschakeld"}
        </span>
        <Zap className={cn("w-4 h-4", aiStatus?.enabled ? "text-green-400" : "text-gray-500")} />
      </div>

      {/* Feature Cards Grid */}
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
        Functies
      </p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <FeatureCard
          icon={<Sparkles className="w-5 h-5 text-blue-400" />}
          title="Slim Zoeken"
          subtitle="Zoek fietsen met natuurlijke taal"
          color="bg-blue-500/20"
          onClick={() => setActiveModal("search")}
          disabled={!features?.smartSearch}
        />
        <FeatureCard
          icon={<Camera className="w-5 h-5 text-green-400" />}
          title="Foto Herkenning"
          subtitle="Herken fietsen via een foto"
          color="bg-green-500/20"
          onClick={() => setActiveModal("photo")}
          disabled={!features?.photoRecognition}
        />
        <FeatureCard
          icon={<FileText className="w-5 h-5 text-orange-400" />}
          title="Factuur Scanner"
          subtitle="Lees facturen automatisch in"
          color="bg-orange-500/20"
          onClick={() => setActiveModal("invoice")}
          disabled={!features?.invoiceParser}
        />
        <FeatureCard
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          title="AI Signalen"
          subtitle="Waarschuwingen en inzichten"
          color="bg-red-500/20"
          onClick={() => setActiveModal("signals")}
          disabled={!features?.signals}
        />
      </div>

      {/* Tips */}
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
        Tips
      </p>
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
        <div className="flex gap-3">
          <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-400 text-sm">
            Probeer: "rode fietsen onder 500 euro" of "mountainbikes maat L"
          </p>
        </div>
        <div className="flex gap-3">
          <Camera className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-400 text-sm">
            Upload een foto van een fiets om merk en model te herkennen
          </p>
        </div>
        <div className="flex gap-3">
          <FileText className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-400 text-sm">
            Plak factuurtekst om automatisch artikelen in te lezen
          </p>
        </div>
      </div>

      {/* Smart Search Modal */}
      <Dialog open={activeModal === "search"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Slim Zoeken
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Beschrijf wat je zoekt in je eigen woorden
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="bijv. rode fietsen onder 500 euro..."
                className="bg-slate-800 border-slate-700 text-slate-100"
                onKeyDown={(e) => e.key === "Enter" && handleSmartSearch()}
              />
              <Button
                onClick={handleSmartSearch}
                disabled={!searchQuery.trim() || smartSearchMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {smartSearchMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {smartSearchMutation.isError ? (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-semibold">Zoeken mislukt</p>
              </div>
            ) : null}

            {smartSearchMutation.data ? (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-slate-100 text-sm">{smartSearchMutation.data.explanation}</p>
                </div>

                <p className="text-gray-400 text-sm">
                  {smartSearchMutation.data.total} resultaten gevonden
                </p>

                {smartSearchMutation.data.bikes.length > 0 ? (
                  <div className="space-y-2">
                    {smartSearchMutation.data.bikes.map((bike) => (
                      <BikeResultCard key={bike.id} bike={bike} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800 rounded-lg p-6 text-center">
                    <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Geen fietsen gevonden</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Recognition Modal */}
      <Dialog open={activeModal === "photo"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-green-400" />
              Foto Herkenning
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload een foto om het merk en model te herkennen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoMutation.isPending}
              variant="outline"
              className="w-full border-slate-700 text-slate-100"
            >
              <Upload className="w-4 h-4 mr-2" />
              Kies een foto
            </Button>

            {selectedImage ? (
              <div className="rounded-xl overflow-hidden">
                <img src={selectedImage} alt="Selected" className="w-full h-48 object-cover" />
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl h-40 border border-dashed border-slate-700 flex flex-col items-center justify-center">
                <Camera className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-gray-500 text-sm">Nog geen foto geselecteerd</p>
              </div>
            )}

            {photoMutation.isPending ? (
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-100 text-sm font-semibold">Foto wordt geanalyseerd...</p>
              </div>
            ) : null}

            {photoMutation.isError ? (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-semibold">Herkenning mislukt</p>
              </div>
            ) : null}

            {photoMutation.data ? (
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h4 className="text-slate-100 font-bold mb-3">Herkenningsresultaten</h4>
                <DetailRow label="Merk" value={photoMutation.data.brand} />
                <DetailRow label="Model" value={photoMutation.data.model} />
                <DetailRow label="Kleur" value={photoMutation.data.color} />
                <DetailRow label="Jaar" value={photoMutation.data.year} />
                <DetailRow label="Maat" value={photoMutation.data.size} />
                <DetailRow label="Type" value={photoMutation.data.type} />
                <ConfidenceBar confidence={photoMutation.data.confidence} />
                {photoMutation.data.notes ? (
                  <p className="text-gray-400 text-sm mt-4">{photoMutation.data.notes}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Parser Modal */}
      <Dialog open={activeModal === "invoice"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              Factuur Scanner
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Plak de tekst van een factuur om artikelen te herkennen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={invoiceText}
              onChange={(e) => setInvoiceText(e.target.value)}
              placeholder="Plak hier de factuurtekst..."
              className="bg-slate-800 border-slate-700 text-slate-100 min-h-[120px]"
            />

            <Button
              onClick={handleParseInvoice}
              disabled={!invoiceText.trim() || invoiceMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {invoiceMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Analyseer Factuur
            </Button>

            {invoiceMutation.isError ? (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-semibold">Analyse mislukt</p>
              </div>
            ) : null}

            {invoiceMutation.data ? (
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h4 className="text-slate-100 font-bold mb-3">Factuurgegevens</h4>
                  <DetailRow label="Leverancier" value={invoiceMutation.data.supplier} />
                  <DetailRow label="Factuurnummer" value={invoiceMutation.data.invoiceNumber} />
                  <DetailRow label="Factuurdatum" value={invoiceMutation.data.invoiceDate} />
                  <DetailRow
                    label="Totaalbedrag"
                    value={
                      invoiceMutation.data.totalAmount != null
                        ? formatCurrency(invoiceMutation.data.totalAmount)
                        : undefined
                    }
                  />
                </div>

                {invoiceMutation.data.items.length > 0 ? (
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">
                      {invoiceMutation.data.items.length} artikelen
                    </p>
                    <div className="space-y-2">
                      {invoiceMutation.data.items.map((item, idx) => (
                        <div key={idx} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                          <div className="flex justify-between">
                            <p className="text-slate-100 text-sm font-semibold">{item.description}</p>
                            <p className="text-green-400 text-sm font-bold">
                              {formatCurrency(item.totalPrice)}
                            </p>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            Aantal: {item.quantity} | Stukprijs: {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signals Modal */}
      <Dialog open={activeModal === "signals"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              AI Signalen
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Waarschuwingen en inzichten over je voorraad
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400 text-sm">
                {signals?.length ?? 0} signalen gevonden
              </p>
              <Button
                onClick={() => refetchSignals()}
                variant="ghost"
                size="sm"
                disabled={signalsRefetching}
                className="text-blue-400"
              >
                <RefreshCw className={cn("w-4 h-4 mr-1", signalsRefetching && "animate-spin")} />
                Vernieuwen
              </Button>
            </div>

            {signalsLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Signalen laden...</p>
              </div>
            ) : signals && signals.length > 0 ? (
              <div className="space-y-2">
                {signals
                  .sort((a, b) => (a.severity === "critical" ? -1 : 1))
                  .map((signal, idx) => (
                    <SignalCard key={idx} signal={signal} />
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-slate-100 text-lg font-bold mb-1">Alles in orde</h3>
                <p className="text-gray-500 text-sm">
                  Er zijn op dit moment geen signalen of waarschuwingen.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
