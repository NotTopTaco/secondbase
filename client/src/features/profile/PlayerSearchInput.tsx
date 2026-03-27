import { useState, useRef, useEffect } from 'react';
import { searchPlayers, type PlayerSearchResult } from '../../api/authApi';
import { PlayerPhoto } from '../../components/ui/PlayerPhoto';
import styles from './PlayerSearchInput.module.css';

interface PlayerSearchInputProps {
  onSelect: (player: PlayerSearchResult) => void;
  excludeIds?: Set<number>;
}

export function PlayerSearchInput({ onSelect, excludeIds }: PlayerSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchPlayers(value.trim());
        const filtered = excludeIds
          ? data.results.filter((p) => !excludeIds.has(p.player_id))
          : data.results;
        setResults(filtered);
        setIsOpen(filtered.length > 0);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const handleSelect = (player: PlayerSearchResult) => {
    onSelect(player);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        className={styles.input}
        type="text"
        placeholder="Search players by name..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
      />
      {isOpen && (
        <div className={styles.dropdown}>
          {results.map((player) => (
            <button
              key={player.player_id}
              className={styles.result}
              onClick={() => handleSelect(player)}
              type="button"
            >
              <PlayerPhoto playerId={player.player_id} size={28} />
              <div className={styles.resultInfo}>
                <span className={styles.resultName}>{player.full_name}</span>
                <span className={styles.resultMeta}>
                  {[player.position, player.team].filter(Boolean).join(' - ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
