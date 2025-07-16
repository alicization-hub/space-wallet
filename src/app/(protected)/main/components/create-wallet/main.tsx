'use client'

import { AnimatePresence } from 'framer-motion'
import { pick } from 'ramda'
import { useState } from 'react'

import { ShieldIcon } from '@/components/icons'
import { SwitchValidator } from '@/libs/actions/account/validator'
import { type CreateWalletValidator } from '@/libs/actions/wallet/validator'

import { ComplateComponent } from './forms/complete'
import { MnemonicComponent } from './forms/mnemonic'
import { VerifyComponent } from './forms/verify'

type State = Omit<SwitchValidator, 'passphrase'> & CreateWalletValidator

export function MainComponent({ onClose }: Readonly<{ onClose?: () => void }>) {
  // __STATE's
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [state, setState] = useState<State>({
    walletId: '',
    accountId: '',
    name: '',
    mnemonic: '',
    passphrase: '',
    confirmPassphrase: ''
  })

  // __RENDER
  return (
    <div className='flex flex-col gap-4'>
      {currentStep < 3 && (
        <div className='border-b-foreground-50 flex items-center gap-2 border-b-2 pb-4 select-none'>
          <ShieldIcon className='size-6 stroke-amber-400' />
          <div className='text-xl font-medium capitalize'>create new wallet</div>
        </div>
      )}

      <AnimatePresence mode='wait'>
        {/* Step 1: Basic Information, Mnemonic seed phrase */}
        {currentStep === 1 && (
          <MnemonicComponent
            onClose={onClose}
            onContinue={(values) => {
              setState((prev) => ({ ...prev, ...values }))
              setCurrentStep(2)
            }}
          />
        )}

        {/* Step 2: Verify Recovery Words */}
        {currentStep === 2 && (
          <VerifyComponent
            data={pick(['name', 'mnemonic'], state)}
            onClose={onClose}
            onSuccess={(values) => {
              setState((prev) => ({ ...prev, ...values }))
              setCurrentStep(3)
            }}
          />
        )}

        {/* Step 3: Completion */}
        {currentStep === 3 && (
          <ComplateComponent data={pick(['walletId', 'accountId', 'passphrase'], state)} />
        )}
      </AnimatePresence>
    </div>
  )
}
