'use client';
import dynamic from 'next/dynamic';

const SystemDesignExplorer = dynamic(
  () => import('@/components/visualizers/SystemDesignExplorer'),
  { ssr: false }
);

export default function SystemDesignPage() {
  return <SystemDesignExplorer />;
}
