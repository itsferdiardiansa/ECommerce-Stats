import { DashboardShellProps } from './types'

type ContentHeaderProps = Pick<
  DashboardShellProps,
  'title' | 'subTitle' | 'actions' | 'headerLead' | 'headerComponent'
>

const ContentHeader = ({
  title,
  subTitle,
  actions,
  headerLead,
  headerComponent,
}: ContentHeaderProps) => {
  if (headerComponent) return <>{headerComponent}</>

  return (
    <div className="flex flex-col gap-2">
      {headerLead}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {title || subTitle ? (
          <div className="flex flex-col gap-1">
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
            {subTitle && (
              <p className="text-muted-foreground text-sm">{subTitle}</p>
            )}
          </div>
        ) : null}
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}

export function DashboardContentShell({
  title,
  subTitle,
  actions,
  headerLead,
  headerComponent,
  alert,
  children,
}: Pick<
  DashboardShellProps,
  | 'title'
  | 'subTitle'
  | 'actions'
  | 'headerLead'
  | 'headerComponent'
  | 'alert'
  | 'children'
>) {
  const hasHeader = Boolean(
    headerComponent || title || subTitle || actions || headerLead
  )
  const hasAlert = Boolean(alert)

  return (
    <div className="bg-background flex flex-1 flex-col py-4 md:py-6">
      {hasHeader || hasAlert ? (
        <div className="flex flex-col gap-4 px-4 pb-6 md:px-6">
          {hasHeader ? (
            <ContentHeader
              title={title}
              subTitle={subTitle}
              actions={actions}
              headerLead={headerLead}
              headerComponent={headerComponent}
            />
          ) : null}
          {hasAlert ? <div className="flex flex-col gap-3">{alert}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
