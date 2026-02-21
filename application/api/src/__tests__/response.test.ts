import { describe, it, expect } from "vitest";
import {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  internalError,
  getUserId,
} from "../lib/response";

describe("response helpers", () => {
  it("success - returns 200 with JSON body", () => {
    const res = success({ message: "ok" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ message: "ok" });
    expect(res.headers?.["Content-Type"]).toBe("application/json");
  });

  it("success - supports custom status code", () => {
    const res = success({ data: true }, 202);
    expect(res.statusCode).toBe(202);
  });

  it("created - returns 201", () => {
    const res = created({ id: "123" });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({ id: "123" });
  });

  it("noContent - returns 204 with empty body", () => {
    const res = noContent();
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe("");
  });

  it("badRequest - returns 400", () => {
    const res = badRequest("invalid input");
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("invalid input");
  });

  it("unauthorized - returns 401", () => {
    const res = unauthorized();
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error.code).toBe("UNAUTHORIZED");
  });

  it("forbidden - returns 403", () => {
    const res = forbidden();
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error.code).toBe("FORBIDDEN");
  });

  it("notFound - returns 404", () => {
    const res = notFound();
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error.code).toBe("NOT_FOUND");
  });

  it("conflict - returns 409", () => {
    const res = conflict();
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error.code).toBe("CONFLICT");
  });

  it("validationError - returns 422", () => {
    const res = validationError();
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });

  it("internalError - returns 500", () => {
    const res = internalError();
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error.code).toBe("INTERNAL_ERROR");
  });

  it("includes CORS headers", () => {
    const res = success({});
    expect(res.headers?.["Access-Control-Allow-Methods"]).toContain("GET");
  });
});

describe("getUserId", () => {
  it("extracts sub from Cognito claims", () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: { sub: "user-123" },
        },
      },
    };
    expect(getUserId(event)).toBe("user-123");
  });

  it("returns null when claims are missing", () => {
    expect(getUserId({})).toBeNull();
    expect(getUserId({ requestContext: {} })).toBeNull();
    expect(getUserId({ requestContext: { authorizer: {} } })).toBeNull();
    expect(
      getUserId({ requestContext: { authorizer: { claims: {} } } })
    ).toBeNull();
  });
});
