import Technician from "../models/Technician.js";
import Repair from "../models/Repair.js";
import RepairPart from "../models/RepairPart.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import paginate, { calcPages, validateDateRange } from "../utils/paginate.js";

// إضافة فني جديد
export const createTechnician = asyncHandler(async (req, res) => {
  const { name, phone, username, password, commission_percentage } = req.body;

  // التحقق من عدم تكرار username
  const existingTechnician = await Technician.findOne({
    where: { username, shop_id: req.shop.id },
  });

  if (existingTechnician) {
    throw new AppError("اسم المستخدم موجود بالفعل", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const technician = await Technician.create({
    shop_id: req.shop.id,
    name,
    phone,
    username,
    password: hashedPassword,
    commission_percentage: commission_percentage || 0,
  });

  res.status(201).json({
    message: "تمت إضافة الفني بنجاح",
    data: {
      id: technician.id,
      name: technician.name,
      username: technician.username,
      status: technician.status,
    },
  });
});

// عرض جميع الفنيين
export const getTechnicians = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const where = { shop_id: req.shop.id };

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status && ["active", "inactive"].includes(status)) {
    where.status = status;
  }

  const { pageNum, limitNum, offset } = paginate(req.query);

  const { rows, count } = await Technician.findAndCountAll({
    where,
    attributes: {
      exclude: ["password"],
    },
    order: [["created_at", "DESC"]],
    limit: limitNum,
    offset,
  });

  res.json({
    data: rows,
    total: count,
    page: pageNum,
    limit: limitNum,
    pages: calcPages(count, limitNum),
  });
});

// عرض فني واحد
export const getTechnician = asyncHandler(async (req, res) => {
  const technician = await Technician.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
    attributes: {
      exclude: ["password"],
    },
  });

  if (!technician) throw new AppError("الفني غير موجود", 404);

  res.json({ data: technician });
});

// تعديل بيانات الفني (الاسم، التليفون، اليوزرنيم، كلمة السر)
export const updateTechnician = asyncHandler(async (req, res) => {
  const technician = await Technician.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!technician) throw new AppError("الفني غير موجود", 404);

  const { name, phone, username, password, commission_percentage, status } =
    req.body;

  // التحقق من عدم تكرار username إذا كان سيتم تغييره
  if (username && username !== technician.username) {
    const existingUsername = await Technician.findOne({
      where: { username, shop_id: req.shop.id },
    });
    if (existingUsername) {
      throw new AppError("اسم المستخدم موجود بالفعل", 400);
    }
  }

  const updateData = {};

  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (username) updateData.username = username;
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }
  if (commission_percentage !== undefined)
    updateData.commission_percentage = commission_percentage;
  if (status) updateData.status = status;

  await technician.update(updateData);

  res.json({
    message: "تم تحديث بيانات الفني بنجاح",
    data: {
      id: technician.id,
      name: technician.name,
      phone: technician.phone,
      username: technician.username,
      status: technician.status,
      commission_percentage: technician.commission_percentage,
    },
  });
});

// حذف فني
export const deleteTechnician = asyncHandler(async (req, res) => {
  const technician = await Technician.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!technician) throw new AppError("الفني غير موجود", 404);

  await technician.destroy();

  res.json({
    message: "تم حذف الفني بنجاح",
  });
});

// تغيير كلمة السر للفني (الطريقة القديمة - لو بتحتاجها)
export const changeTechnicianPassword = asyncHandler(async (req, res) => {
  const technician = await Technician.findOne({
    where: { id: req.params.id, shop_id: req.shop.id },
  });

  if (!technician) throw new AppError("الفني غير موجود", 404);

  const { new_password } = req.body;

  if (!new_password) throw new AppError("كلمة السر الجديدة مطلوبة", 400);

  const hashedPassword = await bcrypt.hash(new_password, 12);
  await technician.update({ password: hashedPassword });

  res.json({
    message: "تم تغيير كلمة السر بنجاح",
  });
});

// صيانات الفني
export const getTechnicianRepairs = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const where = { technician_id: req.technician.id };

  if (start && end) {
    where.created_at = {
      [Op.between]: [new Date(start), new Date(end)],
    };
  }

  const { pageNum, limitNum, offset } = paginate(req.query);

  const { rows, count } = await Repair.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: limitNum,
    offset,
  });

  res.json({
    data: rows,
    total: count,
    page: pageNum,
    limit: limitNum,
    pages: calcPages(count, limitNum),
  });
});

