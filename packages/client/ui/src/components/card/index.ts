import { CardComponent, CardHeaderSlot, CardContentSlot } from './Card'
import type { CardProps } from './Card'

export const Card = CardComponent as React.ForwardRefExoticComponent<
  CardProps & React.RefAttributes<HTMLDivElement>
> & {
  Header: typeof CardHeaderSlot
  Content: typeof CardContentSlot
}

Card.Header = CardHeaderSlot
Card.Content = CardContentSlot
