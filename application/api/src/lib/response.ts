import type { APIGatewayProxyResult } from "aws-lambda";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,Accept-Language",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export function success(body: unknown, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
    body: JSON.stringify(body),
  };
}

export function created(body: unknown): APIGatewayProxyResult {
  return success(body, 201);
}

export function noContent(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: "",
  };
}

export function error(
  statusCode: number,
  code: string,
  message: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
    body: JSON.stringify({ error: { code, message } }),
  };
}

export function badRequest(message = "Bad request") {
  return error(400, "BAD_REQUEST", message);
}

export function unauthorized(message = "Unauthorized") {
  return error(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden") {
  return error(403, "FORBIDDEN", message);
}

export function notFound(message = "Not found") {
  return error(404, "NOT_FOUND", message);
}

export function conflict(message = "Conflict") {
  return error(409, "CONFLICT", message);
}

export function validationError(message = "Validation error") {
  return error(422, "VALIDATION_ERROR", message);
}

export function internalError(message = "Internal server error") {
  return error(500, "INTERNAL_ERROR", message);
}

/**
 * Extract user ID from Cognito authorizer claims
 */
export function getUserId(event: {
  requestContext?: {
    authorizer?: {
      claims?: { sub?: string };
    };
  };
}): string | null {
  return event.requestContext?.authorizer?.claims?.sub || null;
}
