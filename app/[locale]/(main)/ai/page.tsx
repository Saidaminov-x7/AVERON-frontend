import type { Metadata } from 'next';
import AIAssistant from '@/components/ai/AIAssistant';
export const metadata: Metadata = { title: 'AI-помощник' };
export default function Page(){ return <AIAssistant/>; }
