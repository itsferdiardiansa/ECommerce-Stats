import { Fragment } from 'react'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@rufieltics/ui'
import type { BreadcrumbCrumb } from '@/features/console/lib/nav'

export function ConsoleBreadcrumb({ items }: { items: BreadcrumbCrumb[] }) {
  if (items.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1
          const Icon = crumb.icon
          const content = (
            <span className="inline-flex items-center gap-1.5">
              {Icon ? <Icon className="size-3.5" /> : null}
              {crumb.label}
            </span>
          )
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{content}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{content}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator>/</BreadcrumbSeparator>}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
