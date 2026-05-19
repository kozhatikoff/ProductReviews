'use client';

import { useEffect, useState } from 'react';

export default function TypewriterText({ text, speedMs = 14, className }: { text: string; speedMs?: number; className?: string }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setValue(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speedMs);
    return () => clearInterval(t);
  }, [text, speedMs]);
  return <p className={className}>{value}</p>;
}
