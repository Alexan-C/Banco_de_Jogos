import axios from "axios";
import api from "./api";

interface PlataformaDetalhe {
    plataforma: "PC" | "PS5" | "XBOX";
    subcategoria: "Steam" | "Epic" | null;
}

interface JogoBiblioteca {
    id: number;
    nome: string;
    detalhes_plataformas: PlataformaDetalhe[];
}

export async function gerenciarVinculo(
    botao: HTMLButtonElement,
    jogoId: number,
    plataforma: string,
    subcategoria: string | null = null
): Promise<void> {

    const estaVinculado = botao.classList.contains('active');

    // 🔥 normalização correta
    const subClean = (subcategoria === "None" || !subcategoria) ? null : subcategoria;

    try {
        if (estaVinculado) {

            await api.delete(`/pedidos/desvincular/${jogoId}`, {
                params: {
                    plataforma,
                    ...(subClean !== null && { subcategoria: subClean })
                }
            });

        } else {

            await api.post('/pedidos/vincular', {
                jogo_id: jogoId,
                plataforma,
                subcategoria: subClean
            });
        }

    } catch (err: unknown) {
        let mensagemErro = "Erro na comunicação com o servidor";

        if (axios.isAxiosError(err)) {
            mensagemErro = err.response?.data?.detail || mensagemErro;
        }

        alert(`Falha: ${mensagemErro}`);
        console.error("[Vinculo Error]:", err);
    }
}


export async function sincronizarBotoesPopup(jogoIdNoPopup: number): Promise<void> {
    try {
        const { data: biblioteca } = await api.get<JogoBiblioteca[]>('/pedidos/minha_biblioteca');
        const botoes = document.querySelectorAll<HTMLButtonElement>('.btn-platform-choice');

        // limpa tudo
        botoes.forEach(btn => btn.classList.remove('active'));

        if (!Array.isArray(biblioteca)) return;

        const jogoCorrente = biblioteca.find(j => j.id === jogoIdNoPopup);

        if (!jogoCorrente?.detalhes_plataformas) return;


        botoes.forEach(btn => {

            const plat = btn.getAttribute('data-plataforma')?.toUpperCase();
            const sub = btn.getAttribute('data-sub')?.toUpperCase() || null;

            const match = jogoCorrente.detalhes_plataformas.some(v => {
                const vPlat = v.plataforma.toUpperCase();
                const vSub = v.subcategoria ? v.subcategoria.toUpperCase() : null;

                return plat === vPlat && sub === vSub;
            });

            if (match) {
                btn.classList.add('active');
            }
        });

    } catch (error) {
        console.error("[Sync Error]:", error);
    }
}