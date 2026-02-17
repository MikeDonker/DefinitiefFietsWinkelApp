import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // =============================================================================
  // 1. Permissions
  // =============================================================================
  const permissionNames = [
    "bikes:read",
    "bikes:create",
    "bikes:update",
    "bikes:delete",
    "workorders:read",
    "workorders:create",
    "workorders:update",
  ];

  const permissions: Record<string, { id: string; name: string }> = {};
  for (const name of permissionNames) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    permissions[name] = permission;
  }
  console.log(`Created ${permissionNames.length} permissions`);

  // =============================================================================
  // 2. Roles with Permissions
  // =============================================================================
  const roleDefinitions = {
    admin: permissionNames, // All permissions
    manager: [
      "bikes:read",
      "bikes:create",
      "bikes:update",
      "workorders:read",
      "workorders:create",
      "workorders:update",
    ],
    medewerker: [
      "bikes:read",
      "bikes:update",
      "workorders:read",
      "workorders:create",
      "workorders:update",
    ],
    readonly: ["bikes:read", "workorders:read"],
  };

  for (const [roleName, rolePermissions] of Object.entries(roleDefinitions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    // Clear existing role permissions and recreate
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    for (const permName of rolePermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permissions[permName].id,
        },
      });
    }
  }
  console.log(`Created ${Object.keys(roleDefinitions).length} roles`);

  // =============================================================================
  // 3. Brands and Models
  // =============================================================================
  const brandModels = {
    Giant: ["Defy", "Propel", "TCR", "Escape"],
    Trek: ["Domane", "Emonda", "Madone", "FX"],
    Specialized: ["Roubaix", "Tarmac", "Allez", "Sirrus"],
    Cannondale: ["Synapse", "SuperSix", "CAAD", "Quick"],
    Gazelle: ["Ultimate", "Chamonix", "Orange", "Paris"],
  };

  const brands: Record<string, { id: string; name: string }> = {};
  const models: Record<string, { id: string; name: string; brandId: string }> =
    {};

  for (const [brandName, modelNames] of Object.entries(brandModels)) {
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });
    brands[brandName] = brand;

    for (const modelName of modelNames) {
      const model = await prisma.model.upsert({
        where: {
          name_brandId: {
            name: modelName,
            brandId: brand.id,
          },
        },
        update: {},
        create: {
          name: modelName,
          brandId: brand.id,
        },
      });
      models[`${brandName}-${modelName}`] = model;
    }
  }
  console.log(
    `Created ${Object.keys(brands).length} brands with ${Object.keys(models).length} models`
  );

  // =============================================================================
  // 4. Sample Bikes (20 bikes)
  // =============================================================================
  const colors = [
    "Black",
    "White",
    "Red",
    "Blue",
    "Green",
    "Silver",
    "Orange",
    "Yellow",
  ];
  const sizes = ["XS", "S", "M", "L", "XL"];
  const statuses = ["IN_STOCK", "IN_SERVICE", "RESERVED", "SOLD"];

  const bikeData = [
    {
      brand: "Giant",
      model: "Defy",
      status: "IN_STOCK",
      price: 1299,
      color: "Black",
      size: "M",
    },
    {
      brand: "Giant",
      model: "Propel",
      status: "IN_STOCK",
      price: 2499,
      color: "White",
      size: "L",
    },
    {
      brand: "Giant",
      model: "TCR",
      status: "IN_SERVICE",
      price: 1899,
      color: "Red",
      size: "M",
    },
    {
      brand: "Giant",
      model: "Escape",
      status: "SOLD",
      price: 599,
      color: "Blue",
      size: "S",
    },
    {
      brand: "Trek",
      model: "Domane",
      status: "IN_STOCK",
      price: 1799,
      color: "Silver",
      size: "L",
    },
    {
      brand: "Trek",
      model: "Emonda",
      status: "IN_SERVICE",
      price: 2199,
      color: "Black",
      size: "M",
    },
    {
      brand: "Trek",
      model: "Madone",
      status: "RESERVED",
      price: 2399,
      color: "White",
      size: "L",
    },
    {
      brand: "Trek",
      model: "FX",
      status: "IN_STOCK",
      price: 499,
      color: "Green",
      size: "M",
    },
    {
      brand: "Specialized",
      model: "Roubaix",
      status: "IN_SERVICE",
      price: 1999,
      color: "Red",
      size: "L",
    },
    {
      brand: "Specialized",
      model: "Tarmac",
      status: "IN_STOCK",
      price: 2299,
      color: "Black",
      size: "M",
    },
    {
      brand: "Specialized",
      model: "Allez",
      status: "IN_STOCK",
      price: 899,
      color: "Blue",
      size: "S",
    },
    {
      brand: "Specialized",
      model: "Sirrus",
      status: "SOLD",
      price: 699,
      color: "Silver",
      size: "M",
    },
    {
      brand: "Cannondale",
      model: "Synapse",
      status: "IN_SERVICE",
      price: 1699,
      color: "Green",
      size: "L",
    },
    {
      brand: "Cannondale",
      model: "SuperSix",
      status: "IN_STOCK",
      price: 2199,
      color: "Black",
      size: "M",
    },
    {
      brand: "Cannondale",
      model: "CAAD",
      status: "RESERVED",
      price: 1299,
      color: "White",
      size: "S",
    },
    {
      brand: "Cannondale",
      model: "Quick",
      status: "IN_STOCK",
      price: 549,
      color: "Orange",
      size: "M",
    },
    {
      brand: "Gazelle",
      model: "Ultimate",
      status: "IN_SERVICE",
      price: 1499,
      color: "Black",
      size: "L",
    },
    {
      brand: "Gazelle",
      model: "Chamonix",
      status: "IN_STOCK",
      price: 799,
      color: "Blue",
      size: "M",
    },
    {
      brand: "Gazelle",
      model: "Orange",
      status: "IN_STOCK",
      price: 299,
      color: "Orange",
      size: "XS",
    },
    {
      brand: "Gazelle",
      model: "Paris",
      status: "SOLD",
      price: 649,
      color: "Yellow",
      size: "S",
    },
  ];

  const createdBikes: Array<{ id: number; status: string }> = [];

  for (let i = 0; i < bikeData.length; i++) {
    const data = bikeData[i];
    const frameNumber = `WBK${(123456 + i).toString()}`;

    const bike = await prisma.bike.upsert({
      where: { frameNumber },
      update: {},
      create: {
        frameNumber,
        brandId: brands[data.brand].id,
        modelId: models[`${data.brand}-${data.model}`].id,
        year: 2023 + Math.floor(Math.random() * 2),
        color: data.color,
        size: data.size,
        purchasePrice: data.price * 0.6,
        sellingPrice: data.price,
        status: data.status,
        notes:
          data.status === "SOLD"
            ? "Sold to customer"
            : data.status === "RESERVED"
              ? "Reserved for pickup"
              : null,
        soldAt: data.status === "SOLD" ? new Date() : null,
      },
    });
    createdBikes.push({ id: bike.id, status: bike.status });
  }
  console.log(`Created ${createdBikes.length} bikes`);

  // =============================================================================
  // 5. Sample Work Orders (10 work orders)
  // =============================================================================
  // Create a system user for work orders
  const systemUser = await prisma.user.upsert({
    where: { email: "system@bikeshop.local" },
    update: {},
    create: {
      id: "system-user-001",
      name: "System Admin",
      email: "system@bikeshop.local",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Get bikes that are IN_SERVICE
  const serviceBikes = createdBikes.filter((b) => b.status === "IN_SERVICE");

  const workOrderData = [
    {
      description: "Annual service - brake adjustment and chain lubrication",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      estimatedCost: 75,
    },
    {
      description: "Flat tire repair - rear wheel",
      status: "COMPLETED",
      priority: "HIGH",
      estimatedCost: 25,
      actualCost: 22,
    },
    {
      description: "Full overhaul - bottom bracket and headset replacement",
      status: "WAITING_PARTS",
      priority: "MEDIUM",
      estimatedCost: 250,
    },
    {
      description: "Gear cable replacement and derailleur adjustment",
      status: "OPEN",
      priority: "LOW",
      estimatedCost: 45,
    },
    {
      description: "Emergency wheel truing after crash",
      status: "IN_PROGRESS",
      priority: "URGENT",
      estimatedCost: 60,
    },
    {
      description: "Hydraulic brake bleed - front and rear",
      status: "OPEN",
      priority: "MEDIUM",
      estimatedCost: 80,
    },
    {
      description: "New handlebar tape installation",
      status: "COMPLETED",
      priority: "LOW",
      estimatedCost: 35,
      actualCost: 35,
    },
    {
      description: "Spoke replacement and wheel rebuild",
      status: "WAITING_PARTS",
      priority: "HIGH",
      estimatedCost: 120,
    },
    {
      description: "Tubeless tire setup conversion",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      estimatedCost: 55,
    },
    {
      description: "Pre-sale inspection and safety check",
      status: "OPEN",
      priority: "HIGH",
      estimatedCost: 40,
    },
  ];

  let workOrderCount = 0;
  for (let i = 0; i < workOrderData.length; i++) {
    const data = workOrderData[i];
    // Cycle through service bikes
    const bikeId = serviceBikes[i % serviceBikes.length].id;

    await prisma.serviceWorkOrder.create({
      data: {
        bikeId,
        description: data.description,
        status: data.status,
        priority: data.priority,
        createdById: systemUser.id,
        assignedToId: systemUser.id,
        estimatedCost: data.estimatedCost,
        actualCost: data.actualCost || null,
        completedAt: data.status === "COMPLETED" ? new Date() : null,
        notes:
          data.status === "WAITING_PARTS"
            ? "Waiting for parts to arrive from supplier"
            : null,
      },
    });
    workOrderCount++;
  }
  console.log(`Created ${workOrderCount} work orders`);

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
