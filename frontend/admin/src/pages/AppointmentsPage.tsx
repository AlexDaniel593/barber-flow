import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { appointmentsApi, type CreateAppointmentInput } from '@/services/appointments.service'
import { stylistsApi } from '@/services/stylists.service'
import { servicesApi } from '@/services/services.service'
import type { AppointmentStatus } from '@/types/api'

const emptyForm: CreateAppointmentInput = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  stylistId: '',
  serviceId: '',
  startTime: '',
  duration: 30,
}

const STATUS_OPTIONS: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
}

const STATUS_VARIANT: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  CONFIRMED: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  IN_PROGRESS: 'bg-violet-100 text-violet-800 hover:bg-violet-100',
  COMPLETED: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
  NO_SHOW: 'bg-zinc-200 text-zinc-800 hover:bg-zinc-200',
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () =>
      appointmentsApi.findAll(statusFilter === 'ALL' ? {} : { status: statusFilter }),
  })

  const { data: stylists } = useQuery({ queryKey: ['stylists'], queryFn: stylistsApi.findAll })
  const { data: services } = useQuery({ queryKey: ['services'], queryFn: servicesApi.findAll })

  const stylistName = (id: string) => stylists?.find((s) => s.id === id)?.name ?? '—'
  const serviceName = (id: string) => services?.find((s) => s.id === id)?.name ?? '—'

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Estado de la cita actualizado')
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  })

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateAppointmentInput>(emptyForm)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Cita creada correctamente')
      setOpen(false)
      setForm(emptyForm)
      setDate('')
      setTime('')
    },
    onError: () => toast.error('No se pudo crear la cita'),
  })

  const selectService = (serviceId: string) => {
    const service = services?.find((s) => s.id === serviceId)
    if (!service) return
    setForm({ ...form, serviceId, duration: service.duration, totalPrice: Number(service.price) })
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) {
      toast.error('Selecciona fecha y hora')
      return
    }
    createMutation.mutate({
      ...form,
      clientEmail: form.clientEmail || undefined,
      startTime: new Date(`${date}T${time}:00`).toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Citas</h1>
          <p className="text-sm text-muted-foreground">
            Visualiza y gestiona el estado de todas las citas del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm(emptyForm)}>
                <Plus className="size-4" />
                Nueva cita
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>Nueva cita</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Nombre del cliente</Label>
                      <Input
                        id="clientName"
                        value={form.clientName}
                        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Teléfono</Label>
                      <Input
                        id="clientPhone"
                        value={form.clientPhone}
                        onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Correo (opcional)</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={form.clientEmail}
                      onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estilista</Label>
                    <Select
                      value={form.stylistId}
                      onValueChange={(v) => setForm({ ...form, stylistId: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un estilista" />
                      </SelectTrigger>
                      <SelectContent>
                        {stylists?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Servicio</Label>
                    <Select value={form.serviceId} onValueChange={selectService}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} — ${Number(s.price).toFixed(2)} ({s.duration} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Hora</Label>
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Input
                      id="notes"
                      value={form.notes ?? ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Crear cita
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las citas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estilista</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Cambiar estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments?.length ? (
                  appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.clientName}</TableCell>
                      <TableCell>{stylistName(a.stylistId)}</TableCell>
                      <TableCell>{serviceName(a.serviceId)}</TableCell>
                      <TableCell>{new Date(a.startTime).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_VARIANT[a.status]} variant="secondary">
                          {STATUS_LABEL[a.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={a.status}
                          onValueChange={(status) =>
                            updateStatus.mutate({ id: a.id, status: status as AppointmentStatus })
                          }
                        >
                          <SelectTrigger className="ml-auto w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay citas para mostrar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
