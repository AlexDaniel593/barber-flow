import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  inventoryApi,
  type CreateInventoryItemInput,
} from '@/services/inventory.service'
import type { InventoryItem } from '@/types/api'

const emptyForm: CreateInventoryItemInput = {
  name: '',
  category: '',
  sku: '',
  quantity: 0,
  minStock: 5,
  unit: '',
  pricePerUnit: 0,
}

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.findAll(),
  })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState<CreateInventoryItemInput>(emptyForm)

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)
  const [adjustQty, setAdjustQty] = useState(1)
  const [adjustOp, setAdjustOp] = useState<'add' | 'subtract'>('add')
  const [adjustReason, setAdjustReason] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inventory'] })

  const createMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      invalidate()
      toast.success('Insumo creado')
      setOpen(false)
    },
    onError: () => toast.error('No se pudo crear el insumo'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateInventoryItemInput }) =>
      inventoryApi.update(id, dto),
    onSuccess: () => {
      invalidate()
      toast.success('Insumo actualizado')
      setOpen(false)
    },
    onError: () => toast.error('No se pudo actualizar el insumo'),
  })

  const removeMutation = useMutation({
    mutationFn: inventoryApi.remove,
    onSuccess: () => {
      invalidate()
      toast.success('Insumo eliminado')
    },
    onError: () => toast.error('No se pudo eliminar el insumo'),
  })

  const adjustMutation = useMutation({
    mutationFn: () =>
      inventoryApi.adjustStock(adjustTarget!.id, adjustQty, adjustOp, adjustReason),
    onSuccess: () => {
      invalidate()
      toast.success('Stock ajustado')
      setAdjustOpen(false)
    },
    onError: () => toast.error('No se pudo ajustar el stock'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (item: InventoryItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      sku: item.sku,
      quantity: item.quantity,
      minStock: item.minStock,
      unit: item.unit,
      pricePerUnit: Number(item.pricePerUnit ?? 0),
    })
    setOpen(true)
  }

  const openAdjust = (item: InventoryItem) => {
    setAdjustTarget(item)
    setAdjustQty(1)
    setAdjustOp('add')
    setAdjustReason('')
    setAdjustOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing.id, dto: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    adjustMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Controla el stock de insumos y productos.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Nuevo insumo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar insumo' : 'Nuevo insumo'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      required
                      disabled={!!editing}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                      required
                      disabled={!!editing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Stock mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={form.minStock}
                      onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidad</Label>
                    <Input
                      id="unit"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      placeholder="ml, u, kg"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Precio por unidad</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.pricePerUnit}
                    onChange={(e) => setForm({ ...form, pricePerUnit: Number(e.target.value) })}
                  />
                </div>
                {editing && (
                  <p className="text-xs text-muted-foreground">
                    La cantidad se ajusta con el botón de stock en la tabla, no desde este formulario.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editing ? 'Guardar cambios' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.length ? (
                  items.map((item) => {
                    const isLow = item.quantity <= item.minStock
                    return (
                      <TableRow key={item.id} className={cn(isLow && 'bg-red-50')}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.quantity}
                            {isLow && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="size-3" />
                                Bajo stock
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openAdjust(item)} title="Ajustar stock">
                            <TrendingUp className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar {item.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeMutation.mutate(item.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay insumos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <form onSubmit={handleAdjustSubmit}>
            <DialogHeader>
              <DialogTitle>Ajustar stock — {adjustTarget?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={adjustOp === 'add' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustOp('add')}
                >
                  <TrendingUp className="size-4" />
                  Agregar
                </Button>
                <Button
                  type="button"
                  variant={adjustOp === 'subtract' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustOp('subtract')}
                >
                  <TrendingDown className="size-4" />
                  Restar
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustQty">Cantidad</Label>
                <Input
                  id="adjustQty"
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustReason">Motivo</Label>
                <Input
                  id="adjustReason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Compra a proveedor, uso en servicio, merma..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={adjustMutation.isPending}>
                Confirmar ajuste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
