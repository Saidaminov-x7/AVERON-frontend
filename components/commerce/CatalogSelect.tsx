'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useAuthStore } from '@/store/useAuthStore';

export function CatalogSelect({
  name,
  label,
  value,
  placeholder,
  options,
}: {
  name: string;
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  const [selected, setSelected] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (value !== previousValue) {
    setPreviousValue(value);
    setSelected(value);
  }

  const updateValue = (nextValue: string) => {
    setSelected(nextValue);
    if (name === 'country' && !isAuthenticated) {
      try {
        if (nextValue) localStorage.setItem('averon_catalog_country', nextValue);
        else localStorage.removeItem('averon_catalog_country');
      } catch {
        // The URL remains the source of truth if browser storage is unavailable.
      }
    }
  };

  return (
    <div className="min-w-0">
      <span className="text-xs font-bold uppercase text-stone-500">{label}</span>
      {selected || name === 'country' ? <input type="hidden" name={name} value={selected} /> : null}
      <Select value={selected} onValueChange={updateValue}>
        <SelectTrigger aria-label={label} className="mt-2 normal-case">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value || '_all'} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
