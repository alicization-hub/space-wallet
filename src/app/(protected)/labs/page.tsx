import { PackageIcon } from '@/components/icons'
import { searchValidator } from '@/libs/validator.nuqs'

export default async function LabsPage({ searchParams }: NextSearchParams) {
  // Parse URL → typed values (nuqs)
  const qs = searchValidator.parse(await searchParams)

  return (
    <div className='mx-auto flex max-w-xl flex-col gap-8 py-24'>
      <div className='flex items-center gap-4'>
        <button className='' type='button'>
          <div className='relative flex items-center rounded-full bg-linear-to-t from-zinc-950 to-zinc-900 p-2 shadow-xl ring-2 ring-zinc-600/25'>
            <div className='relative size-10 overflow-hidden rounded-full shadow-sm'>
              <video
                className='size-full bg-sky-200 object-cover object-center grayscale-100'
                loop
                muted
                autoPlay
                playsInline>
                <source src='/static/videos/abstract-liquid-background/720p.mp4' type='video/mp4' />
              </video>

              <div className='absolute inset-0.5 flex items-center justify-center rounded-full bg-linear-to-t from-zinc-900 to-zinc-800 shadow-sm'>
                <PackageIcon className='size-5 opacity-75' />
              </div>
            </div>

            <div className='px-4 text-lg font-normal text-zinc-300 capitalize'>download</div>
          </div>
        </button>

        <button className='' type='button'>
          <div className='relative flex h-14 w-44 items-center overflow-hidden rounded-full shadow-xl'>
            <div className='relative overflow-hidden rounded-full shadow-md'>
              <video
                className='size-full bg-sky-200 object-cover object-center grayscale-100'
                loop
                muted
                autoPlay
                playsInline>
                <source src='/static/videos/abstract-liquid-background/720p.mp4' type='video/mp4' />
              </video>
            </div>

            <div className='absolute inset-0.75 flex items-center justify-center rounded-full bg-linear-to-t from-zinc-950 to-zinc-900 shadow-sm'>
              <div className='px-8 text-lg font-normal text-zinc-300 capitalize'>download</div>
            </div>
          </div>
        </button>
      </div>

      <pre className='mirror p-4'>{JSON.stringify(qs, null, 2)}</pre>
    </div>
  )
}
