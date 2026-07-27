import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Mail, Phone, Search, UserCheck, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { stylistsApi } from '@/services/stylists.service'

export default function StylistsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: stylists = [], isLoading, error } = useQuery({
    queryKey: ['client-stylists'],
    queryFn: stylistsApi.findAll,
  })

  const filteredStylists = stylists.filter((stylist) => {
    const matchesSearch =
      stylist.name.toLowerCase().includes(search.toLowerCase()) ||
      stylist.email.toLowerCase().includes(search.toLowerCase()) ||
      (stylist.specialties && stylist.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase())))
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuestros Estilistas</h1>
          <p className="text-sm text-muted-foreground">
            Conoce a nuestro equipo de profesionales calificados y elige tu favorito
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar estilista o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stylists Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-xl bg-card border border-border/50 animate-pulse p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
          Error al cargar los estilistas. Por favor, intenta de nuevo.
        </div>
      ) : filteredStylists.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <UserCheck className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-base font-medium">No se encontraron estilistas</p>
          <p className="text-sm text-muted-foreground">Prueba con otro término de búsqueda</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStylists.map((stylist) => {
            const initials = stylist.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <Card key={stylist.id} className="flex flex-col justify-between transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="size-12 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg font-semibold truncate">{stylist.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs text-emerald-600 border-emerald-500/30 bg-emerald-50/50">
                      Disponible
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{stylist.email}</span>
                    </div>
                    {stylist.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-primary shrink-0" />
                        <span>{stylist.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Specialties Badges */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Especialidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {stylist.specialties && stylist.specialties.length > 0 ? (
                        stylist.specialties.map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">General</span>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    className="w-full gap-2"
                    onClick={() => navigate(`/book?stylistId=${stylist.id}`)}
                  >
                    <CalendarPlus className="size-4" />
                    Agendar con {stylist.name.split(' ')[0]}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
