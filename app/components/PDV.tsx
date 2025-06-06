"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Smartphone,
  ShoppingCart,
  User,
  Calendar,
  Edit,
  X,
  Save,
  Eye,
  RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  unit: string;
}

interface CartItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
  itemNumber: number;
}

interface Sale {
  id: string;
  saleNumber: number;
  date: string;
  customer: string;
  seller: string;
  items: CartItem[];
  total: number;
  observations?: string;
}

export default function PDV() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);
  const [saleNumber, setSaleNumber] = useState(1);
  const [saleDate, setSaleDate] = useState("");
  const [customer, setCustomer] = useState("Cliente Padrão");
  const [seller, setSeller] = useState("Vendedor 1");
  const [isScannerDialogOpen, setIsScannerDialogOpen] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);
  const [observation, setObservation] = useState("");
  const [isViewSaleDialogOpen, setIsViewSaleDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<Html5QrcodeScanner | null>(null);
  const videoStream = useRef<MediaStream | null>(null);
  const scannerKey = useRef(0);

  useEffect(() => {
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    setSaleDate(today);

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "F1":
          e.preventDefault();
          startSale();
          break;
        case "F2":
          e.preventDefault();
          editSale();
          break;
        case "F3":
          e.preventDefault();
          searchProduct();
          break;
        case "F4":
          e.preventDefault();
          finalizeSale();
          break;
        case "F5":
          e.preventDefault();
          removeSelectedProduct();
          break;
        case "F6":
          e.preventDefault();
          cancelSale();
          break;
        case "F8":
          e.preventDefault();
          viewSale();
          break;
        case "F9":
          e.preventDefault();
          changeQuantity();
          break;
        case "F10":
          e.preventDefault();
          registerProduct();
          break;
        case "Escape":
          e.preventDefault();
          closeAllDialogs();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, salesHistory]);

  useEffect(() => {
    const checkCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("denied");
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
        setCameraPermission(permissionStatus.state);
        permissionStatus.onchange = () => setCameraPermission(permissionStatus.state);
      } catch (error) {
        console.error("Erro ao verificar permissão da câmera:", error);
        setCameraPermission("denied");
      }
    };

    if (isScannerDialogOpen) {
      checkCameraPermission();
    }
  }, [isScannerDialogOpen]);

  const stopCameraStream = () => {
    if (videoStream.current) {
      videoStream.current.getTracks().forEach((track) => track.stop());
      videoStream.current = null;
    }
  };

  useEffect(() => {
    if (isScannerDialogOpen && cameraPermission === "granted" && scannerRef.current) {
      if (scannerInstance.current) {
        scannerInstance.current.clear();
        scannerInstance.current = null;
      }
      stopCameraStream();

      try {
        scannerInstance.current = new Html5QrcodeScanner("scanner-container", {
          qrbox: { width: 250, height: 250 },
          fps: 20,
        });

        scannerInstance.current.render(
          (decodedText) => {
            handleBarcodeScan(decodedText);
            stopCameraStream();
            if (scannerInstance.current) {
              scannerInstance.current.clear();
              scannerInstance.current = null;
            }
            setIsScannerDialogOpen(false);
            scannerKey.current += 1;
            toast({ title: "Sucesso", description: "Código de barras escaneado com sucesso!" });
          },
          (error) => {
            console.error("Erro ao escanear:", error);
            toast({ title: "Erro", description: "Falha ao iniciar o scanner. Verifique as permissões.", variant: "destructive" });
          }
        );

        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            videoStream.current = stream;
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
      if (scannerInstance.current) {
        scannerInstance.current.clear();
        scannerInstance.current = null;
      }
      stopCameraStream();
    }

    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.clear();
        scannerInstance.current = null;
      }
      stopCameraStream();
    };
  }, [isScannerDialogOpen, cameraPermission]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStream.current = stream;
      setCameraPermission("granted");
    } catch (error) {
      console.error("Erro ao solicitar permissão da câmera:", error);
      setCameraPermission("denied");
      toast({ title: "Erro", description: "Permissão da câmera negada. Ative nas configurações do dispositivo.", variant: "destructive" });
    }
  };

  const fetchProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      const response = await fetch(`/api/products/${barcode}`, { method: "GET" });
      console.log("Resposta da API:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body: await response.clone().json(), // Log do corpo da resposta
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro da API:", errorText);
        toast({ title: "Erro", description: `Produto não encontrado: ${errorText || "Erro desconhecido"}`, variant: "destructive" });
        return null;
      }
      const product = await response.json();
      return product;
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      toast({ title: "Erro", description: "Falha ao buscar produto no servidor", variant: "destructive" });
      return null;
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    const product = await fetchProductByBarcode(barcode);
    if (product) {
      addToCart(product);
    }
  };

  const handleManualSearch = async () => {
    if (!searchTerm) return;
    const product = await fetchProductByBarcode(searchTerm);
    if (product) {
      addToCart(product);
      setSearchTerm("");
    } else {
      toast({ title: "Erro", description: "Produto não encontrado por código ou nome.", variant: "destructive" });
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        quantity: 1,
        unit: product.unit,
        total: product.price,
        itemNumber: cart.length + 1,
      };
      setCart([...cart, newItem]);
      setTotal(total + product.price);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: newQuantity, total: item.price * newQuantity };
      }
      return item;
    });

    setCart(updatedCart);
    setTotal(updatedCart.reduce((sum, item) => sum + item.total, 0));
  };

  const removeFromCart = (id: string) => {
    const updatedCart = cart.filter((item) => item.id !== id).map((item, index) => ({
      ...item,
      itemNumber: index + 1,
    }));
    setCart(updatedCart);
    setTotal(updatedCart.reduce((sum, item) => sum + item.total, 0));
  };

  const startSale = () => {
    setCart([]);
    setTotal(0);
    setSaleNumber(saleNumber + 1);
    setObservation("");
    toast({ title: "Venda Iniciada", description: `Venda ${saleNumber + 1} iniciada.` });
  };

  const editSale = () => {
    toast({ title: "Editar Venda", description: "Funcionalidade de edição de venda (F2)." });
  };

  const searchProduct = () => {
    setSearchTerm("");
    toast({ title: "Consultar Produto", description: "Digite o código de barras ou nome do produto para consultar (F3)." });
  };

  const finalizeSale = () => {
    if (cart.length === 0) {
      toast({ title: "Erro", description: "Carrinho vazio! Adicione produtos antes de finalizar.", variant: "destructive" });
      return;
    }

    const newSale: Sale = {
      id: Date.now().toString(),
      saleNumber,
      date: saleDate,
      customer,
      seller,
      items: cart,
      total,
      observations: observation,
    };

    setSalesHistory([...salesHistory, newSale]);
    setCart([]);
    setTotal(0);
    setObservation("");
    setSaleNumber(saleNumber + 1);
    toast({ title: "Venda Finalizada", description: `Venda ${saleNumber} finalizada com sucesso!` });
  };

  const removeSelectedProduct = () => {
    if (cart.length > 0) {
      const lastItem = cart[cart.length - 1];
      removeFromCart(lastItem.id);
      toast({ title: "Produto Removido", description: `Produto ${lastItem.name} removido do carrinho (F5).` });
    } else {
      toast({ title: "Erro", description: "Carrinho vazio!", variant: "destructive" });
    }
  };

  const cancelSale = () => {
    setCart([]);
    setTotal(0);
    setObservation("");
    toast({ title: "Venda Cancelada", description: `Venda ${saleNumber} cancelada (F6).` });
  };

  const viewSale = () => {
    if (salesHistory.length > 0) {
      setIsViewSaleDialogOpen(true);
    } else {
      toast({ title: "Erro", description: "Nenhuma venda registrada!", variant: "destructive" });
    }
  };

  const changeQuantity = () => {
    if (cart.length > 0) {
      const lastItem = cart[cart.length - 1];
      const newQuantity = prompt("Digite a nova quantidade:", lastItem.quantity.toString());
      if (newQuantity && !isNaN(Number(newQuantity))) {
        updateQuantity(lastItem.id, Number(newQuantity));
        toast({ title: "Quantidade Alterada", description: `Quantidade de ${lastItem.name} alterada para ${newQuantity} (F9).` });
      }
    } else {
      toast({ title: "Erro", description: "Carrinho vazio!", variant: "destructive" });
    }
  };

  const registerProduct = () => {
    toast({ title: "Cadastrar Produto", description: "Funcionalidade de cadastro de produto (F10)." });
  };

  const closeAllDialogs = () => {
    setIsScannerDialogOpen(false);
    setIsObservationDialogOpen(false);
    setIsViewSaleDialogOpen(false);
    toast({ title: "Ação Cancelada", description: "Diálogos fechados (Esc)." });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ponto de Venda (PDV)</h1>
        <p className="text-gray-600">Sistema de vendas integrado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações da Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Número da Venda</Label>
                  <Input value={saleNumber} readOnly />
                </div>
                <div>
                  <Label>Data da Venda</Label>
                  <Input value={saleDate} readOnly />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
                </div>
                <div>
                  <Label>Vendedor</Label>
                  <Input value={seller} onChange={(e) => setSeller(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Busca de Produto</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Digite código de barras ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                    className="pl-10"
                  />
                </div>
                <Dialog open={isScannerDialogOpen} onOpenChange={setIsScannerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Scan className="w-4 h-4 mr-2" />
                      Scanner
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
                      <div key={scannerKey.current}>
                        <div
                          ref={scannerRef}
                          id="scanner-container"
                          className="w-full h-[50vh] max-h-96 border border-gray-300"
                        />
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Carrinho de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
  <thead>
    <tr className="border-b">
      <th className="text-left p-2">Item</th>
      <th className="text-left p-2">Descrição</th>
      <th className="text-left p-2">Código</th>
      <th className="text-left p-2">Qtde</th>
      <th className="text-left p-2">Un</th>
      <th className="text-left p-2">Preço</th>
      <th className="text-left p-2">Total</th>
      <th className="text-left p-2">Ações</th>
    </tr>
  </thead>
  <tbody>
    {cart.length === 0 ? (
      <tr>
        <td colSpan={8} className="text-gray-500 text-center py-8">
          Carrinho vazio
        </td>
      </tr>
    ) : (
      cart.map((item) => (
        <tr key={item.id} className="border-b hover:bg-gray-50">
          <td className="p-2">{item.itemNumber}</td>
          <td className="p-2">{item.name}</td>
          <td className="p-2">{item.barcode}</td>
          <td className="p-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </td>
          <td className="p-2">{item.unit}</td>
          <td className="p-2">R$ {item.price ? item.price.toFixed(2) : "0.00"}</td>
          <td className="p-2">R$ {item.total ? item.total.toFixed(2) : "0.00"}</td>
          <td className="p-2">
            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>
                </div>
              </div>

              {cart.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Total Geral:</span>
                    <span className="text-2xl font-bold text-green-600">R$ {total.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" size="lg" onClick={finalizeSale}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Finalizar (F4)
                    </Button>
                    <Button variant="outline" className="w-full" size="lg" onClick={() => setIsObservationDialogOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Observação
                    </Button>
                    <Button variant="outline" className="w-full" size="lg" onClick={cancelSale}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar (F6)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Observação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Observação</Label>
            <Input value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Digite uma observação..." />
            <Button onClick={() => setIsObservationDialogOpen(false)}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewSaleDialogOpen} onOpenChange={setIsViewSaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Localizar Venda (F8)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Histórico de Vendas</Label>
            <div className="max-h-96 overflow-y-auto">
              {salesHistory.map((sale) => (
                <div
                  key={sale.id}
                  className="border rounded-lg p-4 mb-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  <p>Venda #{sale.saleNumber} - {sale.date}</p>
                  <p>Total: R$ {sale.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
            {selectedSale && (
              <div className="mt-4">
                <h3 className="font-bold">Detalhes da Venda #{selectedSale.saleNumber}</h3>
                <p>Data: {selectedSale.date}</p>
                <p>Cliente: {selectedSale.customer}</p>
                <p>Vendedor: {selectedSale.seller}</p>
                <p>Observação: {selectedSale.observations || "Nenhuma"}</p>
                <div className="mt-2">
                  <h4 className="font-medium">Itens</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item</th>
                        <th className="text-left p-2">Descrição</th>
                        <th className="text-left p-2">Qtde</th>
                        <th className="text-left p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2">{item.itemNumber}</td>
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2">R$ {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}