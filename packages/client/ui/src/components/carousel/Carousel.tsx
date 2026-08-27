'use client'

import {
  Children,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CarouselProps {
  children: ReactNode
  itemClassName?: string
  gapClassName?: string
  /** Fade (mask) the left edge while there is content scrolled off to the left
   *  and the right edge while there is more to the right. */
  fade?: boolean
  className?: string
  ariaLabel?: string
}

const FADE_EDGE = '2rem'

export function Carousel({
  children,
  itemClassName,
  gapClassName = 'gap-4',
  fade = false,
  className,
  ariaLabel,
}: CarouselProps) {
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    dragFree: false,
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!embla) return
    setCanPrev(embla.canScrollPrev())
    setCanNext(embla.canScrollNext())
  }, [embla])

  useEffect(() => {
    if (!embla) return
    onSelect()
    embla.on('select', onSelect)
    embla.on('reInit', onSelect)
    return () => {
      embla.off('select', onSelect)
      embla.off('reInit', onSelect)
    }
  }, [embla, onSelect])

  const overflowing = canPrev || canNext

  const maskImage =
    fade && overflowing
      ? `linear-gradient(to right, ${canPrev ? 'transparent' : 'black'} 0, black ${FADE_EDGE}, black calc(100% - ${FADE_EDGE}), ${canNext ? 'transparent' : 'black'} 100%)`
      : undefined

  return (
    <div className={cn('group relative w-full min-w-0', className)}>
      <div
        ref={viewportRef}
        className="w-full overflow-hidden"
        style={
          maskImage ? { maskImage, WebkitMaskImage: maskImage } : undefined
        }
      >
        <div
          className={cn('flex items-stretch', gapClassName)}
          role="group"
          aria-label={ariaLabel}
        >
          {Children.map(children, child =>
            child === null || child === undefined ? null : (
              <div
                className={cn('shrink-0 grow-0 [&>*]:h-full', itemClassName)}
              >
                {child}
              </div>
            )
          )}
        </div>
      </div>

      {overflowing ? (
        <>
          <NavButton
            side="left"
            disabled={!canPrev}
            onClick={() => embla?.scrollPrev()}
          />
          <NavButton
            side="right"
            disabled={!canNext}
            onClick={() => embla?.scrollNext()}
          />
        </>
      ) : null}
    </div>
  )
}

function NavButton({
  side,
  disabled,
  onClick,
}: {
  side: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous' : 'Next'}
      className={cn(
        'bg-background/90 text-foreground absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm backdrop-blur',
        'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
        'hover:bg-background disabled:pointer-events-none disabled:opacity-0',
        side === 'left' ? 'left-1' : 'right-1'
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
