import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, DollarSign, Search, Scissors, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { servicesApi } from '@/services/services.service'

export default function ServicesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['client-services'],
    queryFn: servicesApi.findAll,
  })

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))]

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    return matchesSearch && matchesCategory && (service.isActive !== false)
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de Servicios</h1>
          <p className="text-sm text-muted-foreground">
            Explora nuestros servicios profesionales y agenda tu cita al instante
          </p>
        </div>
        <Button onClick={() => navigate('/book')} className="gap-2 self-start md:self-auto">
          <Scissors className="size-4" />
          Agendar Cita General
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              {cat === 'all' ? 'Todos' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-52 rounded-xl bg-card border border-border/50 animate-pulse p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
          Error al cargar los servicios. Por favor, intenta de nuevo.
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Scissors className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-base font-medium">No se encontraron servicios</p>
          <p className="text-sm text-muted-foreground">Prueba con otra búsqueda o categoría</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Card key={service.id} className="flex flex-col justify-between transition-all hover:shadow-md">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold">{service.name}</CardTitle>
                  <Badge variant="secondary" className="capitalize shrink-0">
                    {service.category || 'General'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {service.description || 'Servicio profesional de barbería y estilismo.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-4 text-primary" />
                    <span>{service.duration} minutos</span>
                  </div>
                  <div className="flex items-center gap-1 text-base font-bold text-foreground">
                    <DollarSign className="size-4 text-emerald-600" />
                    <span>{Number(service.price).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  className="w-full gap-2"
                  onClick={() => navigate(`/book?serviceId=${service.id}`)}
                >
                  Agendar este Servicio
                  <ArrowRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
