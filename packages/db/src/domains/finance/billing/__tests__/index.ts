import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/libs/prisma'
import { Prisma } from '@prisma/generated'
import * as billing from '..'

vi.mock('@/libs/prisma', () => ({
  db: {
    plan: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Finance - billing domain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createPlan calls db.create', async () => {
    const input = { id: 'p1', name: 'Pro', price: 100 }
    const mock = { ...input }
    // @ts-expect-error mocked
    db.plan.create.mockResolvedValue(mock)

    const res = await billing.createPlan(input)
    expect(db.plan.create).toHaveBeenCalled()
    expect(res).toEqual(mock)
  })

  it('getPlanById calls findUnique', async () => {
    const mock = { id: 'p1' }
    // @ts-expect-error mocked
    db.plan.findUnique.mockResolvedValue(mock)

    const res = await billing.getPlanById('p1')
    expect(db.plan.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } })
    expect(res).toEqual(mock)
  })

  it('listPlans returns paginated data', async () => {
    const mockData = [{ id: 'p1', name: 'Pro' }]
    // @ts-expect-error mocked
    db.plan.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.plan.findMany.mockResolvedValue(mockData)

    const res = await billing.listPlans({ page: 1, limit: 10 })
    expect(res.data).toEqual(mockData)
    expect(res.meta.total).toBe(1)
  })

  it('listPlans handles search, isActive and interval filters', async () => {
    const mockData = [{ id: 'p2', name: 'Basic' }]
    // @ts-expect-error mocked
    db.plan.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.plan.findMany.mockResolvedValue(mockData)

    const res = await billing.listPlans({
      search: 'Basic',
      isActive: true,
      interval: 'MONTHLY',
    })
    expect(db.plan.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })

  it('listPlans handles pagination bounds (safe page/limit)', async () => {
    const mockData = [{ id: 'p3' }]
    // @ts-expect-error mocked
    db.plan.count.mockResolvedValue(50)
    // @ts-expect-error mocked
    db.plan.findMany.mockResolvedValue(mockData)

    const res = await billing.listPlans({
      page: 0,
      limit: 200,
      sortBy: 'name',
      sortOrder: 'desc',
    })
    expect(res.meta.limit).toBe(100)
    expect(res.meta.page).toBe(1)
    expect(db.plan.findMany).toHaveBeenCalled()
  })

  it('listSubscriptions handles filters and pagination bounds', async () => {
    const mockData = [{ id: 's2' }]
    // @ts-expect-error mocked
    db.subscription.count.mockResolvedValue(2)
    // @ts-expect-error mocked
    db.subscription.findMany.mockResolvedValue(mockData)

    const res = await billing.listSubscriptions({
      page: 0,
      limit: 200,
      organizationId: 'orgX',
      planId: 'pX',
      status: 'ACTIVE',
    })
    expect(res.meta.limit).toBe(100)
    expect(db.subscription.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })

  it('updatePlan and deletePlan call delegates', async () => {
    const updated = { id: 'p1', name: 'Pro Updated' }
    // @ts-expect-error mocked
    db.plan.update.mockResolvedValue(updated)
    // @ts-expect-error mocked
    db.plan.delete.mockResolvedValue(updated)

    const res = await billing.updatePlan('p1', { name: 'Pro Updated' })
    expect(db.plan.update).toHaveBeenCalled()
    const del = await billing.deletePlan('p1')
    expect(db.plan.delete).toHaveBeenCalled()
    expect(res).toEqual(updated)
    expect(del).toEqual(updated)
  })

  it('createSubscription calls create and getSubscriptionById includes plan', async () => {
    const subInput = {
      providerSubId: 'prov-1',
      customerId: 'cust-1',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
      organization: { connect: { id: 'org1' } },
      plan: { connect: { id: 'p1' } },
    }

    const subRes = { id: 's1', ...subInput }
    // @ts-expect-error mocked
    db.subscription.create.mockResolvedValue(subRes)
    // @ts-expect-error mocked
    db.subscription.findUnique.mockResolvedValue({
      ...subRes,
      plan: { id: 'p1' },
    })

    const created = await billing.createSubscription(subInput)
    expect(db.subscription.create).toHaveBeenCalled()
    expect(created).toEqual(subRes)

    const fetched = await billing.getSubscriptionById('s1')
    expect(db.subscription.findUnique).toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(fetched!.plan).toBeDefined()
  })

  it('listSubscriptions forwards filters', async () => {
    const mockData = [{ id: 's1' }]
    // @ts-expect-error mocked
    db.subscription.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.subscription.findMany.mockResolvedValue(mockData)

    const res = await billing.listSubscriptions({ organizationId: 'org1' })
    expect(db.subscription.findMany).toHaveBeenCalled()
    expect(res.data).toEqual(mockData)
  })

  it('updateSubscription calls update', async () => {
    const mock = { id: 's2', status: 'ACTIVE' }
    // @ts-expect-error mocked
    db.subscription.update.mockResolvedValue(mock)

    const res = await billing.updateSubscription('s2', { status: 'ACTIVE' })
    expect(db.subscription.update).toHaveBeenCalledWith({
      where: { id: 's2' },
      data: { status: 'ACTIVE' },
    })
    expect(res).toEqual(mock)
  })

  it('createInvoice/getInvoiceById/updateInvoice/listInvoices', async () => {
    const inv: Prisma.InvoiceCreateInput = {
      id: 'i1',
      providerInvoiceId: 'prov-i-1',
      amount: 100,
      currency: 'USD',
      status: 'OPEN',
      subscription: { connect: { id: 's1' } },
      organization: {
        connect: { id: 'org1' },
      } as Prisma.OrganizationCreateNestedOneWithoutInvoicesInput,
    }
    // @ts-expect-error mocked
    db.invoice.create.mockResolvedValue(inv as unknown as Prisma.Invoice)
    // @ts-expect-error mocked
    db.invoice.findUnique.mockResolvedValue({
      ...inv,
      subscription: { id: 's1', plan: { id: 'p1' } },
    } as unknown)
    // @ts-expect-error mocked
    db.invoice.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.invoice.findMany.mockResolvedValue([inv as unknown as Prisma.Invoice])

    const created = await billing.createInvoice(inv)
    expect(db.invoice.create).toHaveBeenCalled()
    expect(created).toEqual(inv)

    const fetched = await billing.getInvoiceById('i1')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(fetched!.subscription).toBeDefined()

    const listed = await billing.listInvoices({})
    expect(listed.meta.total).toBe(1)
    // update invoice
    // @ts-expect-error mocked
    db.invoice.update.mockResolvedValue({ ...inv, status: 'PAID' })
    const updated = await billing.updateInvoice('i1', {
      status: 'PAID',
    } as unknown as Prisma.InvoiceUpdateInput)
    expect(db.invoice.update).toHaveBeenCalled()
    expect(updated.status).toBe('PAID')
  })

  it('listInvoices supports filters', async () => {
    const inv2 = { id: 'i2' }
    // @ts-expect-error mocked
    db.invoice.count.mockResolvedValue(1)
    // @ts-expect-error mocked
    db.invoice.findMany.mockResolvedValue([inv2])

    const res = await billing.listInvoices({
      organizationId: 'org1',
      subscriptionId: 's1',
      status: 'OPEN',
    })
    expect(db.invoice.findMany).toHaveBeenCalled()
    expect(res.data).toEqual([inv2])
  })
})