// القطع المطلوبة من الفني
export const getTechnicianParts = asyncHandler(async (req, res) => {
  const parts = await RepairPart.findAll({
    where: { technician_id: req.technician.id, status: "used" },
    order: [["created_at", "DESC"]],
  });

  const totalCost = parts.reduce((sum, part) => {
    return sum + parseFloat(part.buy_price) * part.quantity_used;
  }, 0);

  res.json({
    data: parts,
    total_parts_used: parts.length,
    total_cost: totalCost.toFixed(2),
  });
});

// dashboard الفني
export const getTechnicianDashboard = asyncHandler(async (req, res) => {
  const technicianId = req.technician.id;

  // اليوم
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endToday = new Date();
  endToday.setHours(23, 59, 59, 999);

  // الأسبوع
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // الشهر
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const [repairsToday, repairsWeek, repairsMonth, partsUsedToday] =
    await Promise.all([
      Repair.findAll({
        where: {
          technician_id: technicianId,
          created_at: { [Op.between]: [today, endToday] },
        },
      }),
      Repair.findAll({
        where: {
          technician_id: technicianId,
          created_at: { [Op.between]: [weekStart, weekEnd] },
        },
      }),
      Repair.findAll({
        where: {
          technician_id: technicianId,
          created_at: { [Op.between]: [monthStart, monthEnd] },
        },
      }),
      RepairPart.findAll({
        where: {
          technician_id: technicianId,
          status: "used",
          created_at: { [Op.between]: [today, endToday] },
        },
      }),
    ]);

  const totalRevenueToday = repairsToday.reduce(
    (sum, r) => sum + parseFloat(r.repair_cost || 0),
    0
  );

  const totalRevenueWeek = repairsWeek.reduce(
    (sum, r) => sum + parseFloat(r.repair_cost || 0),
    0
  );

  const totalRevenueMonth = repairsMonth.reduce(
    (sum, r) => sum + parseFloat(r.repair_cost || 0),
    0
  );

  const technician = await Technician.findByPk(technicianId, {
    attributes: { exclude: ["password"] },
  });

  res.json({
    technician,
    statistics: {
      today: {
        repairs_count: repairsToday.length,
        parts_used: partsUsedToday.length,
        total_revenue: totalRevenueToday.toFixed(2),
      },
      week: {
        repairs_count: repairsWeek.length,
        total_revenue: totalRevenueWeek.toFixed(2),
      },
      month: {
        repairs_count: repairsMonth.length,
        total_revenue: totalRevenueMonth.toFixed(2),
      },
      total: {
        repairs_count: technician.total_repairs,
        total_revenue: technician.total_revenue,
      },
    },
  });
});

// تقرير الفنيين
export const getTechniciansReport = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const where = { shop_id: req.shop.id };

  if (start && end) {
    where.created_at = {
      [Op.between]: [new Date(start), new Date(end)],
    };
  }

  const technicians = await Technician.findAll({
    where: { shop_id: req.shop.id },
    attributes: { exclude: ["password"] },
  });

  const report = await Promise.all(
    technicians.map(async (tech) => {
      const repairs = await Repair.findAll({
        where: {
          technician_id: tech.id,
          created_at: where.created_at ? where.created_at : undefined,
        },
      });

      const totalRepairs = repairs.length;
      const totalRevenue = repairs.reduce(
        (sum, r) => sum + parseFloat(r.repair_cost || 0),
        0
      );
      const totalTechnicianCost = repairs.reduce(
        (sum, r) => sum + parseFloat(r.technician_cost || 0),
        0
      );

      const doneRepairs = repairs.filter(
        (r) => r.status === "done" || r.status === "delivered"
      ).length;

      return {
        id: tech.id,
        name: tech.name,
        username: tech.username,
        phone: tech.phone,
        status: tech.status,
        commission_percentage: tech.commission_percentage,
        repairs_count: totalRepairs,
        done_repairs: doneRepairs,
        pending_repairs: totalRepairs - doneRepairs,
        total_revenue: totalRevenue.toFixed(2),
        total_technician_cost: totalTechnicianCost.toFixed(2),
        completion_rate:
          totalRepairs > 0 ? ((doneRepairs / totalRepairs) * 100).toFixed(2) : 0,
      };
    })
  );

  res.json({
    period: { start, end },
    technicians_report: report,
  });
});

