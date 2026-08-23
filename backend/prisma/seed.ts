import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Society Maintenance Tracker database...");

  // 1. Clean existing test data
  await prisma.notificationLog.deleteMany({});
  await prisma.complaintHistory.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.societyConfig.deleteMany({});

  // 2. Create Society Config
  const societyConfig = await prisma.societyConfig.create({
    data: {
      id: "default_config",
      societyName: "Palm Grove Residency (Tower A-D)",
      overdueThresholdDays: 3,
      contactEmail: "admin@palmgrove.society",
      contactPhone: "+1 (555) 349-8800",
    },
  });
  console.log("Created Society Config:", societyConfig.societyName);

  // 3. Create Admin & Resident Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("Admin@123", salt);
  const residentPasswordHash = await bcrypt.hash("Resident@123", salt);

  const admin = await prisma.user.create({
    data: {
      name: "Marcus Vance (Society Admin)",
      email: "admin@society.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      flatNumber: "Admin Office - Ground Floor",
      phone: "+1 (555) 349-8801",
    },
  });

  const resident1 = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "resident@society.com",
      passwordHash: residentPasswordHash,
      role: "RESIDENT",
      flatNumber: "Flat B-402",
      phone: "+1 (555) 782-9912",
    },
  });

  const resident2 = await prisma.user.create({
    data: {
      name: "David Miller",
      email: "david.miller@society.com",
      passwordHash: residentPasswordHash,
      role: "RESIDENT",
      flatNumber: "Flat A-104",
      phone: "+1 (555) 912-3341",
    },
  });

  console.log("Created users:", {
    admin: admin.email,
    resident1: resident1.email,
    resident2: resident2.email,
  });

  // 4. Create Notices (Classy, professional phrasing without emojis)
  await prisma.notice.createMany({
    data: [
      {
        title: "Scheduled Power Substation Maintenance",
        content:
          "Please be advised that regular backup generator and substation maintenance is scheduled for this coming Saturday between 10:00 AM and 02:00 PM. Lifts on Block B and C will operate on backup power.",
        isImportant: true,
        authorId: admin.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Annual Water Tank Cleaning & Sanitization",
        content:
          "Overhead water tanks across Blocks A, B, C, and D will undergo comprehensive chemical and ultraviolet cleaning from 9:00 AM to 1:00 PM this Thursday. Please store adequate water for morning usage.",
        isImportant: true,
        authorId: admin.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Clubhouse & Swimming Pool Timings Update",
        content:
          "Starting this weekend, the swimming pool will remain open from 6:00 AM to 10:00 PM daily. Guest passes must be booked at the reception 24 hours in advance.",
        isImportant: false,
        authorId: admin.id,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Basement Parking Bay Line Marking Schedule",
        content:
          "Stenciling and demarcation line repainting will take place in Basement Level 2 over the upcoming holiday. Please park in designated visitor slots during that day.",
        isImportant: false,
        authorId: admin.id,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
  });
  console.log("Created initial notices");

  // 5. Create Sample Complaints with Rich Lifecycles
  
  // Complaint 1: OVERDUE Water Leakage (created 6 days ago, threshold is 3 days)
  const complaint1 = await prisma.complaint.create({
    data: {
      ticketId: "CMP-1001",
      title: "Main corridor ceiling pipe seepage near 4th floor vestibule",
      category: "Plumbing",
      description:
        "Water has been steadily dripping near the elevator vestibule on the 4th floor. It is creating a slipping hazard for residents and requires urgent pipe inspection.",
      status: "OPEN",
      priority: "HIGH",
      residentId: resident1.id,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.complaintHistory.createMany({
    data: [
      {
        complaintId: complaint1.id,
        previousStatus: "NONE",
        newStatus: "OPEN",
        changedById: resident1.id,
        note: "Complaint submitted by resident with high urgency.",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Complaint 2: In Progress Electrical Issue
  const complaint2 = await prisma.complaint.create({
    data: {
      ticketId: "CMP-1002",
      title: "Intermittent flickering corridor illumination near flat B-402",
      category: "Electrical",
      description:
        "The LED ballast appears damaged, causing the hallway fixture to buzz and flicker during evening hours.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      residentId: resident1.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.complaintHistory.createMany({
    data: [
      {
        complaintId: complaint2.id,
        previousStatus: "NONE",
        newStatus: "OPEN",
        changedById: resident1.id,
        note: "Complaint filed via resident portal.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: complaint2.id,
        previousStatus: "OPEN",
        newStatus: "IN_PROGRESS",
        changedById: admin.id,
        note: "Assigned to electrical maintenance contractor. Replacement driver unit scheduled for dispatch.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Complaint 3: Resolved Lift Noise
  const complaint3 = await prisma.complaint.create({
    data: {
      ticketId: "CMP-1003",
      title: "Passenger Elevator B friction sound during door cycle",
      category: "Lift/Elevator",
      description:
        "Passenger elevator B makes metal friction sounds whenever closing on the ground floor level.",
      status: "RESOLVED",
      priority: "HIGH",
      residentId: resident2.id,
      resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.complaintHistory.createMany({
    data: [
      {
        complaintId: complaint3.id,
        previousStatus: "NONE",
        newStatus: "OPEN",
        changedById: resident2.id,
        note: "Reported by resident.",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: complaint3.id,
        previousStatus: "OPEN",
        newStatus: "IN_PROGRESS",
        changedById: admin.id,
        note: "OEM elevator maintenance crew notified. On-site inspection commenced.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        complaintId: complaint3.id,
        previousStatus: "IN_PROGRESS",
        newStatus: "RESOLVED",
        changedById: admin.id,
        note: "Door guide rollers lubricated and optical sensor recalibrated. Tested under load, certified operational.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Complaint 4: Common Area Gym AC filter
  const complaint4 = await prisma.complaint.create({
    data: {
      ticketId: "CMP-1004",
      title: "Fitness center HVAC compressor cooling performance",
      category: "Common Area",
      description:
        "The climate control unit in the fitness facility is maintaining inadequate airflow during peak hours.",
      status: "OPEN",
      priority: "LOW",
      residentId: resident2.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.complaintHistory.create({
    data: {
      complaintId: complaint4.id,
      previousStatus: "NONE",
      newStatus: "OPEN",
      changedById: resident2.id,
      note: "Initial ticket submission.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Database seeded successfully with clean, professional test records!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
