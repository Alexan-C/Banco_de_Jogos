import { Search, X } from "lucide-react";
import "../components/SearchBar.css";
import { useState, useEffect } from "react";

interface Jogo {
  id: number;
  ano: number;
  nome: string;
  descricao: string;
  categoria: string;
  capa_url: string;
}

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  jogos: Jogo[];
  placeholder?: string;
  onResultClick?: (jogoId: number) => void;
  showResults?: boolean;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  jogos,
  placeholder = "Buscar jogos...",
  onResultClick,
  showResults = true,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const jogosFiltrados = searchQuery
    ? jogos.filter((jogo) =>
        jogo.nome.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  useEffect(() => {
    const handleClickOutside = () => {
      setIsFocused(false);
    };

    if (isFocused) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isFocused]);

  return (
    <div
      className="search-bar-container"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`search-input-wrapper-standalone ${isFocused ? "focused" : ""}`}>
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="search-input"
        />

        {searchQuery && (
          <button
            className="clear-search-btn"
            onClick={() => {
              onSearchChange("");
              setIsFocused(false);
            }}
            aria-label="Limpar busca"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showResults && searchQuery && isFocused && (
        <div className="search-results-dropdown-standalone">
          {jogosFiltrados.length > 0 ? (
            jogosFiltrados.map((jogo) => (
              <div
                key={jogo.id}
                className="search-result-item-standalone"
                onClick={() => {
                  if (onResultClick) {
                    onResultClick(jogo.id);
                  }
                  onSearchChange("");
                  setIsFocused(false);
                }}
              >
                <img
                  src={jogo.capa_url}
                  alt={jogo.nome}
                  className="result-img-standalone"
                />
                <div className="result-info-standalone">
                  <span className="result-name-standalone">{jogo.nome}</span>
                  <span className="result-category-standalone">
                    {jogo.categoria || "Digital Game"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results-standalone">Nenhum jogo encontrado</div>
          )}
        </div>
      )}
    </div>
  );
}
