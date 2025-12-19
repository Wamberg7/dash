import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/main'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Bot, ShoppingCart, DollarSign, Activity, Plus, Edit, Trash2, X, Loader2, Search, ChevronUp, ChevronDown, MoreVertical, GripVertical } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { Product } from '@/types'
import { getCentralCartProducts, CentralCartProduct } from '@/lib/centralcart'
import { cn } from '@/lib/utils'

const productSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  features: z.string().min(1, 'Adicione pelo menos uma feature'),
  active: z.boolean().default(true),
  highlight: z.string().optional(),
  iconType: z.enum(['shopping-cart', 'bot']).optional(),
  centralCartPackageId: z.number().optional().or(z.string().transform((val) => val ? Number(val) : undefined)),
})

type ProductFormData = z.infer<typeof productSchema>

export function ProductManager() {
  const { products, updateProduct, createProduct, deleteProduct, refreshData, settings } = useAppStore()
  const { toast } = useToast()
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [centralCartProducts, setCentralCartProducts] = useState<CentralCartProduct[]>([])
  const [loadingCentralCartProducts, setLoadingCentralCartProducts] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  // Iniciar com todas as categorias expandidas
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // Inicializar com 'all' expandido
    return new Set(['all'])
  })
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null)
  const [draggedOverProduct, setDraggedOverProduct] = useState<string | null>(null)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      features: '',
      active: true,
      highlight: '',
      iconType: 'bot',
    },
  })

  // Buscar produtos da CentralCart quando o dialog abrir e o gateway for CentralCart
  useEffect(() => {
    if (isDialogOpen && settings?.paymentGateway === 'CentralCart') {
      loadCentralCartProducts()
    } else {
      setCentralCartProducts([])
    }
  }, [isDialogOpen, settings?.paymentGateway])

  const loadCentralCartProducts = async () => {
    if (!settings?.centralCartApiToken) {
      return
    }

    setLoadingCentralCartProducts(true)
    try {
      const result = await getCentralCartProducts(
        settings.centralCartApiToken
      )

      if (result.success && result.products && result.products.length > 0) {
        setCentralCartProducts(result.products)
        toast({
          title: 'Produtos carregados',
          description: `${result.products.length} produto(s) encontrado(s) na CentralCart`,
        })
      } else {
        // Não mostrar erro se for apenas porque não há endpoint público
        // O usuário ainda pode digitar o Package ID manualmente
        if (result.error && !result.error.includes('não possui um endpoint público')) {
          toast({
            title: 'Erro ao carregar produtos',
            description: result.error || 'Não foi possível carregar os produtos da CentralCart',
            variant: 'destructive',
          })
        }
        // Se não houver produtos mas não for erro crítico, apenas não carregar a lista
        setCentralCartProducts([])
      }
    } catch (error: any) {
      console.error('Erro ao buscar produtos CentralCart:', error)
      toast({
        title: 'Erro ao carregar produtos',
        description: error.message || 'Erro ao buscar produtos da CentralCart',
        variant: 'destructive',
      })
    } finally {
      setLoadingCentralCartProducts(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setSelectedFile(null)
    form.reset({
      title: product.title,
      description: product.description,
      price: product.price,
      features: product.features.join('\n'),
      active: product.active,
      highlight: product.highlight || '',
      iconType: product.iconType || 'bot',
      centralCartPackageId: product.centralCartPackageId || undefined,
    })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    form.reset({
      title: '',
      description: '',
      price: 0,
      features: '',
      active: true,
      highlight: '',
      iconType: 'bot',
      centralCartPackageId: undefined,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    setIsDeleting(id)
    try {
      await deleteProduct(id)
      toast({
        title: 'Produto excluído',
        description: 'O produto foi excluído com sucesso.',
      })
      await refreshData()
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error)
      const errorMessage = error?.message || error?.error?.message || 
        'Ocorreu um erro ao excluir o produto.'
      toast({
        title: 'Erro ao excluir',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      const featuresArray = data.features
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0)

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          title: data.title,
          description: data.description,
          price: data.price,
          features: featuresArray,
          active: data.active,
          highlight: data.highlight || undefined,
          iconType: data.iconType,
          centralCartPackageId: data.centralCartPackageId,
        })
        toast({
          title: 'Produto atualizado',
          description: 'O produto foi atualizado com sucesso.',
        })
      } else {
        await createProduct({
          title: data.title,
          description: data.description,
          price: data.price,
          features: featuresArray,
          active: data.active,
          highlight: data.highlight || undefined,
          iconType: data.iconType,
          centralCartPackageId: data.centralCartPackageId,
        })
        toast({
          title: 'Produto criado',
          description: 'O produto foi criado com sucesso.',
        })
      }
      setIsDialogOpen(false)
      await refreshData()
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error)
      const errorMessage = error?.message || error?.error?.message || 
        (editingProduct 
          ? 'Ocorreu um erro ao atualizar o produto.' 
          : 'Ocorreu um erro ao criar o produto.')
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleActiveChange = async (id: string, active: boolean) => {
    try {
      await updateProduct(id, { active })
      toast({
        title: 'Produto atualizado',
        description: `Produto ${active ? 'ativado' : 'desativado'} com sucesso.`,
      })
    } catch (error: any) {
      console.error('Erro ao atualizar status do produto:', error)
      const errorMessage = error?.message || error?.error?.message || 
        'Ocorreu um erro ao atualizar o produto.'
      toast({
        title: 'Erro ao atualizar',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handlePriceChange = async (id: string, price: string) => {
    const numPrice = parseFloat(price)
    if (!isNaN(numPrice)) {
      try {
        await updateProduct(id, { price: numPrice })
        toast({
          title: 'Preço atualizado',
          description: 'O preço foi atualizado com sucesso.',
        })
      } catch (error: any) {
        console.error('Erro ao atualizar preço do produto:', error)
        const errorMessage = error?.message || error?.error?.message || 
          'Ocorreu um erro ao atualizar o preço.'
        toast({
          title: 'Erro ao atualizar',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    }
  }

  // Filtrar produtos por termo de busca
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Ordenar produtos (se tiverem display_order, senão manter ordem original)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const orderA = (a as any).display_order ?? null
    const orderB = (b as any).display_order ?? null
    
    // Se ambos têm display_order, ordenar por ele
    if (orderA !== null && orderB !== null) {
      return orderA - orderB
    }
    
    // Se apenas um tem display_order, ele vem primeiro
    if (orderA !== null) return -1
    if (orderB !== null) return 1
    
    // Se nenhum tem, manter ordem original (por created_at ou id)
    return 0
  })

  // Agrupar produtos por categoria (por enquanto, todos na mesma categoria)
  const groupedProducts = {
    'all': sortedProducts
  }

  // Função para lidar com drag start
  const handleDragStart = (e: React.DragEvent, productId: string) => {
    setDraggedProduct(productId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', productId)
  }

  // Função para lidar com drag over
  const handleDragOver = (e: React.DragEvent, productId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (productId !== draggedProduct) {
      setDraggedOverProduct(productId)
    }
  }

  // Função para lidar com drag leave
  const handleDragLeave = () => {
    setDraggedOverProduct(null)
  }

  // Função para lidar com drop
  const handleDrop = async (e: React.DragEvent, targetProductId: string) => {
    e.preventDefault()
    setDraggedOverProduct(null)

    if (!draggedProduct || draggedProduct === targetProductId) {
      setDraggedProduct(null)
      return
    }

    const draggedIndex = sortedProducts.findIndex(p => p.id === draggedProduct)
    const targetIndex = sortedProducts.findIndex(p => p.id === targetProductId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedProduct(null)
      return
    }

    // Reordenar produtos
    const newProducts = [...sortedProducts]
    const [removed] = newProducts.splice(draggedIndex, 1)
    newProducts.splice(targetIndex, 0, removed)

      // Atualizar display_order de todos os produtos
      try {
        const updates = newProducts.map((product, index) => ({
          id: product.id,
          display_order: index
        }))

        // Atualizar cada produto com sua nova ordem
        // Usar uma atualização em lote se possível, ou individual
        for (const update of updates) {
          try {
            await updateProduct(update.id, { display_order: update.display_order } as any)
          } catch (err: any) {
            // Se o erro for sobre a coluna não existir, tentar criar a coluna primeiro
            if (err.message?.includes('display_order') || err.message?.includes('column')) {
              console.warn('Coluna display_order não existe ainda. Pulando atualização de ordem.')
              toast({
                title: 'Aviso',
                description: 'A coluna display_order precisa ser criada no banco de dados. Execute a migração add-display-order-to-products.sql',
                variant: 'destructive',
              })
              break
            }
            throw err
          }
        }

        toast({
          title: 'Ordem atualizada',
          description: 'A ordem dos produtos foi atualizada com sucesso.',
        })

        await refreshData()
      } catch (error: any) {
        console.error('Erro ao atualizar ordem:', error)
        toast({
          title: 'Erro ao atualizar ordem',
          description: error.message || 'Não foi possível atualizar a ordem dos produtos. Verifique se a coluna display_order existe no banco de dados.',
          variant: 'destructive',
        })
      }

    setDraggedProduct(null)
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleExpandAll = () => {
    const allCategories = Object.keys(groupedProducts)
    const allExpanded = allCategories.every(cat => expandedCategories.has(cat))
    
    if (allExpanded) {
      // Se tudo está expandido, recolher tudo
      setExpandedCategories(new Set())
    } else {
      // Se não está tudo expandido, expandir tudo
      setExpandedCategories(new Set(allCategories))
    }
  }

  // Verificar se todas as categorias estão expandidas
  const allCategoriesExpanded = Object.keys(groupedProducts).every(cat => expandedCategories.has(cat))

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Botão Novo Pacote */}
      <div className="flex justify-start">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreate}
              className="bg-white text-black hover:bg-zinc-200 text-base h-10 md:h-11 px-4 md:px-5"
            >
              <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Novo pacote</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {editingProduct
                  ? 'Atualize as informações do produto'
                  : 'Preencha os dados para criar um novo produto'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Título</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-zinc-900 border-zinc-800 text-white"
                          placeholder="Ex: Bot de Vendas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="bg-zinc-900 border-zinc-800 text-white"
                          placeholder="Descreva o produto..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Preço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="bg-zinc-900 border-zinc-800 text-white"
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="iconType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Tipo de Ícone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="bot">Bot</SelectItem>
                            <SelectItem value="shopping-cart">Carrinho</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Features (uma por linha)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        Digite cada feature em uma nova linha
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="highlight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Destaque (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-zinc-900 border-zinc-800 text-white"
                          placeholder="Ex: Mais Popular, Inovação"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-500">
                        Texto que aparecerá como badge de destaque
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo CentralCart - mostra select se gateway for CentralCart e houver produtos, senão mostra input */}
                {settings?.paymentGateway === 'CentralCart' ? (
                  <FormField
                    control={form.control}
                    name="centralCartPackageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">
                          Produto da CentralCart {settings?.centralCartApiToken ? '' : '(configure o token da API)'}
                        </FormLabel>
                        <FormControl>
                          {loadingCentralCartProducts ? (
                            <div className="flex items-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                              <span className="text-zinc-400 text-sm">Carregando produtos...</span>
                            </div>
                          ) : centralCartProducts.length > 0 ? (
                            <Select
                              value={field.value?.toString() || undefined}
                              onValueChange={(value) => {
                                if (value === 'none') {
                                  field.onChange(undefined)
                                } else {
                                  field.onChange(value ? Number(value) : undefined)
                                }
                              }}
                            >
                              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectValue placeholder="Selecione um produto da CentralCart" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                                <SelectItem value="none">Nenhum (não vincular)</SelectItem>
                                {centralCartProducts.map((product) => (
                                  <SelectItem key={product.package_id} value={product.package_id.toString()}>
                                    {product.name} {product.price ? `(R$ ${product.price.toFixed(2)})` : ''} - ID: {product.package_id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : settings?.centralCartApiToken ? (
                            <div className="space-y-2">
                              <Input
                                type="number"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="123"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={loadCentralCartProducts}
                                className="w-full"
                              >
                                <Loader2 className={`h-4 w-4 mr-2 ${loadingCentralCartProducts ? 'animate-spin' : ''}`} />
                                Carregar produtos da CentralCart
                              </Button>
                            </div>
                          ) : (
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              className="bg-zinc-900 border-zinc-800 text-white"
                              placeholder="123"
                              disabled
                            />
                          )}
                        </FormControl>
                        <FormDescription className="text-zinc-500">
                          {centralCartProducts.length > 0
                            ? 'Selecione o produto correspondente na CentralCart para vincular.'
                            : settings?.centralCartApiToken
                            ? 'A API da CentralCart não possui endpoint público para listar pacotes. Digite o Package ID manualmente (você encontra este ID no painel da CentralCart ao visualizar seus produtos).'
                            : 'Configure o Token da API da CentralCart nas Configurações para usar este recurso.'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="centralCartPackageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">CentralCart Package ID (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            className="bg-zinc-900 border-zinc-800 text-white"
                            placeholder="123"
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500">
                          ID do produto na CentralCart (package_id). Necessário apenas se usar CentralCart como gateway de pagamento.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Produto Ativo
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Exibir este produto na loja
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Upload de arquivo ZIP do bot */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Arquivo ZIP do Bot</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".zip"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                        }
                      }}
                      className="bg-zinc-900 border-zinc-800 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                    />
                    {editingProduct && selectedFile && (
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!editingProduct || !selectedFile) return;
                          setUploadingFile(editingProduct.id);
                          try {
                            const formData = new FormData();
                            formData.append('file', selectedFile);
                            formData.append('productId', editingProduct.id);

                            const { getApiUrl } = await import('@/lib/api-config');
                            const backendUrl = getApiUrl();
                            const response = await fetch(`${backendUrl}/api/products/upload-file`, {
                              method: 'POST',
                              body: formData,
                            });

                            if (!response.ok) {
                              let errorMessage = 'Erro ao fazer upload';
                              try {
                                const error = await response.json();
                                errorMessage = error.error || error.message || errorMessage;
                              } catch {
                                // Se não conseguir fazer parse do JSON, pode ser HTML
                                const text = await response.text();
                                if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                                  errorMessage = `Servidor retornou erro ${response.status}. Verifique se o servidor está rodando em ${backendUrl}`;
                                } else {
                                  errorMessage = text || `Erro ${response.status}: ${response.statusText}`;
                                }
                              }
                              throw new Error(errorMessage);
                            }

                            const result = await response.json();
                            toast({
                              title: 'Arquivo enviado!',
                              description: 'Arquivo ZIP vinculado ao produto com sucesso.',
                            });
                            setSelectedFile(null);
                            await refreshData();
                          } catch (error: any) {
                            toast({
                              title: 'Erro ao fazer upload',
                              description: error.message || 'Não foi possível fazer upload do arquivo.',
                              variant: 'destructive',
                            });
                          } finally {
                            setUploadingFile(null);
                          }
                        }}
                        disabled={uploadingFile === editingProduct.id}
                        size="sm"
                      >
                        {uploadingFile === editingProduct.id ? 'Enviando...' : 'Enviar Arquivo'}
                      </Button>
                    )}
                  </div>
                  <FormDescription className="text-zinc-500">
                    {editingProduct 
                      ? 'Faça upload do arquivo ZIP do bot para este produto. Quando o pedido for aprovado, o bot será enviado automaticamente.'
                      : 'Crie o produto primeiro, depois edite para fazer upload do arquivo ZIP.'}
                  </FormDescription>
                  {editingProduct && (editingProduct as any).bot_file_name && (
                    <p className="text-sm text-green-400">
                      ✓ Arquivo vinculado: {(editingProduct as any).bot_file_name}
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-white text-black hover:bg-zinc-200"
                  >
                    {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar pacote"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={toggleExpandAll}
          className="bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800 flex-shrink-0"
        >
          {allCategoriesExpanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Recolher tudo
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Expandir tudo
            </>
          )}
        </Button>
      </div>

      {/* Lista de produtos */}
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => {
          const isExpanded = expandedCategories.has(category)
          const categoryName = category === 'all' ? 'Todos os Produtos' : category

          return (
            <div key={category} className="border-b border-zinc-800 last:border-b-0">
              {/* Cabeçalho da categoria */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900 transition-colors cursor-pointer"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? `Recolher ${categoryName}` : `Expandir ${categoryName}`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-zinc-400" />
                  <span className="font-semibold text-white">{categoryName}</span>
                </div>
                <ChevronUp
                  className={cn(
                    'h-5 w-5 text-zinc-400 transition-transform',
                    !isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Itens da categoria */}
              {isExpanded && (
                <div className="divide-y divide-zinc-800">
                  {categoryProducts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-zinc-500">
                      Nenhum produto encontrado
                    </div>
                  ) : (
                    categoryProducts.map((product) => {
                      const isDragging = draggedProduct === product.id
                      const isDraggedOver = draggedOverProduct === product.id
                      
                      return (
                        <div
                          key={product.id}
                          onDragOver={(e) => handleDragOver(e, product.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, product.id)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors group',
                            isDragging && 'opacity-50',
                            isDraggedOver && 'border-t-2 border-blue-500'
                          )}
                        >
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, product.id)}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-white">
                              {product.title}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem
                                onClick={() => handleEdit(product)}
                                className="text-white cursor-pointer hover:bg-zinc-800"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(product.id)}
                                disabled={isDeleting === product.id}
                                className="text-red-400 cursor-pointer hover:bg-zinc-800 focus:text-red-400"
                              >
                                {isDeleting === product.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Deletar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contador total */}
      <div className="text-sm text-zinc-400 text-center py-4">
        Total de {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
