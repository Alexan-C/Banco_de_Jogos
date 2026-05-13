import axios from "axios";
import api from "./api";
import {QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient()


interface VinculoPayLoad{
    jogo_id: number;
    plataforma: string;
    subcategoria: string | null
}
export async function vincularJogo({
    jogo_id,
    plataforma,
    subcategoria,
}: VinculoPayLoad){
    const subClean = subcategoria === "None" || !subcategoria 
    ? null
    : subcategoria;

    const {data} = await api.post("/pedidos/vincular", {
        jogo_id,
        plataforma,
        subcategoria: subClean,
    });
    queryClient.setQueryData<VinculoPayLoad[]>(["biblioteca"], (antigos = []) => {
    return [data, ...antigos];
  })
    return data
} 
export async function desvincularJogo(
  jogoId: number,
  plataforma: string,
  subcategoria?: string | null,
) {
  const subClean =
    subcategoria === "None" || !subcategoria
      ? null
      : subcategoria;

  const { data } = await api.delete(
    `/pedidos/desvincular/${jogoId}`,
    {
      params: {
        plataforma,
        ...(subClean !== null && {
          subcategoria: subClean
        }),
      },
    },
  );
  queryClient.setQueryData<VinculoPayLoad[]>(["biblioteca"], (antigos = []) => {
    return antigos.filter((jogo) => jogo.jogo_id !== jogoId);
  });

  return data;
}

export function tratarErroApi(err: unknown) {
  let mensagem = "Erro na comunicação com o servidor";

  if (axios.isAxiosError(err)) {
    mensagem = err.response?.data?.detail || mensagem;
  }

  console.error("[API ERROR]:", err);

  return mensagem;
}
    