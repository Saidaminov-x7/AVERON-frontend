import { SearchX } from 'lucide-react';
import { StatusPage } from '@/components/feedback/StatusPage';

export default function RootNotFound() {
  return (
    <StatusPage
      code="404"
      eyebrow="Страница не найдена"
      title="Такой страницы нет"
      description="Ссылка могла устареть или адрес был введён с ошибкой. Вернитесь на главную и продолжите покупки."
      icon={SearchX}
      homeLabel="На главную"
    />
  );
}
