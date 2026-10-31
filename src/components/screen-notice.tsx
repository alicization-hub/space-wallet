/**
 * What shows in place of the page below the `lg` breakpoint, where the pages don't fit.
 *
 * The root layout only hides the page, as its sync is what keeps the navbar's data fresh.
 */
export function ScreenNotice() {
  return (
    <div className='container lg:hidden'>
      <div className='grid justify-center gap-1 pt-64 text-center'>
        <h1 className='mb-4 text-8xl font-extrabold sm:text-9xl'>1024</h1>
        <h3 className='text-4xl font-bold text-white/60 capitalize'>screen too small</h3>
        <p className='text-2xl font-extralight text-white/40'>
          This wallet needs a wider screen
        </p>
        <p className='text-white/75'>Open it in a window at least 1024px wide.</p>
      </div>
    </div>
  )
}
