import { MainLayout } from '@/components/layout';
import { CreatePostModal, SearchModal } from '@/components/common/modals';
import { Header } from '@/components/layout/Header';

export default function MainGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <main className="w-full">{children}</main>
      </div>
      <CreatePostModal />
      <SearchModal />
    </div>
  );
}
