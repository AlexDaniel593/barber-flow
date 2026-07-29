import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Calendar, Clock, Scissors, UserCheck, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { servicesApi } from '@/services/services.service'
import { stylistsApi } from '@/services/stylists.service'
import { appointmentsApi } from '@/services/appointments.service'
import { useAuthStore } from '@/store/auth-store'

export default function BookAppointmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)

  // Pre-selected parameters from URL if any
  const urlServiceId = searchParams.get('serviceId') || ''
  const urlStylistId = searchParams.get('stylistId') || ''

  // Form states
  const [serviceId, setServiceId] = useState(urlServiceId)
  const [stylistId, setStylistId] = useState(urlStylistId)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('10:00')
  const [clientName, setClientName] = useState(user?.name || '')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState(user?.email || '')
  const [notes, setNotes] = useState('')

  // Fetch Services & Stylists
  const { data: services = [] } = useQuery({
    queryKey: ['client-services'],
    queryFn: servicesApi.findAll,
  })

  const { data: stylists = [] } = useQuery({
    queryKey: ['client-stylists'],
    queryFn: stylistsApi.findAll,
  })

  // Selected object helpers
  const selectedService = services.find((s) => s.id === serviceId)

  // Update defaults when data arrives
  useEffect(() => {
    if (urlServiceId) setServiceId(urlServiceId)
    if (urlStylistId) setStylistId(urlStylistId)
  }, [urlServiceId, urlStylistId])

  // Mutation to create appointment
  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      toast.success('¡Cita agendada exitosamente!')
      navigate('/my-appointments')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al agendar la cita. Verifica los horarios disponibles.'
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceId) {
      toast.error('Por favor selecciona un servicio')
      return
    }
    if (!stylistId) {
      toast.error('Por favor selecciona un estilista')
      return
    }
    if (!clientName || !clientPhone) {
      toast.error('Por favor completa tu nombre y número de teléfono')
      return
    }

    // Format ISO startTime
    const startTimeISO = new Date(`${date}T${time}:00`).toISOString()
    const duration = selectedService?.duration || 30
    const totalPrice = selectedService ? Number(selectedService.price) : 0

    createMutation.mutate({
      serviceId,
      stylistId,
      startTime: startTimeISO,
      duration,
      clientName,
      clientPhone,
      clientEmail: clientEmail || user?.email,
      notes: notes || undefined,
      totalPrice,
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agendar Cita</h1>
          <p className="text-sm text-muted-foreground">
            Completa la información para reservar tu horario preferido
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Detalles de la Reserva</CardTitle>
          <CardDescription>
            Selecciona el servicio, el profesional de tu elección y tu horario disponible
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form id="book-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Servicio */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Scissors className="size-4 text-primary" />
                1. Selecciona un Servicio *
              </Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{service.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ${Number(service.price).toFixed(2)} ({service.duration} min)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedService && (
                <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>{selectedService.description || 'Sin descripción'}</span>
                  <span className="font-semibold text-primary">
                    ${Number(selectedService.price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Estilista */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <UserCheck className="size-4 text-primary" />
                2. Selecciona un Estilista *
              </Label>
              <Select value={stylistId} onValueChange={setStylistId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un estilista..." />
                </SelectTrigger>
                <SelectContent>
                  {stylists.map((stylist) => (
                    <SelectItem key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Fecha y Hora */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  Fecha de la Cita *
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Hora Preferida *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Step 4: Datos del Cliente */}
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-semibold text-foreground">Tus Datos de Contacto</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre Completo *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono de Contacto *</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="0991234567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Correo Electrónico</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas o Instrucciones Especiales (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Prefiero corte bajo en los lados, etc."
                />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t bg-muted/10 pt-4">
          <div>
            {selectedService && (
              <p className="text-sm font-medium">
                Total estimado: <span className="text-base font-bold text-emerald-600">${Number(selectedService.price).toFixed(2)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="book-form"
              disabled={createMutation.isPending}
              className="gap-2 font-medium"
            >
              {createMutation.isPending ? 'Confirmando...' : 'Confirmar Reserva'}
              <CheckCircle2 className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
