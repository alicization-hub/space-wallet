export async function TransactionComponent() {
  // __STATE's

  // __RENDER
  return (
    <section className='px-8' aria-label='Transactions'>
      <div className='grid gap-4'>
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
        <div className='bg-foreground/5 ring-foreground/10 h-12 animate-pulse rounded-xs ring-1' />
      </div>
    </section>
  )
}