// تقرير فني واحد
export const getTechnicianDetailedReport = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const technicianId = req.params.id;

  const technician = await Technician.findOne({
    where: { id: technicianId, shop_id: req.shop.id },
    attributes: { exclude: ["password"] },
  });

  if (!technician) throw new AppError("الفني غير موجود", 404);

  const where = { technician_id: technicianId };

  if (start && end) {
    where.created_at = {
      [Op.between]: [new Date(start), new Date(end)],
    };
  }

  const [repairs, parts] = await Promise.all([
    Repair.findAll({
      where,
      order: [["created_at", "DESC"]],
    }),
    RepairPart.findAll({
      where: { technician_id: technicianId },
      order: [["created_at", "DESC"]],
    }),
  ]);

  const totalRevenue = repairs.reduce(
    (sum, r) => sum + parseFloat(r.repair_cost || 0),
    0
  );

  const totalCost = parts.reduce((sum, p) => {
    return sum + parseFloat(p.buy_price) * p.quantity_used;
  }, 0);

  res.json({
    technician,
    period: { start, end },
    repairs: {
      total: repairs.length,
      done: repairs.filter((r) => r.status === "done").length,
      in_progress: repairs.filter((r) => r.status === "in_progress").length,
      delivered: repairs.filter((r) => r.status === "delivered").length,
      rejected: repairs.filter((r) => r.status === "rejected").length,
      details: repairs,
    },
    parts: {
      total_used: parts.length,
      total_cost: totalCost.toFixed(2),
      details: parts,
    },
    summary: {
      total_revenue: totalRevenue.toFixed(2),
      total_cost: totalCost.toFixed(2),
      profit: (totalRevenue - totalCost).toFixed(2),
    },
  });
});

