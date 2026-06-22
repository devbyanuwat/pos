"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coffee,
  ImagePlus,
  Info,
  SlidersHorizontal,
  FlaskConical,
  Store,
  Plus,
  X,
} from "lucide-react";
import {
  Dialog,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Switch,
  Badge,
  Tabs,
} from "@/components/ui";
import type { Category, Ingredient, MenuOption, Product, SalesChannel } from "@/lib/types";
import type { NewProduct } from "@/lib/store";
import { commissionFor } from "@/lib/selectors";
import { cn, formatTHB } from "@/lib/utils";
import { OptionsEditor, type DraftOption } from "./options-editor";
import {
  RecipeEditor,
  newDraftRecipeLine,
  type DraftRecipeLine,
} from "./recipe-editor";

export interface MenuFormSubmit extends NewProduct {}

interface FormState {
  name: string;
  sku: string;
  categoryId: string;
  cost: string;
  basePrice: string;
  stock: string;
  lowStockThreshold: string;
  description: string;
  image: string;
  active: boolean;
  /** Per-channel price overrides as raw input strings. channelId -> price. */
  channelPrices: Record<string, string>;
}

const emptyForm = (categoryId: string): FormState => ({
  name: "",
  sku: "",
  categoryId,
  cost: "",
  basePrice: "",
  stock: "999",
  lowStockThreshold: "0",
  description: "",
  image: "",
  active: true,
  channelPrices: {},
});

function channelPricesToForm(prices?: Record<string, number>): Record<string, string> {
  if (!prices) return {};
  return Object.fromEntries(Object.entries(prices).map(([id, v]) => [id, String(v)]));
}

function toForm(p: Product): FormState {
  return {
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId,
    cost: String(p.cost),
    basePrice: String(p.basePrice),
    stock: String(p.stock),
    lowStockThreshold: String(p.lowStockThreshold),
    description: p.description ?? "",
    image: p.image ?? "",
    active: p.active,
    channelPrices: channelPricesToForm(p.channelPrices),
  };
}

/** Convert raw channel-price inputs into the persisted Record (drops blanks / <= 0). */
function draftToChannelPrices(
  draft: Record<string, string>,
): Record<string, number> | undefined {
  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(draft)) {
    const n = Math.round(Number(raw));
    if (raw.trim() !== "" && Number.isFinite(n) && n > 0) out[id] = n;
  }
  return Object.keys(out).length ? out : undefined;
}

function optionsToDraft(options?: MenuOption[]): DraftOption[] {
  if (!options) return [];
  return options.map((o) => ({
    id: o.id,
    name: o.name,
    choices: o.choices.map((c) => ({
      id: c.id,
      label: c.label,
      priceDelta: String(c.priceDelta),
    })),
  }));
}

function recipeToDraft(p?: Product): DraftRecipeLine[] {
  if (!p?.recipe) return [];
  return p.recipe.map((r) => newDraftRecipeLineFrom(r.ingredientId, r.qty));
}

function newDraftRecipeLineFrom(ingredientId: string, qty: number): DraftRecipeLine {
  const line = newDraftRecipeLine(ingredientId);
  return { ...line, qty: String(qty) };
}

/** Convert draft option groups into the persisted MenuOption[] (drops empties). */
function draftToOptions(draft: DraftOption[]): MenuOption[] | undefined {
  const cleaned: MenuOption[] = draft
    .map((o) => {
      const choices = o.choices
        .filter((c) => c.label.trim())
        .map((c) => ({
          id: c.id,
          label: c.label.trim(),
          priceDelta: Math.round(Number(c.priceDelta) || 0),
        }));
      return { id: o.id, name: o.name.trim(), choices };
    })
    .filter((o) => o.name && o.choices.length > 0);
  return cleaned.length ? cleaned : undefined;
}

/** Convert draft recipe lines into RecipeLine[] (drops empty / zero-qty lines). */
function draftToRecipe(draft: DraftRecipeLine[]) {
  const cleaned = draft
    .filter((l) => l.ingredientId && (Number(l.qty) || 0) > 0)
    .map((l) => ({ ingredientId: l.ingredientId, qty: Number(l.qty) }));
  return cleaned.length ? cleaned : undefined;
}

const TABS = [
  { value: "info", label: "ข้อมูลเมนู" },
  { value: "options", label: "ตัวเลือก" },
  { value: "recipe", label: "สูตร" },
];

