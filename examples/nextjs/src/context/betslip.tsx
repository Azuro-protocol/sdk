import { useContext, createContext, useState, useEffect } from 'react';
import { useBaseBetslip } from '@azuro-org/sdk';


export type BetslipContextValue = {
  isOpen: boolean
  setOpen: (value: boolean) => void
}

export const BetslipContext = createContext<BetslipContextValue | null>(null)

export const useBetslip = () => {
  return useContext(BetslipContext) as BetslipContextValue
}

type Props = {
  children: React.ReactNode
}

export const BetslipProvider: React.FC<Props> = ({ children }) => {
  const { items } = useBaseBetslip()
  const [ isOpen, setOpen ] = useState(false)

  useEffect(() => {
    if (items.length) {
      setOpen(true)
    }
  }, [ items ])

  const value = {
    isOpen,
    setOpen,
  }

  return (
    <BetslipContext.Provider value={value}>
      {children}
    </BetslipContext.Provider>
  );
}
