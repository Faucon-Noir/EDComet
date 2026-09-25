/// <reference types="jest" />

import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const helloHandlers = {
  getHello: jest.fn(async () => ({ message: "ok", lang: "en" })),
  getLanguage: jest.fn(async () => "en"),
  getMeInfo: jest.fn(async () => null),
  postHello: jest.fn(async () => undefined),
  putHello: jest.fn(async () => undefined),
  patchHello: jest.fn(async () => undefined),
  delHello: jest.fn(async () => undefined),
};

const shipHandlers = {
  getShipLoadout: jest.fn(async () => null),
};

const constructionHandlers = {
  getLatestSite: jest.fn(async () => null),
  getLatestSiteStats: jest.fn(async () => null),
  getLatestMarket: jest.fn(async () => null),
};

const sseHandlers = {
  stream: jest.fn((req: any) => {
    const stream = require("stream").Readable.from([]);
    req.on?.("close", () => undefined);
    return stream;
  }),
};

jest.mock("../../src/controllers/HelloController", () => ({
  HelloController: class {
    public async getHello() { return helloHandlers.getHello(); }
    public async getLanguage() { return helloHandlers.getLanguage(); }
    public async getMeInfo() { return helloHandlers.getMeInfo(); }
    public async postHello() { return helloHandlers.postHello(); }
    public async putHello() { return helloHandlers.putHello(); }
    public async patchHello() { return helloHandlers.patchHello(); }
    public async delHello() { return helloHandlers.delHello(); }
  },
}));

jest.mock("../../src/controllers/ShipController", () => ({
  ShipController: class {
    public async getShipLoadout() { return shipHandlers.getShipLoadout(); }
  },
}));

jest.mock("../../src/controllers/ColonisationController", () => ({
  ColonisationController: class {
    public async getLatestSite() { return constructionHandlers.getLatestSite(); }
    public async getLatestSiteStats() { return constructionHandlers.getLatestSiteStats(); }
    public async getLatestMarket() { return constructionHandlers.getLatestMarket(); }
  },
}));

jest.mock("../../src/controllers/SseController", () => ({
  SseController: class {
    public setHeader() {}
    public stream(req: any) { return sseHandlers.stream(req); }
  },
}));

import { RegisterRoutes } from "../../src/routes";

describe("API failure modes", () => {
  const app = express();
  app.use(express.json());
  RegisterRoutes(app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err?.status || 500).json({ message: err?.message || "Internal Server Error" });
  });

  beforeEach(() => {
    Object.values(helloHandlers).forEach((fn) => fn.mockReset());
    Object.values(shipHandlers).forEach((fn) => fn.mockReset());
    Object.values(constructionHandlers).forEach((fn) => fn.mockReset());
    Object.values(sseHandlers).forEach((fn) => fn.mockReset());

    helloHandlers.getHello.mockResolvedValue({ message: "ok", lang: "en" });
    helloHandlers.getLanguage.mockResolvedValue("en");
    helloHandlers.getMeInfo.mockResolvedValue(null);
    helloHandlers.postHello.mockResolvedValue(undefined);
    helloHandlers.putHello.mockResolvedValue(undefined);
    helloHandlers.patchHello.mockResolvedValue(undefined);
    helloHandlers.delHello.mockResolvedValue(undefined);

    shipHandlers.getShipLoadout.mockResolvedValue(null);
    constructionHandlers.getLatestSite.mockResolvedValue(null);
    constructionHandlers.getLatestSiteStats.mockResolvedValue(null);
    constructionHandlers.getLatestMarket.mockResolvedValue(null);
  });

  it("returns 404 on unknown route", async () => {
    await request(app).get("/api/not-existing").expect(404);
  });

  it("rejects wrong verb on read-only endpoints", async () => {
    await request(app).post("/api/ship/loadout").expect(404);
    await request(app).put("/api/construction/latestSite").expect(404);
    await request(app).patch("/api/hello/lang").expect(404);
  });

  it("rejects wrong verb on SSE endpoint", async () => {
    await request(app).post("/api/journal/stream").expect(404);
  });

  it("returns 400 for malformed JSON payload", async () => {
    await request(app)
      .post("/api/hello")
      .set("Content-Type", "application/json")
      .send('{"broken":')
      .expect(400);
  });

  it("returns 500 when controller throws", async () => {
    helloHandlers.getHello.mockRejectedValue(new Error("boom"));

    const res = await request(app).get("/api/hello").expect(500);
    expect(res.body).toEqual(expect.objectContaining({ message: "boom" }));
  });

  it("returns null payloads without crashing when domain returns null", async () => {
    shipHandlers.getShipLoadout.mockResolvedValue(null);
    constructionHandlers.getLatestSite.mockResolvedValue(null);

    const shipRes = await request(app).get("/api/ship/loadout").expect(204);
    const siteRes = await request(app).get("/api/construction/latestSite").expect(204);

    expect(shipRes.text).toBe("");
    expect(siteRes.text).toBe("");
  });
});
