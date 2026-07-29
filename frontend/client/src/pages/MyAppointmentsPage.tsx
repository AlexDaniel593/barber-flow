import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CalendarDays,
  Clock,
  Scissors,
  UserCheck,
  Ban,
  CalendarPlus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { appointmentsApi } from '@/services/appointments.service'
import { servicesApi } from '@/services/services.service'
import { stylistsApi } from '@/services/stylists.service'
import { useAuthStore } from '@/store/auth-store'
import type { Appointment, AppointmentStatus } from '@/types/api'

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
> = {
  PENDING: { label: 'Pendiente', variant: 'outline', className: 'border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  CONFIRMED: { label: 'Confirmada', variant: 'default', className: 'bg-blue-600 hover:bg-blue-700' },
  IN_PROGRESS: { label: 'En Proceso', variant: 'secondary', className: 'bg-purple-600 text-white' },
  COMPLETED: { label: 'Completada', variant: 'outline', className: 'border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive', className: '' },
  NO_SHOW: { label: 'No Asistió', variant: 'outline', className: 'border-zinc-500 text-zinc-500' },
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [cancelModalAppointment, setCancelModalAppointment] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Fetch client's appointments
  const {
    data: appointments = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['my-appointments', user?.email],
    queryFn: () => appointmentsApi.getByClient(user?.email || ''),
    enabled: Boolean(user?.email),
  })

  // Fetch Services & Stylists maps to render names cleanly
  const { data: services = [] } = useQuery({
    queryKey: ['client-services'],
    queryFn: servicesApi.findAll,
  })

  const { data: stylists = [] } = useQuery({
    queryKey: ['client-stylists'],
    queryFn: stylistsApi.findAll,
  })

  const servicesMap = new Map(services.map((s) => [s.id, s]))
  const stylistsMap = new Map(stylists.map((s) => [s.id, s]))

  // Cancellation mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Cita cancelada correctamente')
      setCancelModalAppointment(null)
      setCancelReason('')
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al cancelar la cita'
      toast.error(msg)
    },
  })

  const handleConfirmCancel = () => {
    if (!cancelModalAppointment) return
    cancelMutation.mutate({
      id: cancelModalAppointment.id,
      reason: cancelReason,
    })
  }

  // Filter appointments by tab
  const filteredAppointments = appointments.filter((app) => {
    if (activeTab === 'ALL') return true
    return app.status === activeTab
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Citas Reservadas</h1>
          <p className="text-sm text-muted-foreground">
            Revisa el estado de tus reservas y gestiona tus horarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => navigate('/book')} size="sm" className="gap-2">
            <CalendarPlus className="size-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto p-1">
          <TabsTrigger value="ALL">Todas ({appointments.length})</TabsTrigger>
          <TabsTrigger value="PENDING">Pendientes</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Confirmadas</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completadas</TabsTrigger>
          <TabsTrigger value="CANCELLED">Canceladas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Appointments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-card border border-border/50 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <CalendarDays className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-base font-medium">No se encontraron citas</p>
          <p className="text-sm text-muted-foreground mb-4">
            {activeTab === 'ALL'
              ? 'Aún no tienes citas registradas.'
              : `No tienes citas en estado "${activeTab}".`}
          </p>
          <Button onClick={() => navigate('/book')} className="gap-2">
            <CalendarPlus className="size-4" />
            Agendar tu Primera Cita
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => {
            const service = servicesMap.get(app.serviceId)
            const stylist = stylistsMap.get(app.stylistId)
            const statusConfig = STATUS_CONFIG[app.status] || {
              label: app.status,
              variant: 'outline',
            }

            const formattedDate = new Date(app.startTime).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })

            const formattedTime = new Date(app.startTime).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })

            const canCancel = app.status === 'PENDING' || app.status === 'CONFIRMED'

            return (
              <Card key={app.id} className="transition-all hover:shadow-sm">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Scissors className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">
                        {service ? service.name : `Servicio ID: ${app.serviceId}`}
                      </CardTitle>
                      <CardDescription className="text-xs capitalize">
                        {formattedDate} a las {formattedTime}
                      </CardDescription>
                    </div>
                  </div>

                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </CardHeader>

                <CardContent className="grid gap-3 pt-2 text-sm sm:grid-cols-3 border-t">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserCheck className="size-4 text-primary shrink-0" />
                    <span className="truncate">
                      Estilista: <strong className="text-foreground">{stylist ? stylist.name : app.stylistId}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4 text-primary shrink-0" />
                    <span>Duración: {app.duration} mins</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-semibold text-foreground">
                      ${app.totalPrice ? Number(app.totalPrice).toFixed(2) : (service ? Number(service.price).toFixed(2) : '0.00')}
                    </span>

                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                        onClick={() => {
                          setCancelModalAppointment(app)
                          setCancelReason('')
                        }}
                      >
                        <Ban className="size-3.5" />
                        Cancelar Cita
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      <Dialog
        open={Boolean(cancelModalAppointment)}
        onOpenChange={(open) => !open && setCancelModalAppointment(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Cita</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar tu cita? Esta acción liberará tu horario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="reason">Motivo de cancelación (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ej: Cambio de planes, indisponibilidad de horario..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelModalAppointment(null)}
              disabled={cancelMutation.isPending}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
