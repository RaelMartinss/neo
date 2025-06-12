"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
// import { useAuth } from "../components/AuthWrapper"; // Ajuste o caminho se necessário
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { useAuth } from "../contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  salePrice: number;
  isActive: boolean;
  status: "NORMAL" | "LOW" | "OUT";
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  barcode: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  productId?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FetchUsersResponse {
  users: User[];
}

export default function PDV() {
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [saleNumber, setSaleNumber] = useState<number | null>(null);
  const [saleDate, setSaleDate] = useState(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));
  const [client, setClient] = useState("CLIENTE PADRÃO");
  const [seller, setSeller] = useState("Loja");
  const [saleInitiated, setSaleInitiated] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [cpfUsuario, setCpfUsuario] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotaFiscalModal, setShowNotaFiscalModal] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastScanTime = useRef<number>(0);
  const lastBarcode = useRef<string | null>(null);

  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users", {
          credentials: "include",
        });

        if (response.ok) {
          const data: FetchUsersResponse = await response.json();
          console.log("Usuários recebidos:", data.users);
          if (data.users.length > 0) {
            setUserId(data.users[0].id);
          }
        } else {
          console.error("Erro na resposta da API:", response.status);
        }
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("https://www.soundjay.com/buttons/beep-01a.mp3");
  }, []);

  const initiateSale = async () => {
    if (!userId || isLoading || authLoading) {
      toast({ title: "Erro", description: "Usuário não autenticado ou carregando. Faça login.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch("/api/sales/initiate", { method: "POST" });
      const data = await response.json();
      if (data.saleNumber) {
        setSaleNumber(data.saleNumber);
        setSaleInitiated(true);
        setShowCpfModal(true);
        toast({ title: "Sucesso", description: `Venda iniciada com número ${data.saleNumber}` });
      } else if (data.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao iniciar venda:", error);
      toast({ title: "Erro", description: "Falha ao iniciar venda.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isScanning && !scannerRef.current && saleInitiated) {
      const calculateQrBoxSize = () => {
        const width = Math.max(window.innerWidth * 0.5, 300);
        return { width, height: width };
      };

      const { width, height } = calculateQrBoxSize();
      const scanner = new Html5QrcodeScanner("scanner-container", { fps: 10, qrbox: { width, height } }, false);
      scanner.render(
        async (decodedText) => {
          const barcode = decodedText.trim();
          const currentTime = Date.now();
          if (lastBarcode.current === barcode && currentTime - lastScanTime.current < 500) return;

          lastBarcode.current = barcode;
          lastScanTime.current = currentTime;

          const product = await fetchProductByBarcode(barcode);
          if (product && saleInitiated) {
            addToCart(product, barcode, "UN");
            if (audioRef.current) audioRef.current.play().catch((error) => console.warn("Erro ao reproduzir som:", error));
          } else if (!saleInitiated) {
            toast({ title: "Aviso", description: "Inicie uma venda antes de adicionar produtos.", variant: "warning" });
          } else {
            toast({ title: "Erro", description: `Produto com código ${barcode} não encontrado`, variant: "destructive" });
          }
        },
        (error) => {
          console.warn("Erro ao escanear:", error);
          toast({ title: "Erro", description: "Falha ao acessar a câmera. Verifique as permissões.", variant: "destructive" });
        }
      );
      scannerRef.current = scanner;

      const handleResize = () => {
        if (scannerRef.current) {
          scannerRef.current.clear();
          const { width, height } = calculateQrBoxSize();
          scannerRef.current = new Html5QrcodeScanner("scanner-container", { fps: 10, qrbox: { width, height } }, false);
          scannerRef.current.render(
            async (decodedText) => {
              const barcode = decodedText.trim();
              const currentTime = Date.now();
              if (lastBarcode.current === barcode && currentTime - lastScanTime.current < 500) return;

              lastBarcode.current = barcode;
              lastScanTime.current = currentTime;

              const product = await fetchProductByBarcode(barcode);
              if (product && saleInitiated) {
                addToCart(product, barcode, "UN");
                if (audioRef.current) audioRef.current.play().catch((error) => console.warn("Erro ao reproduzir som:", error));
              } else if (!saleInitiated) {
                toast({ title: "Aviso", description: "Inicie uma venda antes de adicionar produtos.", variant: "warning" });
              } else {
                toast({ title: "Erro", description: `Produto com código ${barcode} não encontrado`, variant: "destructive" });
              }
            },
            (error) => console.warn("Erro ao escanear:", error)
          );
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (scannerRef.current) scannerRef.current.clear();
      };
    } else if (!isScanning && scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  }, [isScanning, saleInitiated]);

  const fetchProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      const response = await fetch(`/api/products/${barcode}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status === 404) {
        return null;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  const addToCart = (product: Product, barcode: string, unit: string) => {
    if (!saleInitiated) {
      toast({ title: "Aviso", description: "Inicie uma venda antes de adicionar produtos.", variant: "warning" });
      return;
    }
    const productId = product.id;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.barcode === barcode);
      if (existingItem) {
        return prevCart.map((item) =>
          item.barcode === barcode ? { ...item, quantity: item.quantity + 1, productId } : item
        );
      }
      return [...prevCart, { barcode, name: product.name, quantity: 1, price: product.salePrice, unit, productId }];
    });
    setTotal((prevTotal) => prevTotal + product.salePrice);
  };

  const removeFromCart = (barcode: string, price: number) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item.barcode === barcode);
      if (item && item.quantity > 1) {
        return prevCart.map((item) =>
          item.barcode === barcode ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevCart.filter((item) => item.barcode !== barcode);
    });
    setTotal((prevTotal) => prevTotal - price);
  };

  const saveSale = async () => {
    console.log("Tentando salvar venda. Estados:", { saleNumber, cartLength: cart.length, userId, tipoPagamento });
    if (!saleNumber || cart.length === 0 || !userId) {
      toast({ title: "Erro", description: "Nenhuma venda iniciada, carrinho vazio ou usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (!tipoPagamento) {
      setShowPaymentModal(true); // Abre o modal de pagamento
      return; // Pausa até a seleção
    }

    try {
      const response = await fetch("/api/sales/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleNumber,
          userId,
          totalAmount: total,
          cpfUsuario: cpfUsuario || null,
          tipoPagamento,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });
      const data = await response.json();
      if (data.message) {
        toast({ title: "Sucesso", description: data.message });
        setShowNotaFiscalModal(true);
        setCart([]);
        setTotal(0);
        setIsScanning(false);
        setSaleInitiated(false);
        setSaleNumber(null);
        setCpfUsuario("");
        setTipoPagamento(null);
      } else if (data.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
      toast({ title: "Erro", description: "Falha ao salvar venda.", variant: "destructive" });
    }
  };

  const handleScannerToggle = () => {
    if (!saleInitiated && !isConsulting) {
      toast({ title: "Aviso", description: "Inicie uma venda antes de usar o scanner.", variant: "warning" });
      return;
    }
    setIsScanning((prev) => !prev);
  };

  const [isConsulting, setIsConsulting] = useState(false);
  const handleConsultProduct = async () => {
    setIsConsulting(true);
    if (!barcodeInput.trim()) {
      toast({ title: "Erro", description: "Digite um código de barras válido.", variant: "destructive" });
      setIsConsulting(false);
      return;
    }
    const product = await fetchProductByBarcode(barcodeInput);
    if (product) {
      toast({ title: "Sucesso", description: `Produto: ${product.name}, Preço: R$${product.salePrice.toFixed(2)}` });
    } else {
      toast({ title: "Erro", description: `Produto com código ${barcodeInput} não encontrado`, variant: "destructive" });
    }
    setBarcodeInput("");
    setIsConsulting(false);
  };

  const handleManualBarcode = () => {
    if (!saleInitiated && !isConsulting) {
      toast({ title: "Aviso", description: "Inicie uma venda antes de adicionar produtos.", variant: "warning" });
      return;
    }

    const currentTime = Date.now();
    if (lastBarcode.current === barcodeInput && currentTime - lastScanTime.current < 500) return;

    lastBarcode.current = barcodeInput;
    lastScanTime.current = currentTime;

    fetchProductByBarcode(barcodeInput).then((product) => {
      if (product) {
        if (saleInitiated && !isConsulting) {
          addToCart(product, barcodeInput, "UN");
          if (audioRef.current) audioRef.current.play().catch((error) => console.warn("Erro ao reproduzir som:", error));
        } else if (isConsulting) {
          toast({ title: "Sucesso", description: `Produto: ${product.name}, Preço: R$${product.salePrice.toFixed(2)}` });
        }
      } else {
        toast({ title: "Erro", description: `Produto com código ${barcodeInput} não encontrado`, variant: "destructive" });
      }
      setBarcodeInput("");
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "F1":
        initiateSale();
        break;
      case "F2":
        toast({ title: "Ação", description: "Alterar Venda" });
        break;
      case "F3":
        handleConsultProduct();
        break;
      case "F4":
        saveSale();
        break;
      case "F5":
        toast({ title: "Ação", description: "Excluir Produto" });
        break;
      case "F6":
        setCart([]);
        setTotal(0);
        setIsScanning(false);
        setSaleInitiated(false);
        setSaleNumber(null);
        setCpfUsuario("");
        setTipoPagamento(null);
        toast({ title: "Ação", description: "Cancelar Venda" });
        break;
      case "F8":
        toast({ title: "Ação", description: "Localizar Venda" });
        break;
      case "F9":
        toast({ title: "Ação", description: "Alterar Quantidade" });
        break;
      case "F10":
        toast({ title: "Ação", description: "Observações" });
        break;
      case "Escape":
        setIsScanning(false);
        setShowCpfModal(false);
        setShowPaymentModal(false);
        setShowNotaFiscalModal(false);
        toast({ title: "Ação", description: "Fechar" });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleKeyDownListener = (e: KeyboardEvent) => handleKeyDown(e);
    document.addEventListener("keydown", handleKeyDownListener);
    return () => document.removeEventListener("keydown", handleKeyDownListener);
  }, []);

  const handleCpfSubmit = (includeCpf: boolean) => {
    if (includeCpf && !cpfUsuario) {
      if (!/^\d{11}$/.test(cpfUsuario)) {
        toast({ title: "Erro", description: "CPF inválido. Digite 11 dígitos.", variant: "destructive" });
        return;
      }
    }
    setShowCpfModal(false);
  };

  const handlePaymentSubmit = (paymentType: string) => {
    console.log("Selecionado tipo de pagamento:", paymentType); // Depuração
    setTipoPagamento(paymentType);
    setShowPaymentModal(false);
  };

  const handleNotaFiscalSubmit = (printNota: boolean) => {
    if (printNota) {
      const notaFiscal = {
        saleNumber,
        date: saleDate,
        client,
        seller,
        total,
        items: cart,
        cpfUsuario,
        tipoPagamento,
      };
      console.log("Nota Fiscal a ser impressa:", notaFiscal);
      alert(`Nota Fiscal impressa para venda #${saleNumber}`);
    }
    setShowNotaFiscalModal(false);
  };

  return (
    <div className="p-6" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <span>Nº Venda: {saleNumber ?? "Não iniciada"}</span> |{' '}
          <span>Data Venda: {saleDate}</span> |{' '}
          <span>Cliente: {client}</span>
        </div>
        <div>
          <span>Vendedor: {seller}</span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>TECLADO + MOUSE</CardTitle>
          <div className="flex gap-2">
            <Button type="button" onClick={handleScannerToggle} disabled={!saleInitiated && !isConsulting}>
              {isScanning ? "Parar Scanner" : "Iniciar Scanner"}
            </Button>
            <Button onClick={saveSale} disabled={cart.length === 0 || !saleNumber || !tipoPagamento}>
              Finalizar Venda
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isScanning && (
            <div className="mb-4">
              <div id="scanner-container" className="w-full h-96 border border-gray-300 bg-gray-100"></div>
            </div>
          )}
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Digite o código de barras"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualBarcode()}
              disabled={!saleInitiated && !isConsulting}
            />
            <Button onClick={handleManualBarcode} disabled={!saleInitiated && !isConsulting}>
              Adicionar
            </Button>
          </div>
          <table className="w-full mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Itens</th>
                <th className="p-2 text-left">Código de Barras</th>
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-center">Un</th>
                <th className="p-2 text-center">Qtd</th>
                <th className="p-2 text-right">Vr. Unit</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={item.barcode} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{item.barcode}</td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 text-center">{item.unit}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                  <td className="p-2 text-right">{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={5} className="p-2 text-right">TOTAL GERAL</td>
                <td colSpan={2} className="p-2 text-right">{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <span>Preço Venda: R${total.toFixed(2)}</span>
            <span>nº Itens: {cart.length}</span>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-around mt-4">
        <Button className="bg-blue-500 text-white" onClick={initiateSale}>F1 Iniciar Venda</Button>
        <Button className="bg-orange-500 text-white" onClick={() => toast({ title: "Ação", description: "Alterar Venda" })}>F2 Alterar Venda</Button>
        <Button className="bg-red-500 text-white" onClick={handleConsultProduct}>F3 Consultar Produto</Button>
        <Button className="bg-gray-300" onClick={saveSale} disabled={cart.length === 0 || !saleNumber || !tipoPagamento}>
          F4 Finalizar Venda
        </Button>
        <Button className="bg-gray-300" onClick={() => toast({ title: "Ação", description: "Excluir Produto" })}>F5 Excluir Produto</Button>
        <Button className="bg-gray-300" onClick={() => { setCart([]); setTotal(0); setIsScanning(false); setSaleInitiated(false); setSaleNumber(null); setCpfUsuario(""); setTipoPagamento(null); toast({ title: "Ação", description: "Cancelar Venda" }); }}>F6 Cancelar Venda</Button>
        <Button className="bg-gray-300" onClick={() => toast({ title: "Ação", description: "Localizar Venda" })}>F8 Localizar Venda</Button>
        <Button className="bg-gray-300" onClick={() => toast({ title: "Ação", description: "Alterar Quantidade" })}>F9 Alterar Quantidade</Button>
        <Button className="bg-gray-300" onClick={() => toast({ title: "Ação", description: "Observações" })}>F10 Observações</Button>
        <Button className="bg-red-500 text-white" onClick={() => { setIsScanning(false); setShowCpfModal(false); setShowPaymentModal(false); setShowNotaFiscalModal(false); toast({ title: "Ação", description: "Fechar" }); }}>Esc Fechar</Button>
      </div>

      {/* Modal para CPF */}
      {showCpfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Incluir CPF na Nota Fiscal?</h2>
            <div className="flex gap-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setShowCpfModal(false);
                  setCpfUsuario("");
                }}
              >
                Não
              </button>
              <div>
                <Input
                  type="text"
                  placeholder="Digite o CPF (11 dígitos)"
                  value={cpfUsuario}
                  onChange={(e) => setCpfUsuario(e.target.value)}
                  maxLength={11}
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                  onClick={() => handleCpfSubmit(true)}
                  disabled={!/^\d{11}$/.test(cpfUsuario)}
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Tipo de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Selecione o Tipo de Pagamento</h2>
            <div className="flex flex-col gap-2">
              {["PIX", "CREDITO", "DEBITO", "DINHEIRO"].map((type) => (
                <button
                  key={type}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => handlePaymentSubmit(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nota Fiscal */}
      {showNotaFiscalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Deseja a Nota Fiscal?</h2>
            <div className="flex gap-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => handleNotaFiscalSubmit(false)}
              >
                Não
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={() => handleNotaFiscalSubmit(true)}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}