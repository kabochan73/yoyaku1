import Header from '@/components/layout/Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
    </>
  )
}
