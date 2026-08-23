import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/server.js";
import { prisma } from "../src/utils/prisma.js";
import bcrypt from "bcryptjs";

describe("Society Maintenance Tracker API Suite", () => {
  let adminToken: string;
  let residentToken: string;
  let residentId: string;
  let createdComplaintId: string;

  beforeAll(async () => {
    // Setup test database state
    await prisma.notificationLog.deleteMany({});
    await prisma.complaintHistory.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.notice.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.societyConfig.deleteMany({});

    await prisma.societyConfig.create({
      data: {
        id: "default_config",
        societyName: "Test Heights",
        overdueThresholdDays: 3,
      },
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Password@123", salt);

    const admin = await prisma.user.create({
      data: {
        name: "Test Admin",
        email: "testadmin@society.com",
        passwordHash: hash,
        role: "ADMIN",
      },
    });

    const resident = await prisma.user.create({
      data: {
        name: "Test Resident",
        email: "testresident@society.com",
        passwordHash: hash,
        role: "RESIDENT",
        flatNumber: "A-101",
      },
    });

    residentId = resident.id;

    // Login Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "testadmin@society.com", password: "Password@123" });
    adminToken = adminRes.body.data.token;

    // Login Resident
    const residentRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "testresident@society.com", password: "Password@123" });
    residentToken = residentRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/health - returns service health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /api/auth/register - registers new user with role RESIDENT", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "New Resident",
      email: "newres@society.com",
      password: "Password@123",
      flatNumber: "C-302",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("RESIDENT");
  });

  it("POST /api/complaints - resident creates a complaint with initial history", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${residentToken}`)
      .send({
        title: "Leaking bathroom faucet",
        category: "Plumbing",
        description: "Water dripping continuously in master washroom",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complaint.status).toBe("OPEN");
    expect(res.body.data.complaint.ticketId).toMatch(/^CMP-\d{4}$/);
    expect(res.body.data.complaint.history).toHaveLength(1);
    expect(res.body.data.complaint.history[0].newStatus).toBe("OPEN");

    createdComplaintId = res.body.data.complaint.id;
  });

  it("GET /api/complaints/my - resident retrieves their own complaint list", async () => {
    const res = await request(app)
      .get("/api/complaints/my")
      .set("Authorization", `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complaints.length).toBeGreaterThan(0);
  });

  it("PATCH /api/complaints/:id/status - admin updates status to IN_PROGRESS and RESOLVED with notes", async () => {
    // 1. Move to IN_PROGRESS
    const res1 = await request(app)
      .patch(`/api/complaints/${createdComplaintId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "IN_PROGRESS",
        note: "Assigned plumber John Doe to visit at 4 PM",
      });

    expect(res1.status).toBe(200);
    expect(res1.body.data.complaint.status).toBe("IN_PROGRESS");
    expect(res1.body.data.complaint.history).toHaveLength(2);

    // 2. Move to RESOLVED
    const res2 = await request(app)
      .patch(`/api/complaints/${createdComplaintId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "RESOLVED",
        note: "Replaced faulty washer. Problem fixed.",
      });

    expect(res2.status).toBe(200);
    expect(res2.body.data.complaint.status).toBe("RESOLVED");
    expect(res2.body.data.complaint.resolvedAt).toBeDefined();
    expect(res2.body.data.complaint.history).toHaveLength(3);
  });

  it("POST /api/notices - admin posts notices, pinned notice comes first", async () => {
    // Regular notice
    await request(app)
      .post("/api/notices")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Clubhouse Routine Maintenance",
        content: "Gym will be closed this Friday evening for sanitization.",
        isImportant: false,
      });

    // Pinned notice
    await request(app)
      .post("/api/notices")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Urgent: Water Supply Interruption",
        content: "Main valve replacement scheduled tomorrow from 1 PM to 3 PM.",
        isImportant: true,
      });

    const getRes = await request(app)
      .get("/api/notices")
      .set("Authorization", `Bearer ${residentToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.notices.length).toBe(2);
    // Pinned should be first
    expect(getRes.body.data.notices[0].isImportant).toBe(true);
    expect(getRes.body.data.notices[0].title).toContain("Urgent: Water Supply");
  });

  it("GET /api/dashboard/stats - returns calculated summary & category breakdowns", async () => {
    const res = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalComplaints).toBeGreaterThanOrEqual(1);
    expect(res.body.data.categoryCounts["Plumbing"]).toBeGreaterThanOrEqual(1);
  });
});
