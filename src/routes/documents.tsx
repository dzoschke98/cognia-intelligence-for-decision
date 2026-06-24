import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompanies, getCompany, processDocumentMock, currentUser } from "@/lib/cognia/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileText } from "lucide-react";
import { fmtDateTime } from "@/lib/cognia/format";
import type { DocumentStatus, DocumentType } from "@/lib/cognia/types";
import { toast } from "sonner";

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

function DocsPage() {
  const docs = useStore((s) => s.documents);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("juridico");
  const [companyId, setCompanyId] = useState("co-1");
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  async function handleProcess() {
    if (!name) { toast.error("Informe o nome do documento"); return; }
    setProcessing(true);
    try {
      const result = await processDocumentMock({
        name, type, companyId, uploadedBy: currentUser()?.name ?? "Demo",
      });
      toast.success("Documento processado", { description: "Análise gerada com sucesso." });
      setOpen(false);
      setName("");
      navigate({ to: result.engine === "legal" ? "/legal/$id" : "/tax/$id", params: { id: result.analysisId } });
    } finally {
      setProcessing(false);
    }
  }

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
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
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
          <tbody className="divide-y divide-white/5">
            {docs.map((d) => (
              <tr key={d.id} className="transition hover:bg-white/5">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Enviar documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-muted-foreground">
              <Upload className="mx-auto mb-2 h-6 w-6 text-cyan" />
              Arraste o arquivo aqui ou informe o nome abaixo
            </div>
            <div className="space-y-2">
              <Label>Nome do arquivo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Processo_0001234.pdf" />
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={processing}>Cancelar</Button>
            <Button onClick={handleProcess} disabled={processing} className="bg-gradient-to-r from-primary to-purple text-white">
              {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando…</> : "Processar documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