export function MenuFormDialog({
  open,
  onClose,
  onSubmit,
  product,
  categories,
  ingredients,
  salesChannels,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MenuFormSubmit) => void;
  /** When set, the dialog edits; otherwise it creates. */
  product?: Product | null;
  categories: Category[];
  ingredients: Ingredient[];
  salesChannels: SalesChannel[];
}) {
  const isEdit = !!product;
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState<FormState>(emptyForm(categories[0]?.id ?? ""));
  const [options, setOptions] = useState<DraftOption[]>([]);
  const [recipe, setRecipe] = useState<DraftRecipeLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-seed the whole form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setTab("info");
    setForm(product ? toForm(product) : emptyForm(categories[0]?.id ?? ""));
    setOptions(optionsToDraft(product?.options));
    setRecipe(recipeToDraft(product ?? undefined));
  }, [open, product, categories]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const cost = Number(form.cost) || 0;
  const basePrice = Number(form.basePrice) || 0;
  const margin = basePrice > 0 ? Math.round(((basePrice - cost) / basePrice) * 100) : 0;

  const optionCount = useMemo(
    () => options.filter((o) => o.name.trim() && o.choices.some((c) => c.label.trim())).length,
    [options],
  );
  const recipeCount = useMemo(
    () => recipe.filter((l) => l.ingredientId && (Number(l.qty) || 0) > 0).length,
    [recipe],
  );
  const channelPriceCount = useMemo(
    () => Object.values(form.channelPrices).filter((v) => v.trim() !== "").length,
    [form.channelPrices],
  );

  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!form.name.trim()) {
      setTab("info");
      return setError("กรุณากรอกชื่อเมนู");
    }
    if (!form.sku.trim()) {
      setTab("info");
      return setError("กรุณากรอกรหัสเมนู (SKU)");
    }
    if (!form.categoryId) {
      setTab("info");
      return setError("กรุณาเลือกหมวดหมู่");
    }
    if (basePrice <= 0) {
      setTab("info");
      return setError("ราคาขายต้องมากกว่า 0");
    }

    onSubmit({
      name: form.name.trim(),
      sku: form.sku.trim(),
      categoryId: form.categoryId,
      image: form.image,
      cost: Math.max(0, Math.round(cost)),
      basePrice: Math.max(0, Math.round(basePrice)),
      stock: Math.max(0, Math.round(Number(form.stock) || 0)),
      lowStockThreshold: Math.max(0, Math.round(Number(form.lowStockThreshold) || 0)),
      description: form.description.trim() || undefined,
      active: form.active,
      options: draftToOptions(options),
      recipe: draftToRecipe(recipe),
      channelPrices: draftToChannelPrices(form.channelPrices),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-2xl"
      title={isEdit ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
      description={
        isEdit ? "ปรับรายละเอียดเมนู ตัวเลือก และสูตร" : "กรอกรายละเอียดเมนูเครื่องดื่ม / ของหวาน"
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>{isEdit ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Tabs
          tabs={[
            { value: "info", label: tabLabel(Info, "ข้อมูลเมนู") },
            { value: "options", label: tabLabel(SlidersHorizontal, `ตัวเลือก${optionCount ? ` (${optionCount})` : ""}`) },
            { value: "recipe", label: tabLabel(FlaskConical, `สูตร${recipeCount ? ` (${recipeCount})` : ""}`) },
            { value: "channels", label: tabLabel(Store, `ราคาช่องทาง${channelPriceCount ? ` (${channelPriceCount})` : ""}`) },
          ]}
          value={tab}
          onChange={setTab}
          className="w-full justify-start overflow-x-auto"
        />

        {tab === "info" && (
          <div className="grid gap-4">
            <div className="flex gap-4">
              {/* Image picker + preview */}
              <div className="shrink-0">
                <Label>รูปเมนู</Label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300/70 bg-white/50 text-slate-400 transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:bg-white/5",
                  )}
                >
                  {form.image ? (
                    // Data URL or remote URL preview; plain img keeps it simple in-dialog.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image} alt="ตัวอย่างรูปเมนู" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-7 w-7" />
                  )}
                </button>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => set("image", "")}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                  >
                    <X className="h-3 w-3" /> ลบรูป
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="flex flex-1 flex-col justify-center gap-3">
                <div>
                  <Label htmlFor="mf-name">ชื่อเมนู</Label>
                  <Input
                    id="mf-name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="เช่น ลาเต้เย็น"
                  />
                </div>
                <div>
                  <Label htmlFor="mf-sku">รหัสเมนู (SKU)</Label>
                  <Input
                    id="mf-sku"
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value)}
                    placeholder="เช่น ICE-LAT"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="mf-cat">หมวดหมู่</Label>
              <Select
                id="mf-cat"
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                {categories.length === 0 && <option value="">ยังไม่มีหมวดหมู่</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mf-cost">ต้นทุน (บาท)</Label>
                <Input
                  id="mf-cost"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.cost}
                  onChange={(e) => set("cost", e.target.value)}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="mf-price">ราคาขาย (บาท)</Label>
                <Input
                  id="mf-price"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.basePrice}
                  onChange={(e) => set("basePrice", e.target.value)}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>

            {basePrice > 0 && (
              <p className="-mt-1 text-xs text-slate-500 dark:text-slate-400">
                กำไรต่อแก้ว{" "}
                <span className="font-mono font-medium text-emerald-500">
                  {formatTHB(basePrice - cost)}
                </span>{" "}
                <Badge tone={margin >= 50 ? "success" : margin >= 25 ? "warning" : "danger"}>
                  {margin}%
                </Badge>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mf-stock">สต๊อกคงเหลือ</Label>
                <Input
                  id="mf-stock"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="mf-low">จุดแจ้งเตือนสต๊อก</Label>
                <Input
                  id="mf-low"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", e.target.value)}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mf-desc">รายละเอียด</Label>
              <Textarea
                id="mf-desc"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="คำอธิบายเมนู (ไม่บังคับ)"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/60 px-3.5 py-2.5 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <Coffee className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">เปิดขายเมนูนี้</span>
              </div>
              <Switch checked={form.active} onChange={(v) => set("active", v)} />
            </div>
          </div>
        )}

        {tab === "options" && (
          <div className="grid gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              สร้างกลุ่มตัวเลือกให้ลูกค้าเลือกตอนสั่ง เช่น ขนาด (S/M/L) ความหวาน หรืออุณหภูมิ
              ตั้งราคาบวกเพิ่มได้ต่อตัวเลือก
            </p>
            <OptionsEditor value={options} onChange={setOptions} />
          </div>
        )}

        {tab === "recipe" && (
          <div className="grid gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ระบุวัตถุดิบที่ใช้ต่อ 1 แก้ว เพื่อเชื่อมกับสต๊อกวัตถุดิบและคำนวณต้นทุน
            </p>
            <RecipeEditor value={recipe} ingredients={ingredients} onChange={setRecipe} />
          </div>
        )}

        {tab === "channels" && (
          <div className="grid gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              เพิ่มช่องทางที่ขายเมนูนี้ แล้วตั้งราคาขายของช่องทางนั้น ถ้าไม่ตั้งจะใช้ราคาขายหน้าร้าน
            </p>
            <ChannelPriceEditor
              channels={salesChannels}
              value={form.channelPrices}
              basePrice={basePrice}
              onChange={(next) => set("channelPrices", next)}
            />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </Dialog>
  );
}

function tabLabel(Icon: typeof Info, text: string) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4" />
      {text}
    </span>
  );
}

