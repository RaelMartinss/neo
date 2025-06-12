import { PrismaClient, UserRole } from '@prisma/client'
import { hashPassword } from "../lib/auth"
import { assignDefaultPermissions } from "../lib/permissions"


const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");
  console.log("Prisma Client initialized. Checking models...");

  // Verificar se os modelos Prisma existem
  if (!prisma.customer) {
    throw new Error("prisma.customers is undefined. Verifique se o modelo Customer está definido em schema.prisma e se 'npx prisma generate' foi executado.");
  }
  if (!prisma.sale) {
    throw new Error("prisma.sales is undefined. Verifique se o modelo Sale está definido em schema.prisma e se 'npx prisma generate' foi executado.");
  }
  if (!prisma.saleItem) {
    throw new Error("prisma.sale_items is undefined. Verifique se o modelo SaleItem está definido em schema.prisma e se 'npx prisma generate' foi executado.");
  }
  if (!prisma.expense) {
    throw new Error("prisma.expenses is undefined. Verifique se o modelo Expense está definido em schema.prisma e se 'npx prisma generate' foi executado.");
  }
  console.log("All required Prisma models are available.");

  const users = [
    {
      name: "Admin Sistema Empresa",
      email: "adminEmpresa@empresa.com",
      password: "FullErpNeo@2",
      role: UserRole.ADMIN,
    },
    {
      name: "Admin Sistema",
      email: "admin@empresa.com",
      password: "admin123",
      role: UserRole.ADMIN,
    },
    {
      name: "João Gerente",
      email: "gerente@empresa.com",
      password: "gerente123",
      role: UserRole.MANAGER,
    },
    {
      name: "Maria Operadora",
      email: "operadora@empresa.com",
      password: "operadora123",
      role: UserRole.CASHIER,
    },
    {
      name: "Carlos Estoque",
      email: "estoque@empresa.com",
      password: "estoque123",
      role: UserRole.STOCK_MANAGER,
    },
  ]

  // Seed Categories
  const categories = [
    { name: "Bebidas" },
    { name: "Padaria" },
    { name: "Laticínios" },
    { name: "Grãos" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`Seeded category: ${category.name}`);
  }

  // Seed Suppliers
  const suppliers = [
    { name: "Fornecedor A", cnpj: "12.345.678/0001-01" },
    { name: "Fornecedor B", cnpj: "98.765.432/0001-02" },
    { name: "Fornecedor C", cnpj: "56.789.123/0001-03" },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { cnpj: supplier.cnpj },
      update: {},
      create: {
        name: supplier.name,
        cnpj: supplier.cnpj,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`Seeded supplier: ${supplier.name}`);
  }

  // Seed Customers
  const customers = [
    { name: "João Silva", email: "joao.silva@example.com", phone: "555-456-7890" },
    { name: "Maria Santos", email: "maria.santos@example.com", phone: "555-456-7891" },
    { name: "Pedro Almeida", email: "pedro.almeida@example.com", phone: "555-456-7892" },
    { name: "Ana Oliveira", email: "ana.oliveira@example.com", phone: "555-456-7893" },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`Seeded customer: ${customer.name}`);
  }

  // Seed Products
  const products = [
    {
      name: "Coca-Cola 350ml",
      barcode: "1234567890",
      category: "Bebidas",
      supplier: "Fornecedor A",
      costPrice: 2.5,
      salePrice: 5.0,
      stockQuantity: 120,
      minStock: 50,
    },
    {
      name: "Pão de Leite 500g",
      barcode: "0987654321",
      category: "Padaria",
      supplier: "Fornecedor B",
      costPrice: 3.0,
      salePrice: 3.2,
      stockQuantity: 15,
      minStock: 20,
    },
    {
      name: "Leite Integral 1L",
      barcode: "1122334455",
      category: "Laticínios",
      supplier: "Fornecedor A",
      costPrice: 4.0,
      salePrice: 5.8,
      stockQuantity: 45,
      minStock: 30,
    },
    {
      name: "Arroz Branco 5kg",
      barcode: "5544332211",
      category: "Grãos",
      supplier: "Fornecedor C",
      costPrice: 15.0,
      salePrice: 18.9,
      stockQuantity: 25,
      minStock: 10,
    },
  ];

  for (const product of products) {
    const category = await prisma.category.findFirst({ where: { name: product.category } });
    const supplier = await prisma.supplier.findFirst({ where: { name: product.supplier } });

    if (!category) {
      throw new Error(`Categoria '${product.category}' não encontrada.`);
    }
    if (!supplier) {
      throw new Error(`Fornecedor '${product.supplier}' não encontrado.`);
    }

    await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: {},
      create: {
        name: product.name,
        barcode: product.barcode,
        categoryId: category.id,
        supplierId: supplier.id,
        stockQuantity: product.stockQuantity,
        minStock: product.minStock,
        maxStock: product.stockQuantity * 2,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        isActive: true,
        status: product.stockQuantity === 0 ? "OUT" : product.stockQuantity <= product.minStock ? "LOW" : "NORMAL",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`Seeded product: ${product.name}`);
  }

  // Seed Us
  for (const userData of users) {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (!existingUser) {
      console.log(`📝 Criando usuário: ${userData.email}`)

      const hashedPassword = await hashPassword(userData.password)

      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        },
      })

      // Atribuir permissões padrão
      await assignDefaultPermissions(user.id, user.role)
      console.log(`✅ Usuário ${userData.email} criado com permissões`)
    } else {
      console.log(`⏭️  Usuário ${userData.email} já existe`)
    }
  }

  console.log("🎉 Seed concluído!")
// Seed Sales
  const sales = [
    {
      customer: "João Silva",
      total: 15.8,
      date: "2024-05-15",
      items: [
        { product: "Coca-Cola 350ml", quantity: 2, unitPrice: 5.0 },
        { product: "Leite Integral 1L", quantity: 1, unitPrice: 5.8 },
      ],
    },
    {
      customer: "Maria Santos",
      total: 28.5,
      date: "2024-05-22",
      items: [
        { product: "Pão de Leite 500g", quantity: 3, unitPrice: 3.2 },
        { product: "Arroz Branco 5kg", quantity: 1, unitPrice: 18.9 },
      ],
    },
  ];

  for (const sale of sales) {
    const customer = await prisma.customer.findFirst({ where: { name: sale.customer } });

    const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
    if (!adminUser) {
      throw new Error("Admin user not found. Ensure an admin user exists in the database.");
    }

    const saleRecord = await prisma.sale.create({
      data: {
        customerId: customer?.id || null,
        userId: adminUser.id,
        totalAmount: sale.total,
        createdAt: new Date(sale.date),
      },
    });

    for (const item of sale.items) {
      const product = await prisma.product.findFirst({ where: { name: item.product } });
      if (!product) {
        throw new Error(`Produto '${item.product}' não encontrado.`);
      }

      await prisma.saleItem.create({
        data: {
          saleId: saleRecord.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        },
      });
    }
    console.log(`Seeded sale for ${sale.customer}`);
  }

  // Seed Expenses
  const expenses = [
    { description: "Aluguel", amount: 5000, category: "Operacional", date: "2024-01-01" },
    { description: "Contas de Luz", amount: 500, category: "Utilidades", date: "2024-01-05" },
    { description: "Salários", amount: 10000, category: "Pessoal", date: "2024-01-10" },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        createdAt: new Date(expense.date),
      },
    });
    console.log(`Seeded expense: ${expense.description}`);
  }

  console.log("Seeding completed");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })