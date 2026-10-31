import { TriangleAlertIcon } from "@keyline-icons/react"

/**
 * What a page shows when it can't get what it needs from the node.
 *
 * @param children - What the warning means for this page, under the headline
 */
export function NodeWarning({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='flex flex-col items-center justify-center py-32'>
      <TriangleAlertIcon className='size-32' />
      <h3 className='text-foreground/90 text-4xl font-bold uppercase'>warning</h3>
      <p className='text-foreground/75 text-2xl leading-10 font-light'>
        <b>Bitcoin Core RPC</b> is currently offline.
      </p>
      {children}
    </div>
  )
}
