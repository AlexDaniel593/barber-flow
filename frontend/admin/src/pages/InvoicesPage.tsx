import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Printer, Receipt, Scissors } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { appointmentsApi } from '@/services/appointments.service'
import { stylistsApi } from '@/services/stylists.service'
import { invoicesApi } from '@/services/invoices.service'
import type { Appointment, Invoice } from '@/types/api'

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

export default function InvoicesPage() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', 'COMPLETED'],
    queryFn: () => appointmentsApi.findAll({ status: 'COMPLETED' }),
  })
  const { data: stylists } = useQuery({ queryKey: ['stylists'], queryFn: stylistsApi.findAll })

  const invoiceQueries = useQueries({
    queries: (appointments ?? []).map((a) => ({
      queryKey: ['invoice-by-appointment', a.id],
      queryFn: () =>
        invoicesApi.findByAppointment(a.id).catch(() => null as Invoice | null),
      enabled: !!appointments,
    })),
  })

  const [receipt, setReceipt] = useState<{ invoice: Invoice; appointment: Appointment } | null>(
    null,
  )

  const stylistName = (id: string) => stylists?.find((s) => s.id === id)?.name ?? '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Facturación</h1>
        <p className="text-sm text-muted-foreground">
          Las facturas se generan automáticamente al completar una cita. Aquí puedes consultarlas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Citas completadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estilista</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado de factura</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments?.length ? (
                  appointments.map((a, i) => {
                    const invoice = invoiceQueries[i]?.data
                    const loadingInvoice = invoiceQueries[i]?.isLoading

                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.clientName}</TableCell>
                        <TableCell>{stylistName(a.stylistId)}</TableCell>
                        <TableCell>{new Date(a.startTime).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {loadingInvoice ? (
                            <Skeleton className="h-5 w-20" />
                          ) : invoice ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                              Facturada — ${Number(invoice.total).toFixed(2)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Sin facturar</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReceipt({ invoice, appointment: a })}
                            >
                              <Receipt className="size-4" />
                              Ver factura
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay citas completadas todavía.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-md p-0" showCloseButton>
          {receipt && (
            <div>
              <div id="invoice-receipt" className="p-6">
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-2">
                    <Scissors className="size-5" />
                    <span className="text-lg font-semibold">BarberFlow</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Comprobante de servicio</p>
                </div>

                <Separator className="my-4" />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">N.° factura</span>
                    <span className="font-mono text-xs">{receipt.invoice.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha</span>
                    <span>
                      {new Date(
                        receipt.invoice.createdAt ?? receipt.appointment.startTime,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span>{receipt.appointment.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono</span>
                    <span>{receipt.appointment.clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estilista</span>
                    <span>{stylistName(receipt.appointment.stylistId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de pago</span>
                    <span>{PAYMENT_LABEL[receipt.invoice.paymentMethod] ?? receipt.invoice.paymentMethod}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">P. unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.invoice.items.map((it, i) => (
                      <TableRow key={i}>
                        <TableCell>{it.description}</TableCell>
                        <TableCell className="text-center">{it.quantity}</TableCell>
                        <TableCell className="text-right">
                          ${Number(it.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(it.total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${Number(receipt.invoice.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(receipt.invoice.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descuento</span>
                      <span>-${Number(receipt.invoice.discount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(receipt.invoice.tax) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impuestos</span>
                      <span>${Number(receipt.invoice.tax).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${Number(receipt.invoice.total).toFixed(2)}</span>
                  </div>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  ¡Gracias por su preferencia!
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t p-4 print:hidden">
                <Button variant="outline" onClick={() => setReceipt(null)}>
                  Cerrar
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer className="size-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