/** Add per-channel selling prices for one product: pick a platform, set its price. */
function ChannelPriceEditor({
  channels,
  value,
  basePrice,
  onChange,
}: {
  channels: SalesChannel[];
  value: Record<string, string>;
  basePrice: number;
  onChange: (next: Record<string, string>) => void;
}) {
  const rows = Object.keys(value);
  const available = channels.filter((c) => c.active && !(c.id in value));

  const addChannel = (id: string) => {
    if (!id || id in value) return;
    onChange({ ...value, [id]: basePrice > 0 ? String(basePrice) : "" });
  };
  const setPrice = (id: string, price: string) => onChange({ ...value, [id]: price });
  const removeChannel = (id: string) => {
    const next = { ...value };
    delete next[id];
    onChange(next);
  };

  if (channels.length === 0) {
    return (
      <div className="rounded-xl bg-slate-500/5 px-3.5 py-3 text-sm text-slate-500 dark:text-slate-400">
        ยังไม่มีแพลตฟอร์มเดลิเวอรี เพิ่มได้ที่หน้า ช่องทาง &amp; ราคา
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {rows.length === 0 && (
        <p className="rounded-xl bg-slate-500/5 px-3.5 py-3 text-sm text-slate-400">
          ยังไม่ได้ตั้งราคาช่องทางใด — ทุกช่องทางจะใช้ราคาขายหน้าร้าน
        </p>
      )}

      {rows.map((id) => {
        const ch = channels.find((c) => c.id === id);
        const price = Number(value[id]) || 0;
        const net = ch ? price - commissionFor(price, ch) : price;
        return (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl border border-slate-200/60 px-3 py-2.5 dark:border-white/10"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{ch?.name ?? id}</Badge>
                {ch && <span className="text-xs text-slate-400">GP {ch.commission}%</span>}
              </div>
              {price > 0 && ch && (
                <p className="mt-1 text-xs text-slate-400">สุทธิเข้าร้าน {formatTHB(net)}</p>
              )}
            </div>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={value[id]}
              onChange={(e) => setPrice(id, e.target.value)}
              placeholder={String(basePrice || 0)}
              className="w-28 text-right font-mono"
            />
            <button
              type="button"
              onClick={() => removeChannel(id)}
              aria-label={`ลบ ${ch?.name ?? id}`}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      {available.length > 0 ? (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 shrink-0 text-slate-400" />
          <Select value="" onChange={(e) => addChannel(e.target.value)} className="flex-1">
            <option value="">เพิ่มช่องทางการขาย...</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (GP {c.commission}%)
              </option>
            ))}
          </Select>
        </div>
      ) : (
        rows.length > 0 && (
          <p className="text-xs text-slate-400">เพิ่มครบทุกช่องทางที่เปิดใช้แล้ว</p>
        )
      )}
    </div>
  );
}
