// lib/validation.js
import { Schema } from "mongoose";
import validator from "validator";

/**
 * Creates a validation schema from a Mongoose model
 * @param {Object} model - Mongoose model
 * @returns {Object} Validation schema
 */
export function createValidationSchemaFromModel(model) {
   if (!model || !model.schema) {
      throw new Error("Invalid model provided");
   }

   const schema = model.schema;
   return createSchemaFromPaths(schema.paths);
}

/**
 * Creates a validation schema from Mongoose schema paths
 * @param {Object} paths - Mongoose schema paths
 * @returns {Object} Validation schema
 */
function createSchemaFromPaths(paths) {
   const validationSchema = {};

   for (const [path, schemaType] of Object.entries(paths)) {
      if (path === "__v" || path === "_id") continue;

      const fieldSchema = {};
      const schemaOptions = schemaType.options || {};

      // Type
      if (schemaType.instance) {
         fieldSchema.type = schemaType.instance.toLowerCase();
      }

      // Required
      if (schemaOptions.required) {
         fieldSchema.required = true;
      }

      // Min/Max for numbers
      if (fieldSchema.type === "number") {
         if (schemaOptions.min !== undefined) {
            fieldSchema.min = schemaOptions.min;
         }
         if (schemaOptions.max !== undefined) {
            fieldSchema.max = schemaOptions.max;
         }
      }

      // Min/Max length for strings
      if (fieldSchema.type === "string") {
         if (schemaOptions.minlength !== undefined) {
            fieldSchema.minLength = schemaOptions.minlength;
         }
         if (schemaOptions.maxlength !== undefined) {
            fieldSchema.maxLength = schemaOptions.maxlength;
         }

         // String format validations
         if (schemaOptions.match) {
            fieldSchema.pattern = schemaOptions.match.toString();
         }

         if (schemaOptions.enum) {
            fieldSchema.enum = schemaOptions.enum;
         }
      }

      validationSchema[path] = fieldSchema;
   }

   return validationSchema;
}

/**
 * Validates data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
export function validateData(data, schema) {
   const errors = {};
   let isValid = true;

   // Check for required fields
   for (const [field, rules] of Object.entries(schema)) {
      if (rules.required && (data[field] === undefined || data[field] === null || data[field] === "")) {
         errors[field] = `${field} is required`;
         isValid = false;
      }
   }

   // Validate fields that are present
   for (const [field, value] of Object.entries(data)) {
      const rules = schema[field];

      if (!rules) continue; // Skip fields not in schema

      // Type validation
      if (rules.type && value !== undefined && value !== null) {
         const actualType = typeof value;
         let expectedType = rules.type;

         // Handle special Mongoose types
         if (expectedType === "objectid") expectedType = "string";
         if (expectedType === "date" && actualType === "string") {
            if (!validator.isISO8601(value)) {
               errors[field] = `${field} must be a valid date`;
               isValid = false;
            }
         } else if (actualType !== expectedType && !(expectedType === "number" && !isNaN(Number(value)))) {
            errors[field] = `${field} must be a ${expectedType}`;
            isValid = false;
         }
      }

      // Number range validation
      if (rules.type === "number" && value !== undefined && value !== null) {
         const numValue = Number(value);

         if (rules.min !== undefined && numValue < rules.min) {
            errors[field] = `${field} must be at least ${rules.min}`;
            isValid = false;
         }

         if (rules.max !== undefined && numValue > rules.max) {
            errors[field] = `${field} must be at most ${rules.max}`;
            isValid = false;
         }
      }

      // String validation
      if (rules.type === "string" && value !== undefined && value !== null) {
         if (rules.minLength !== undefined && value.length < rules.minLength) {
            errors[field] = `${field} must be at least ${rules.minLength} characters`;
            isValid = false;
         }

         if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            errors[field] = `${field} must be at most ${rules.maxLength} characters`;
            isValid = false;
         }

         if (rules.pattern && !new RegExp(rules.pattern.slice(1, -1)).test(value)) {
            errors[field] = `${field} format is invalid`;
            isValid = false;
         }

         if (rules.enum && !rules.enum.includes(value)) {
            errors[field] = `${field} must be one of: ${rules.enum.join(", ")}`;
            isValid = false;
         }
      }
   }

   return {
      isValid,
      errors: Object.keys(errors).length > 0 ? errors : null,
   };
}

/**
 * Create validation middleware for a model
 * @param {Object} model - Mongoose model
 * @returns {Function} Middleware function
 */
export function createValidationMiddleware(model) {
   const schema = createValidationSchemaFromModel(model);

   return (req, res, next) => {
      if (!req.body) {
         return res.status(400).json({ error: "Request body is required" });
      }

      const validation = validateData(req.body, schema);

      if (!validation.isValid) {
         return res.status(400).json({
            error: "Validation failed",
            details: validation.errors,
         });
      }

      req.validatedData = req.body;
      next();
   };
}

/**
 * Enhanced API middleware with validation
 * @param {Function} handler - API route handler
 * @param {Object} model - Mongoose model for validation
 * @param {Object} options - Additional options
 * @returns {Function} Enhanced handler
 */
export function withValidation(handler, model, options = {}) {
   const schema = model ? createValidationSchemaFromModel(model) : null;

   return async (req, context) => {
      if (!req.body && req.method !== "GET") {
         try {
            req.body = await req.json().catch(() => ({}));
         } catch (error) {
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
               status: 400,
               headers: { "Content-Type": "application/json" },
            });
         }
      }

      // Skip validation for GET requests or if no schema
      if (req.method === "GET" || !schema) {
         return handler(req, context);
      }

      const validation = validateData(req.body, schema);

      if (!validation.isValid) {
         return new Response(
            JSON.stringify({
               error: "Validation failed",
               details: validation.errors,
            }),
            {
               status: 400,
               headers: { "Content-Type": "application/json" },
            }
         );
      }

      req.validatedData = req.body;
      return handler(req, context);
   };
}
