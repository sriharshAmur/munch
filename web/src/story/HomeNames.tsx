import { useState } from 'react';
import { useData, useHomeName } from '@/data/provider';
import { Input } from '@/components/ui/input';

/** Names for each home, kept in this browser only. */
export function HomeNames({ keys }: { keys: string[] }) {
  const { renameHome } = useData();
  const homeName = useHomeName();
  const [open, setOpen] = useState(false);
  if (!keys.length) return null;
  return (
    <div className="home-names">
      <button type="button" className="numbers-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Done naming' : 'Name your homes'}
      </button>
      {open && (
        <form
          className="home-names-form"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          {keys.map((key, i) => (
            <label key={key}>
              <span>Home {i + 1}</span>
              <Input
                defaultValue={homeName(key)}
                onBlur={(e) => {
                  const name = e.currentTarget.value.trim();
                  if (name && name !== homeName(key)) renameHome(key, name);
                }}
              />
            </label>
          ))}
          <p>Names stay in this browser. Your orders file keeps only the area.</p>
        </form>
      )}
    </div>
  );
}
