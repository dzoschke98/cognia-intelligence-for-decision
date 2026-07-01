import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompanies, getCompany, processDocumentMock, currentUser } from "@/lib/cognia/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, FileText } from "lucide-react";
import { fmtDateTime } from "@/lib/cognia/format";
import type { DocumentStatus, DocumentType } from "@/lib/cognia/types";
import { toast } from "sonner";
import { SummaryFooter } from "@/components/cognia/SummaryFooter";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documentos — CognIA" }] }),
  component: () => <AppShell><DocsPage /></AppShell>,
});

const statusBadge: Record<DocumentStatus, string> = {
  pendente: "bg-muted text-muted-foreground",
  processando: "bg-cyan/15 text-cyan border border-cyan/30",
  concluido: "bg-success/15 text-success border border-success/30",
  falhou: "bg-risk/15 text-risk border border-risk/30",
};

function detectType(name: string): DocumentType {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["pdf", "doc", "docx"].includes(ext)) return "juridico";
  if (["txt", "xml", "sped"].includes(ext)) return "tributario";
  return "juridico";
}

function DocsPage() {
  const docs = useStore((s) => s.documents);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-cyan">Documentos</div>
          <h1 className="text-3xl font-semibold tracking-tight">Repositório executivo</h1>
          <p className="text-sm text-muted-foreground">Upload mockado · processamento Engine First.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-primary to-purple text-white hover:opacity-90">
          <Upload className="mr-2 h-4 w-4" /> Enviar documento
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Documento</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Enviado por</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Engine</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {docs.map((d) => (
              <tr key={d.id} className="transition hover:bg-accent/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan" />
                    <span className="font-medium">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{d.type}</td>
                <td className="px-4 py-3">{getCompany(d.companyId)?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.uploadedBy}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(d.uploadedAt)}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${statusBadge[d.status]}`}>{d.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{d.engine ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {d.analysisId && d.engine ? (
                    <Button size="sm" variant="ghost" onClick={() => navigate({ to: d.engine === "legal" ? "/legal/$id" : "/tax/$id", params: { id: d.analysisId! } })}>
                      Ver análise
                    </Button>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SummaryFooter
        recordCount={docs.length}
        recordLabel="documentos"
        items={[
          { label: "Concluídos", value: String(docs.filter((d) => d.status === "concluido").length), color: "success" },
          { label: "Processando", value: String(docs.filter((d) => d.status === "processando").length), color: "cyan" },
          { label: "Com erro", value: String(docs.filter((d) => d.status === "falhou").length), color: "risk" },
        ]}
      />

      <UploadDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="bg-accent/40">
            <TabsTrigger value="single">Upload único</TabsTrigger>
            <TabsTrigger value="batch">Upload em lote</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="mt-4">
            <SingleUpload onDone={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="batch" className="mt-4">
            <BatchUpload onDone={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SingleUpload({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("juridico");
  const [companyId, setCompanyId] = useState("co-1");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!processing) return;
    setProgress(5);
    const iv = setInterval(() => {
      setProgress((p) => (p < 92 ? p + 6 : p));
    }, 100);
    return () => clearInterval(iv);
  }, [processing]);

  function handleFile(file: File) {
    setName(file.name);
    setType(detectType(file.name));
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function handleProcess() {
    if (!name) { toast.error("Informe o nome do documento"); return; }
    setProcessing(true);
    try {
      const result = await processDocumentMock({ name, type, companyId, uploadedBy: currentUser()?.name ?? "Demo" });
      setProgress(100);
      toast.success("Documento processado", { description: "Análise gerada com sucesso." });
      onDone();
      setName("");
      navigate({ to: result.engine === "legal" ? "/legal/$id" : "/tax/$id", params: { id: result.analysisId } });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center text-sm transition ${dragOver ? "border-cyan bg-cyan/10" : "border-border bg-accent/40"}`}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-cyan" />
        <div className="text-muted-foreground">Arraste PDF, DOCX, TXT ou XML aqui, ou clique para selecionar</div>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.xml,.sped"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      <div className="space-y-2">
        <Label>Nome do arquivo</Label>
        <Input value={name} onChange={(e) => { setName(e.target.value); if (e.target.value) setType(detectType(e.target.value)); }} placeholder="Ex: Processo_0001234.pdf" />
        {name && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-cyan">Detectado: {type}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="juridico">Jurídico</SelectItem>
              <SelectItem value="tributario">Tributário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {getCompanies().map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {processing && (
        <div className="space-y-1">
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground">Processando engine ({progress}%)…</div>
        </div>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onDone} disabled={processing}>Cancelar</Button>
        <Button onClick={handleProcess} disabled={processing} className="bg-gradient-to-r from-primary to-purple text-white">
          {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando…</> : "Processar documento"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function BatchUpload({ onDone }: { onDone: () => void }) {
  const [companyId, setCompanyId] = useState("co-1");
  const [type, setType] = useState<DocumentType>("juridico");
  const [qty, setQty] = useState(10);
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const cancelRef = useRef(false);

  async function start() {
    if (qty < 1 || qty > 1500) { toast.error("Quantidade entre 1 e 1500"); return; }
    setRunning(true);
    cancelRef.current = false;
    setProcessed(0);
    setLogLines([]);
    let legalC = 0, taxC = 0;
    for (let i = 1; i <= qty; i++) {
      if (cancelRef.current) break;
      const t: DocumentType = type;
      const name = `Processo_lote_${String(i).padStart(3, "0")}.${t === "juridico" ? "pdf" : "txt"}`;
      await processDocumentMock({ name, type: t, companyId, uploadedBy: currentUser()?.name ?? "Demo" });
      if (t === "juridico") legalC++; else taxC++;
      setProcessed(i);
      setLogLines((l) => [`✓ ${name}`, ...l].slice(0, 40));
      await new Promise((r) => setTimeout(r, 400));
    }
    setRunning(false);
    toast.success(`${processed || qty} documentos processados`, { description: `${legalC} jurídicos · ${taxC} tributários` });
    onDone();
  }
  function cancel() { cancelRef.current = true; }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-accent/40 p-3 text-xs text-muted-foreground">
        Simule o envio de múltiplos documentos como se fossem recebidos em lote. O processamento ocorre 1 a 1 com delay de 400ms para simular a fila do engine.
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{getCompanies().map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="juridico">Jurídico</SelectItem>
              <SelectItem value="tributario">Tributário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantidade (1-1500)</Label>
          <Input type="number" min={1} max={1500} value={qty} onChange={(e) => setQty(parseInt(e.target.value || "1"))} />
        </div>
      </div>
      {running && (
        <div className="space-y-2">
          <Progress value={(processed / qty) * 100} />
          <div className="text-xs text-muted-foreground">{processed} de {qty} documentos processados</div>
          <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background/50 p-2 font-mono text-[11px]">
            {logLines.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}
      <DialogFooter>
        {running ? (
          <Button variant="ghost" onClick={cancel}>Cancelar</Button>
        ) : (
          <Button onClick={start} className="bg-gradient-to-r from-primary to-purple text-white">
            Iniciar processamento em lote
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}