/*
1️⃣ صاحب المحل يضيف فني جديد:
POST /api/v1/technicians

Body:
{
  "name": "محمود",
  "email": "mahmoud@example.com",
  "phone": "01012345678",
  "username": "mahmoud_tech",
  "password": "password123",
  "commission_percentage": 15
}

Response:
{
  "message": "تمت إضافة الفني بنجاح",
  "data": {
    "id": 1,
    "name": "محمود",
    "username": "mahmoud_tech",
    "status": "active"
  }
}

2️⃣ صاحب المحل يشوف قائمة الفنيين:
GET /api/v1/technicians

Response:
{
  "data": [
    {
      "id": 1,
      "name": "محمود",
      "username": "mahmoud_tech",
      "phone": "01012345678",
      "email": "mahmoud@example.com",
      "status": "active",
      "total_repairs": 25,
      "total_revenue": 5000.00,
      "commission_percentage": 15
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}

3️⃣ صاحب المحل يعدل بيانات الفني:
PUT /api/v1/technicians/1

Body:
{
  "name": "محمود أحمد",
  "commission_percentage": 20,
  "status": "active"
}

Response:
{
  "message": "تم تحديث بيانات الفني بنجاح",
  "data": {
    "id": 1,
    "name": "محمود أحمد",
    "status": "active"
  }
}

4️⃣ صاحب المحل يغير كلمة سر الفني:
PATCH /api/v1/technicians/1/password

Body:
{
  "new_password": "newpassword123"
}

Response:
{
  "message": "تم تغيير كلمة السر بنجاح"
}

5️⃣ صاحب المحل يحذف فني:
DELETE /api/v1/technicians/1

Response:
{
  "message": "تم حذف الفني بنجاح"
}

6️⃣ صاحب المحل يشوف تقرير الفنيين:
GET /api/v1/technicians/report/all?start=2026-01-01&end=2026-03-31

Response:
{
  "period": {
    "start": "2026-01-01",
    "end": "2026-03-31"
  },
  "technicians_report": [
    {
      "id": 1,
      "name": "محمود",
      "username": "mahmoud_tech",
      "phone": "01012345678",
      "status": "active",
      "commission_percentage": 15,
      "repairs_count": 25,
      "done_repairs": 23,
      "pending_repairs": 2,
      "total_revenue": 5000.00,
      "total_technician_cost": 750.00,
      "completion_rate": 92
    }
  ]
}

7️⃣ صاحب المحل يشوف تقرير فني واحد (تفصيلي):
GET /api/v1/technicians/report/1?start=2026-01-01&end=2026-03-31

Response:
{
  "technician": {
    "id": 1,
    "name": "محمود",
    "username": "mahmoud_tech",
    "phone": "01012345678",
    "status": "active"
  },
  "period": {
    "start": "2026-01-01",
    "end": "2026-03-31"
  },
  "repairs": {
    "total": 25,
    "done": 23,
    "in_progress": 1,
    "delivered": 1,
    "rejected": 0,
    "details": [
      {
        "id": 1,
        "device_name": "iPhone 15",
        "problem": "كسر شاشة",
        "repair_cost": 200,
        "status": "done",
        "created_at": "2026-03-18"
      }
    ]
  },
  "parts": {
    "total_used": 15,
    "total_cost": 3000.00,
    "details": [...]
  },
  "summary": {
    "total_revenue": 5000.00,
    "total_cost": 750.00,
    "profit": 4250.00
  }
}

👨‍💼 الفني يدخل حسابه:
8️⃣ الفني يشوف Dashboard بتاعه:
GET /api/v1/technicians/me/dashboard

Headers:
Authorization: Bearer TECHNICIAN_TOKEN

Response:
{
  "technician": {
    "id": 1,
    "name": "محمود",
    "username": "mahmoud_tech",
    "status": "active"
  },
  "statistics": {
    "today": {
      "repairs_count": 2,
      "parts_used": 3,
      "total_revenue": 500.00
    },
    "week": {
      "repairs_count": 10,
      "total_revenue": 2500.00
    },
    "month": {
      "repairs_count": 25,
      "total_revenue": 5000.00
    },
    "total": {
      "repairs_count": 25,
      "total_revenue": 5000.00
    }
  }
}

9️⃣ الفني يشوف صيانات بتاعه:
GET /api/v1/technicians/me/repairs?start=2026-03-01&end=2026-03-31

Headers:
Authorization: Bearer TECHNICIAN_TOKEN

Response:
{
  "data": [
    {
      "id": 1,
      "device_name": "iPhone 15",
      "problem": "كسر شاشة",
      "customer_name_snapshot": "أحمد",
      "customer_phone_snapshot": "01012345678",
      "repair_cost": 200,
      "status": "done",
      "created_at": "2026-03-18"
    },
    {
      "id": 2,
      "device_name": "Samsung S24",
      "problem": "بطارية",
      "customer_name_snapshot": "عم محمود",
      "customer_phone_snapshot": "01098765432",
      "repair_cost": 300,
      "status": "in_progress",
      "created_at": "2026-03-17"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}

🔟 الفني يشوف القطع المطلوبة بتاعه:
GET /api/v1/technicians/me/parts

Headers:
Authorization: Bearer TECHNICIAN_TOKEN

Response:
{
  "data": [
    {
      "id": 1,
      "name": "شاشة آيفون 15",
      "quantity_used": 2,
      "buy_price": 200.00,
      "sell_price": 500.00,
      "status": "used"
    },
    {
      "id": 2,
      "name": "بطارية سامسونج",
      "quantity_used": 1,
      "buy_price": 150.00,
      "sell_price": 400.00,
      "status": "used"
    }
  ],
  "total_parts_used": 3,
  "total_cost": 550.00
}

📋 ملخص الـ Endpoints:
للمدير (صاحب المحل):
POST   /api/v1/technicians                    → إضافة فني
GET    /api/v1/technicians                    → عرض الفنيين
GET    /api/v1/technicians?search=محمود     → بحث
GET    /api/v1/technicians?status=active     → تصفية حسب الحالة
GET    /api/v1/technicians/:id               → عرض فني واحد
PUT    /api/v1/technicians/:id               → تعديل الفني
PATCH  /api/v1/technicians/:id/password     → تغيير كلمة السر
DELETE /api/v1/technicians/:id               → حذف فني
GET    /api/v1/technicians/report/all        → تقرير الفنيين
GET    /api/v1/technicians/report/:id        → تقرير فني واحد
للفني:
GET    /api/v1/technicians/me/dashboard      → dashboard الفني
GET    /api/v1/technicians/me/repairs        → صيانات الفني
GET    /api/v1/technicians/me/parts          → قطع استخدمها الفني

POST /api/v1/technicians (بدون email):
json{
  "name": "محمود",
  "phone": "01012345678",
  "username": "mahmoud_tech",
  "password": "password123",
  "commission_percentage": 15
}
PUT /api/v1/technicians/1 (تعديل الاسم والتليفون واليوزرنيم والباسورد):
json{
  "name": "محمود أحمد",
  "phone": "01098765432",
  "username": "mahmoud_2024",
  "password": "newpassword123",
  "commission_percentage": 20,
  "status": "active"
}
Response:
json{
  "message": "تم تحديث بيانات الفني بنجاح",
  "data": {
    "id": 1,
    "name": "محمود أحمد",
    "phone": "01098765432",
    "username": "mahmoud_2024",
    "status": "active",
    "commission_percentage": 20
  }
}

*/