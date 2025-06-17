import Link from 'next/link'

export default function NotFound() {
  // __RENDER
  return (
    <div className='container min-h-svh'>
      <div className='grid justify-center gap-1 pt-64 text-center'>
        <h1 className='mb-4 text-9xl font-extrabold'>404</h1>
        <h3 className='text-4xl font-bold text-white/50 capitalize'>oops, this page not found!</h3>
        <p className='text-2xl font-extralight text-white/30'>The link might be corrupted</p>
        <p className='text-white/75'>or The page may have been removed.</p>

        <Link className='btn mx-auto mt-8 h-7 w-36 rounded bg-white text-black hover:underline' href='/'>
          <span className='font-semibold uppercase'>go back home</span>
        </Link>
      </div>
    </div>
  )
}
