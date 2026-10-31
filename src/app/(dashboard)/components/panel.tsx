/**
 * One of the page's sections.
 *
 * @param aside - Sits at the far end of the heading
 */
export function Panel({
  title,
  icon,
  aside,
  children
}: Readonly<{
  title: string
  icon: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}>) {
  return (
    <section className='flex min-w-0 flex-col gap-4 sm:px-8'>
      <header className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2 select-none'>
          {icon}
          <h2 className='text-sm font-semibold uppercase'>{title}</h2>
        </div>
        {aside}
      </header>

      {children}
    </section>
  )
}
