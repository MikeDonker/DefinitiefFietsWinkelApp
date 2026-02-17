import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBrands, useModels, useCreateBike } from "@/hooks/use-bikes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateBikeData } from "@/lib/types";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL"];

interface FormData {
  frameNumber: string;
  brandId: string;
  modelId: string;
  year: string;
  color: string;
  size: string;
  purchasePrice: string;
  sellingPrice: string;
  notes: string;
}

const initialFormData: FormData = {
  frameNumber: "",
  brandId: "",
  modelId: "",
  year: "",
  color: "",
  size: "",
  purchasePrice: "",
  sellingPrice: "",
  notes: "",
};

export default function AddBikePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useModels(formData.brandId || undefined);
  const createBikeMutation = useCreateBike();

  const handleBrandChange = (brandId: string) => {
    setFormData((prev) => ({ ...prev, brandId, modelId: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.frameNumber.trim()) {
      setError("Framenummer is verplicht");
      return;
    }
    if (!formData.brandId) {
      setError("Selecteer een merk");
      return;
    }
    if (!formData.modelId) {
      setError("Selecteer een model");
      return;
    }

    const data: CreateBikeData = {
      frameNumber: formData.frameNumber.trim(),
      brandId: formData.brandId,
      modelId: formData.modelId,
    };

    if (formData.year) {
      const year = parseInt(formData.year, 10);
      if (!isNaN(year)) data.year = year;
    }
    if (formData.color.trim()) data.color = formData.color.trim();
    if (formData.size) data.size = formData.size;
    if (formData.purchasePrice) {
      const price = parseFloat(formData.purchasePrice);
      if (!isNaN(price)) data.purchasePrice = price;
    }
    if (formData.sellingPrice) {
      const price = parseFloat(formData.sellingPrice);
      if (!isNaN(price)) data.sellingPrice = price;
    }
    if (formData.notes.trim()) data.notes = formData.notes.trim();

    createBikeMutation.mutate(data, {
      onSuccess: () => {
        navigate("/bikes");
      },
      onError: (err: Error) => {
        setError(err.message || "Er is een fout opgetreden");
      },
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          onClick={() => navigate("/bikes")}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-slate-100 text-xl lg:text-2xl font-extrabold">
            Nieuwe Fiets
          </h1>
          <p className="text-gray-500 text-sm">Voeg een nieuwe fiets toe aan de voorraad</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error ? (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : null}

        {/* Frame Number */}
        <div className="space-y-2">
          <Label htmlFor="frameNumber" className="text-slate-200">
            Framenummer <span className="text-red-400">*</span>
          </Label>
          <Input
            id="frameNumber"
            value={formData.frameNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, frameNumber: e.target.value }))}
            placeholder="Bijv. WTU123456789"
            className="bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-slate-200">
            Merk <span className="text-red-400">*</span>
          </Label>
          <Select value={formData.brandId} onValueChange={handleBrandChange}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectValue placeholder="Selecteer merk" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id} className="text-slate-100">
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label htmlFor="model" className="text-slate-200">
            Model <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.modelId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, modelId: value }))}
            disabled={!formData.brandId}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectValue placeholder={formData.brandId ? "Selecteer model" : "Selecteer eerst een merk"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-slate-100">
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year" className="text-slate-200">Jaar</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
            placeholder="Bijv. 2023"
            className="bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="color" className="text-slate-200">Kleur</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
            placeholder="Bijv. Zwart, Rood"
            className="bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label htmlFor="size" className="text-slate-200">Maat</Label>
          <Select
            value={formData.size}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, size: value }))}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectValue placeholder="Selecteer maat" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size} className="text-slate-100">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Purchase Price */}
        <div className="space-y-2">
          <Label htmlFor="purchasePrice" className="text-slate-200">Inkoopprijs</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: e.target.value }))}
            placeholder="0.00"
            className="bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        {/* Selling Price */}
        <div className="space-y-2">
          <Label htmlFor="sellingPrice" className="text-slate-200">Verkoopprijs</Label>
          <Input
            id="sellingPrice"
            type="number"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) => setFormData((prev) => ({ ...prev, sellingPrice: e.target.value }))}
            placeholder="0.00"
            className="bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-slate-200">Notities</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Eventuele opmerkingen..."
            className="bg-slate-800 border-slate-700 text-slate-100 min-h-[80px]"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={createBikeMutation.isPending}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg font-bold"
        >
          {createBikeMutation.isPending ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : null}
          {createBikeMutation.isPending ? "Toevoegen..." : "Fiets Toevoegen"}
        </Button>
      </form>
    </div>
  );
}
