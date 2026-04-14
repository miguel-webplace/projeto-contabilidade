"use client";

import React, { useState, useEffect } from "react";

type Conta = {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId: number | null;
};

type MovimentacaoForm = {
  id: string; // temp id for UI
  natureza: "Debito" | "Credito";
  contaPaiId: number | "";
  contaId: number | "";
  valor: string;
};

export default function LancamentoForm() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [dataOcorrencia, setDataOcorrencia] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [descricaoHistorico, setDescricaoHistorico] = useState("");
  const [documentoReferencia, setDocumentoReferencia] = useState("");

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoForm[]>([
    { id: "1", natureza: "Debito", contaPaiId: "", contaId: "", valor: "" },
    { id: "2", natureza: "Credito", contaPaiId: "", contaId: "", valor: "" },
  ]);

  useEffect(() => {
    fetch("/api/contas")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setContas(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const contasPai = contas.filter((c) => c.contaPaiId === null);

  const getContasFilhas = (paiId: number | "") => {
    if (paiId === "") return [];
    return contas.filter((c) => c.contaPaiId === Number(paiId));
  };

  const handleMovimentacaoChange = (id: string, field: keyof MovimentacaoForm, value: string) => {
    setMovimentacoes(prev => prev.map(m => {
      if (m.id === id) {
        if (field === 'contaPaiId') {
          return { ...m, contaPaiId: value === '' ? '' : Number(value), contaId: '' };
        }
        if (field === 'contaId') {
          return { ...m, contaId: value === '' ? '' : Number(value) };
        }
        if (field === 'natureza') {
          return { ...m, natureza: value as 'Debito' | 'Credito' };
        }
        if (field === 'valor') {
          return { ...m, valor: value };
        }
      }
      return m;
    }));
  };

  const addMovimentacao = () => {
    setMovimentacoes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        natureza: "Debito",
        contaPaiId: "",
        contaId: "",
        valor: "",
      },
    ]);
  };

  const removeMovimentacao = (id: string) => {
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id));
  };

  const totalDebitos = movimentacoes
    .filter((m) => m.natureza === "Debito")
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  const totalCreditos = movimentacoes
    .filter((m) => m.natureza === "Credito")
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

  const isBalanced = Math.abs(totalDebitos - totalCreditos) < 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isBalanced) {
      setError("Débitos e Créditos não estão balanceados!");
      return;
    }

    if (movimentacoes.some((m) => m.contaId === "" || !m.valor)) {
      setError("Preencha todas as contas e valores.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        dataOcorrencia,
        descricaoHistorico,
        documentoReferencia,
        movimentacoes: movimentacoes.map((m) => ({
          contaId: Number(m.contaId),
          natureza: m.natureza,
          valor: m.valor.toString(),
        })),
      };

      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Reset form
        setDescricaoHistorico("");
        setDocumentoReferencia("");
        setMovimentacoes([
          {
            id: Date.now().toString() + "1",
            natureza: "Debito",
            contaPaiId: "",
            contaId: "",
            valor: "",
          },
          {
            id: Date.now().toString() + "2",
            natureza: "Credito",
            contaPaiId: "",
            contaId: "",
            valor: "",
          },
        ]);
      } else {
        setError(data.error || "Erro ao salvar lançamento.");
      }
    } catch (err) {
      setError("Erro de rede ao salvar lançamento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="glass-panel" style={{ padding: "2rem" }}>
        Carregando contas...
      </div>
    );

  return (
    <div
      className="glass-panel"
      style={{ padding: "2rem", animation: "slideUp 0.5s ease" }}
    >
      <h2
        style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 600 }}
      >
        Novo Lançamento Contábil
      </h2>

      {error && (
        <div
          className="glass-panel"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#fca5a5",
            padding: "1rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="glass-panel"
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "#86efac",
            padding: "1rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          Lançamento salvo com sucesso!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Data da Ocorrência
            </label>
            <input
              type="date"
              className="input-premium"
              value={dataOcorrencia}
              onChange={(e) => setDataOcorrencia(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Doc. Referência (Opcional)
            </label>
            <input
              type="text"
              className="input-premium"
              placeholder="Ex: NF 12345"
              value={documentoReferencia}
              onChange={(e) => setDocumentoReferencia(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Histórico
          </label>
          <input
            type="text"
            className="input-premium"
            placeholder="Descrição do fato contábil..."
            value={descricaoHistorico}
            onChange={(e) => setDescricaoHistorico(e.target.value)}
            required
            minLength={5}
          />
        </div>

        <div
          style={{
            marginTop: "1rem",
            borderTop: "1px solid var(--glass-border)",
            paddingTop: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>
              Partidas (Débitos e Créditos)
            </h3>
            <button
              type="button"
              onClick={addMovimentacao}
              className="btn-secondary"
            >
              + Adicionar Linha
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {movimentacoes.map((mov, index) => (
              <div
                key={mov.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "min-content 1fr 1fr 1fr min-content",
                  gap: "0.75rem",
                  alignItems: "center",
                  background: "rgba(0,0,0,0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                <select
                  className="input-premium"
                  value={mov.natureza}
                  onChange={(e) =>
                    handleMovimentacaoChange(mov.id, "natureza", e.target.value)
                  }
                  style={{ padding: "0.75rem 0.5rem" }}
                >
                  <option value="Debito">D</option>
                  <option value="Credito">C</option>
                </select>

                <select
                  className="input-premium"
                  value={mov.contaPaiId}
                  onChange={(e) =>
                    handleMovimentacaoChange(
                      mov.id,
                      "contaPaiId",
                      e.target.value,
                    )
                  }
                  required
                >
                  <option value="">-- Grupo PAI --</option>
                  {contasPai.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.nome}
                    </option>
                  ))}
                </select>

                <select
                  className="input-premium"
                  value={mov.contaId}
                  onChange={(e) =>
                    handleMovimentacaoChange(mov.id, "contaId", e.target.value)
                  }
                  required
                  disabled={!mov.contaPaiId}
                >
                  <option value="">-- Conta Filha --</option>
                  {getContasFilhas(mov.contaPaiId).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.nome}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input-premium"
                  placeholder="0.00"
                  value={mov.valor}
                  onChange={(e) =>
                    handleMovimentacaoChange(mov.id, "valor", e.target.value)
                  }
                  required
                />

                {movimentacoes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeMovimentacao(mov.id)}
                    className="btn-danger"
                    style={{
                      padding: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1rem",
              gap: "2rem",
              color: "var(--text-secondary)",
            }}
          >
            <div>
              Total Débitos:{" "}
              <strong style={{ color: "#06b6d4", fontSize: "1.2rem" }}>
                R$ {totalDebitos.toFixed(2)}
              </strong>
            </div>
            <div>
              Total Créditos:{" "}
              <strong style={{ color: "#8b5cf6", fontSize: "1.2rem" }}>
                R$ {totalCreditos.toFixed(2)}
              </strong>
            </div>
          </div>

          {totalDebitos > 0 && totalCreditos > 0 && !isBalanced && (
            <div
              style={{
                textAlign: "right",
                color: "#ef4444",
                fontSize: "0.9rem",
                marginTop: "0.5rem",
              }}
            >
              Diferença: R$ {Math.abs(totalDebitos - totalCreditos).toFixed(2)}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: "1rem" }}
          disabled={submitting || !isBalanced}
        >
          {submitting ? "Salvando..." : "Salvar Lançamento (Fato)"}
        </button>
      </form>
    </div>
  );
}
