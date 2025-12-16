import { useState } from 'react'
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
import { Bot, ShoppingCart, DollarSign, Activity, Plus, Edit, Trash2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { Product } from '@/types'

const productSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  features: z.string().min(1, 'Adicione pelo menos uma feature'),
  active: z.boolean().default(true),
  highlight: z.string().optional(),
  iconType: z.enum(['shopping-cart', 'bot']).optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export function ProductManager() {
  const { products, updateProduct, createProduct, deleteProduct, refreshData } = useAppStore()
  const { toast } = useToast()
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Produtos</h2>
          <p className="text-zinc-400">Gerencie seus produtos e preços</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreate}
              className="bg-white text-black hover:bg-zinc-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
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

      <div className="grid gap-6 lg:grid-cols-2">
        {products.map((product) => {
          const Icon = product.iconType === 'shopping-cart' ? ShoppingCart : Bot
          return (
            <Card key={product.id} className="bg-zinc-950 border-zinc-800">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    {product.title}
                    {product.active ? (
                      <Badge className="bg-green-900/30 text-green-400 border-green-900 hover:bg-green-900/50">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                    {product.highlight && (
                      <Badge className="bg-blue-900/30 text-blue-400 border-blue-900">
                        {product.highlight}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {product.description}
                  </CardDescription>
                </div>
                <div className="flex items-start gap-2">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                    <Icon className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={isDeleting === product.id}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400"
                    >
                      {isDeleting === product.id ? (
                        <X className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 pt-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                    <div className="space-y-0.5">
                      <Label className="text-base text-white flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Disponibilidade
                      </Label>
                      <div className="text-sm text-zinc-500">
                        Exibir este produto na loja
                      </div>
                    </div>
                    <Switch
                      checked={product.active}
                      onCheckedChange={(checked) =>
                        handleActiveChange(product.id, checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Preço Mensal (R$)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={product.price}
                      onChange={(e) =>
                        handlePriceChange(product.id, e.target.value)
                      }
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Features</Label>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                      <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                        {product.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
