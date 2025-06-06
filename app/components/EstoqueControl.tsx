"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Camera,
  RefreshCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  barcode?: string;
  categoryId: string;
  category: Category;
  supplierId: string;
  supplier: Supplier;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  salePrice: number;
  isActive: boolean;
  status: "NORMAL" | "LOW" | "OUT";
}

export default function EstoqueControl() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerDialogOpen, setIsScannerDialogOpen] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [scannerKey, setScannerKey] = useState(0); // Forçar recriação do elemento
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    categoryId: "",
    supplierId: "",
    stockQuantity: "0",
    minStock: "0",
    maxStock: "0",
    costPrice: "0",
    salePrice: "0",
  });

  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<Html5QrcodeScanner | null>(null);
  const videoStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  // Verificar permissão da câmera ao abrir o diálogo do scanner
  useEffect(() => {
    const checkCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("denied");
        console.log("Câmera não suportada ou navigator.mediaDevices indisponível.");
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
        console.log("Permissão da câmera:", permissionStatus.state);
        setCameraPermission(permissionStatus.state);
        permissionStatus.onchange = () => {
          console.log("Permissão da câmera alterada para:", permissionStatus.state);
          setCameraPermission(permissionStatus.state);
        };
      } catch (error) {
        console.error("Erro ao verificar permissão da câmera:", error);
        setCameraPermission("denied");
      }
    };

    if (isScannerDialogOpen) {
      checkCameraPermission();
    }
  }, [isScannerDialogOpen]);

  // Liberar recursos da câmera ao fechar o diálogo
  const stopCameraStream = () => {
    if (videoStream.current) {
      console.log("Parando stream de vídeo da câmera...");
      videoStream.current.getTracks().forEach((track) => track.stop());
      videoStream.current = null;
    }
  };

  // Inicializar o scanner se a permissão for concedida
  useEffect(() => {
    if (isScannerDialogOpen && cameraPermission === "granted" && scannerRef.current) {
      console.log("Inicializando scanner...");
      // Limpar instância anterior, se existir
      if (scannerInstance.current) {
        console.log("Limpando instância anterior do scanner...");
        scannerInstance.current.clear();
        scannerInstance.current = null;
      }

      // Parar qualquer stream de vídeo ativo
      stopCameraStream();

      try {
        scannerInstance.current = new Html5QrcodeScanner("scanner-container", {
          qrbox: { width: 250, height: 250 },
          fps: 20,
        }, false); // Add verbose argument (e.g., false for non-verbose mode)

        scannerInstance.current.render(
          (decodedText) => {
            console.log("Código de barras escaneado:", decodedText);
            setFormData({ ...formData, barcode: decodedText });
            stopCameraStream();
            if (scannerInstance.current) {
              scannerInstance.current.clear();
              scannerInstance.current = null;
            }
            setIsScannerDialogOpen(false);
            setScannerKey((prev) => prev + 1); // Forçar recriação do elemento
            toast({ title: "Sucesso", description: "Código de barras escaneado com sucesso!" });
          },
          (error) => {
            console.error("Erro ao escanear:", error);
            toast({ title: "Erro", description: "Falha ao iniciar o scanner. Verifique as permissões.", variant: "destructive" });
          }
        );

        // Acessar o stream de vídeo para armazená-lo e liberá-lo depois
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            videoStream.current = stream;
            console.log("Stream de vídeo iniciado com sucesso.");
          })
          .catch((err) => {
            console.error("Erro ao acessar a câmera:", err);
            toast({ title: "Erro", description: "Não foi possível acessar a câmera.", variant: "destructive" });
          });
      } catch (error) {
        console.error("Erro ao inicializar o scanner:", error);
        toast({ title: "Erro", description: "Falha ao inicializar o scanner. Tente novamente.", variant: "destructive" });
      }
    } else if (!isScannerDialogOpen) {
      console.log("Fechando diálogo: limpando scanner e câmera...");
      if (scannerInstance.current) {
        scannerInstance.current.clear();
        scannerInstance.current = null;
      }
      stopCameraStream();
    }

    // Função de cleanup para garantir que o scanner e a câmera sejam liberados
    return () => {
      console.log("Executando cleanup do useEffect...");
      if (scannerInstance.current) {
        scannerInstance.current.clear();
        scannerInstance.current = null;
      }
      stopCameraStream();
    };
  }, [isScannerDialogOpen, cameraPermission, formData]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStream.current = stream;
      setCameraPermission("granted");
      console.log("Permissão da câmera concedida.");
    } catch (error) {
      console.error("Erro ao solicitar permissão da câmera:", error);
      setCameraPermission("denied");
      toast({ title: "Erro", description: "Permissão da câmera negada. Ative nas configurações do dispositivo.", variant: "destructive" });
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast({ title: "Erro", description: "Falha ao carregar produtos", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar produtos", variant: "destructive" });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast({ title: "Erro", description: "Falha ao carregar categorias", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar categorias", variant: "destructive" });
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        toast({ title: "Erro", description: "Falha ao carregar fornecedores", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar fornecedores", variant: "destructive" });
    }
  };

  const generateBarcode = async () => {
    let newBarcode;
    let isUnique = false;

    while (!isUnique) {
      newBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      const response = await fetch(`/api/products/check-barcode?barcode=${newBarcode}`);
      if (response.ok) {
        const { exists } = await response.json();
        isUnique = !exists;
      } else {
        toast({ title: "Erro", description: "Falha ao verificar código de barras", variant: "destructive" });
        return;
      }
    }

    setFormData({ ...formData, barcode: newBarcode || "" });
    toast({ title: "Sucesso", description: "Código de barras gerado com sucesso!" });
  };

  const validateBarcode = async (barcode: string) => {
    if (!barcode || editingProduct?.barcode === barcode) return true;
    const response = await fetch(`/api/products/check-barcode?barcode=${barcode}`);
    if (response.ok) {
      const { exists } = await response.json();
      if (exists) {
        toast({ title: "Erro", description: "Código de barras já existe!", variant: "destructive" });
        return false;
      }
      return true;
    }
    toast({ title: "Erro", description: "Falha ao verificar código de barras", variant: "destructive" });
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isBarcodeValid = await validateBarcode(formData.barcode);
    if (!isBarcodeValid) return;

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          stockQuantity: parseInt(formData.stockQuantity),
          minStock: parseInt(formData.minStock),
          maxStock: parseInt(formData.maxStock),
          costPrice: parseFloat(formData.costPrice),
          salePrice: parseFloat(formData.salePrice),
        }),
      });
      if (response.ok) {
        await fetchProducts();
        setIsDialogOpen(false);
        setEditingProduct(null);
        setFormData({
          name: "",
          barcode: "",
          categoryId: "",
          supplierId: "",
          stockQuantity: "0",
          minStock: "0",
          maxStock: "0",
          costPrice: "0",
          salePrice: "0",
        });
        toast({
          title: "Sucesso",
          description: editingProduct ? "Produto atualizado" : "Produto criado",
        });
      } else {
        toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      stockQuantity: product.stockQuantity.toString(),
      minStock: product.minStock.toString(),
      maxStock: product.maxStock.toString(),
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/products/by-id/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchProducts();
        toast({ title: "Sucesso", description: "Produto deletado" });
      } else {
        toast({ title: "Erro", description: "Falha ao deletar produto", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao deletar produto", variant: "destructive" });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: Product["status"]) => {
    switch (status) {
      case "LOW":
        return <Badge variant="destructive">Estoque Baixo</Badge>;
      case "OUT":
        return <Badge variant="destructive">Sem Estoque</Badge>;
      default:
        return <Badge variant="default">Normal</Badge>;
    }
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.status === "LOW").length;
  const outOfStockProducts = products.filter((p) => p.status === "OUT").length;
  const totalValue = products.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Controle de Estoque</h1>
      <p className="text-gray-600 mb-6">Gestão completa do inventário</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">R$ {totalValue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Código de Barras</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="Digite ou escaneie um código de barras"
                      />
                      <Dialog open={isScannerDialogOpen} onOpenChange={setIsScannerDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline">
                            <Camera className="w-4 h-4 mr-2" />
                            Escanear
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Escanear Código de Barras</DialogTitle>
                          </DialogHeader>
                          {cameraPermission === "denied" ? (
                            <div className="space-y-2">
                              <p className="text-red-600">
                                A câmera não está disponível. Verifique se o dispositivo tem uma câmera e se a permissão foi concedida.
                              </p>
                              <Button onClick={requestCameraPermission}>Solicitar Permissão</Button>
                            </div>
                          ) : cameraPermission === "prompt" ? (
                            <div className="space-y-2">
                              <p>Permissão para a câmera não foi concedida. Clique para solicitar.</p>
                              <Button onClick={requestCameraPermission}>Solicitar Permissão</Button>
                            </div>
                          ) : (
                            <div key={scannerKey}>
                              <div
                                ref={scannerRef}
                                id="scanner-container"
                                className="w-full h-[50vh] max-h-96 border border-gray-300"
                              ></div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button type="button" variant="outline" onClick={generateBarcode}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Gerar
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Selecione</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Fornecedor</Label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Selecione</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Estoque</Label>
                    <Input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Estoque Mínimo</Label>
                    <Input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Estoque Máximo</Label>
                    <Input
                      type="number"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Preço de Custo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Preço de Venda</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Estoque</th>
                  <th className="text-left p-2">Preço Custo</th>
                  <th className="text-left p-2">Preço Venda</th>
                  <th className="text-left p-2">Fornecedor</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{product.name}</td>
                    <td className="p-2">{product.category.name}</td>
                    <td className="p-2">
                      <span
                        className={
                          product.stockQuantity <= product.minStock
                            ? "text-red-600 font-bold"
                            : "text-green-600 font-bold"
                        }
                      >
                        {product.stockQuantity}
                      </span>{" "}
                      / {product.maxStock}
                    </td>
                    <td className="p-2">R$ {product.costPrice.toFixed(2)}</td>
                    <td className="p-2">R$ {product.salePrice.toFixed(2)}</td>
                    <td className="p-2">{product.supplier.name}</td>
                    <td className="p-2">{getStatusBadge(product.status)}</td>
                    <td className="p-2 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}