// middleware/ValidationMiddleware.js
import validator from "validator";
import mongoose from "mongoose";
import { modelRegistry } from "../models/index.js";

class ValidationMiddleware {
   constructor() {
      this.validationRules = {
         email: (value) => validator.isEmail(value),
         url: (value) => validator.isURL(value),
         uuid: (value) => validator.isUUID(value),
         objectId: (value) => mongoose.Types.ObjectId.isValid(value),
         phone: (value) => validator.isMobilePhone(value, "any"),
         postalCode: (value) => validator.isPostalCode(value, "any"),
         creditCard: (value) => validator.isCreditCard(value),
         date: (value) => validator.isISO8601(value),
         json: (value) => {
            try {
               JSON.parse(value);
               return true;
            } catch {
               return false;
            }
         },
      };

      this.sanitizationRules = {
         email: (value) => validator.normalizeEmail(value),
         string: (value) => validator.escape(value),
         html: (value) => validator.stripLow(value),
         sql: (value) => value.replace(/['";\\]/g, ""),
         xss: (value) => validator.escape(value),
      };
   }

   // Request body validation middleware
   validateBody(schema) {
      return (req, res, next) => {
         try {
            const errors = this.validateObject(req.body, schema);
            if (errors.length > 0) {
               return res.status(400).json({
                  error: "Validation failed",
                  code: "VALIDATION_ERROR",
                  details: errors,
               });
            }
            next();
         } catch (error) {
            console.error("Body validation error:", error);
            return res.status(500).json({
               error: "Validation service error",
               code: "VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Request query parameters validation middleware
   validateQuery(schema) {
      return (req, res, next) => {
         try {
            const errors = this.validateObject(req.query, schema);
            if (errors.length > 0) {
               return res.status(400).json({
                  error: "Query validation failed",
                  code: "QUERY_VALIDATION_ERROR",
                  details: errors,
               });
            }
            next();
         } catch (error) {
            console.error("Query validation error:", error);
            return res.status(500).json({
               error: "Validation service error",
               code: "VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Request parameters validation middleware
   validateParams(schema) {
      return (req, res, next) => {
         try {
            const errors = this.validateObject(req.params, schema);
            if (errors.length > 0) {
               return res.status(400).json({
                  error: "Parameter validation failed",
                  code: "PARAM_VALIDATION_ERROR",
                  details: errors,
               });
            }
            next();
         } catch (error) {
            console.error("Parameter validation error:", error);
            return res.status(500).json({
               error: "Validation service error",
               code: "VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Combined validation middleware
   validate(schema) {
      return (req, res, next) => {
         try {
            let allErrors = [];

            // Validate body if schema provided
            if (schema.body) {
               allErrors = allErrors.concat(this.validateObject(req.body, schema.body));
            }

            // Validate query if schema provided
            if (schema.query) {
               allErrors = allErrors.concat(this.validateObject(req.query, schema.query));
            }

            // Validate params if schema provided
            if (schema.params) {
               allErrors = allErrors.concat(this.validateObject(req.params, schema.params));
            }

            if (allErrors.length > 0) {
               return res.status(400).json({
                  error: "Validation failed",
                  code: "VALIDATION_ERROR",
                  details: allErrors,
               });
            }

            next();
         } catch (error) {
            console.error("Combined validation error:", error);
            return res.status(500).json({
               error: "Validation service error",
               code: "VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Sanitize request data
   sanitizeBody(fields) {
      return (req, res, next) => {
         try {
            req.body = this.sanitizeObject(req.body, fields);
            next();
         } catch (error) {
            console.error("Body sanitization error:", error);
            return res.status(500).json({
               error: "Sanitization service error",
               code: "SANITIZATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Validate and sanitize combined middleware
   validateAndSanitize(schema, sanitizationFields = {}) {
      return (req, res, next) => {
         try {
            // Sanitize first
            if (Object.keys(sanitizationFields).length > 0) {
               req.body = this.sanitizeObject(req.body, sanitizationFields);
            }

            // Then validate
            let allErrors = [];

            if (schema.body) {
               allErrors = allErrors.concat(this.validateObject(req.body, schema.body));
            }

            if (schema.query) {
               allErrors = allErrors.concat(this.validateObject(req.query, schema.query));
            }

            if (schema.params) {
               allErrors = allErrors.concat(this.validateObject(req.params, schema.params));
            }

            if (allErrors.length > 0) {
               return res.status(400).json({
                  error: "Validation failed",
                  code: "VALIDATION_ERROR",
                  details: allErrors,
               });
            }

            next();
         } catch (error) {
            console.error("Validate and sanitize error:", error);
            return res.status(500).json({
               error: "Validation service error",
               code: "VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Model-based validation middleware
   validateModel(modelName, operation = "create") {
      return async (req, res, next) => {
         try {
            const Model = modelRegistry.getModel(modelName);
            if (!Model) {
               return res.status(500).json({
                  error: `Model '${modelName}' not found`,
                  code: "MODEL_NOT_FOUND",
               });
            }

            const data = operation === "update" ? req.body : req.body;
            const errors = await this.validateAgainstModel(Model, data, operation);

            if (errors.length > 0) {
               return res.status(400).json({
                  error: "Model validation failed",
                  code: "MODEL_VALIDATION_ERROR",
                  details: errors,
               });
            }

            next();
         } catch (error) {
            console.error("Model validation error:", error);
            return res.status(500).json({
               error: "Model validation service error",
               code: "MODEL_VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Business rule validation middleware
   validateBusinessRules(rules) {
      return async (req, res, next) => {
         try {
            const errors = [];

            for (const rule of rules) {
               const result = await rule.validate(req);
               if (!result.valid) {
                  errors.push({
                     field: rule.field,
                     message: result.message,
                     code: rule.code,
                  });
               }
            }

            if (errors.length > 0) {
               return res.status(400).json({
                  error: "Business rule validation failed",
                  code: "BUSINESS_RULE_VALIDATION_ERROR",
                  details: errors,
               });
            }

            next();
         } catch (error) {
            console.error("Business rule validation error:", error);
            return res.status(500).json({
               error: "Business rule validation service error",
               code: "BUSINESS_RULE_VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // File upload validation middleware
   validateFileUpload(options = {}) {
      return (req, res, next) => {
         try {
            if (!req.files && !req.file) {
               if (options.required) {
                  return res.status(400).json({
                     error: "File upload required",
                     code: "FILE_REQUIRED",
                  });
               }
               return next();
            }

            const files = req.files || [req.file];
            const errors = [];

            files.forEach((file, index) => {
               // Check file size
               if (options.maxSize && file.size > options.maxSize) {
                  errors.push({
                     field: `file${index}`,
                     message: `File size exceeds maximum allowed size of ${options.maxSize} bytes`,
                     code: "FILE_TOO_LARGE",
                  });
               }

               // Check file type
               if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
                  errors.push({
                     field: `file${index}`,
                     message: `File type ${file.mimetype} not allowed. Allowed types: ${options.allowedTypes.join(", ")}`,
                     code: "INVALID_FILE_TYPE",
                  });
               }

               // Check file extension
               if (options.allowedExtensions) {
                  const extension = file.originalname.split(".").pop().toLowerCase();
                  if (!options.allowedExtensions.includes(extension)) {
                     errors.push({
                        field: `file${index}`,
                        message: `File extension .${extension} not allowed. Allowed extensions: ${options.allowedExtensions.join(", ")}`,
                        code: "INVALID_FILE_EXTENSION",
                     });
                  }
               }
            });

            if (errors.length > 0) {
               return res.status(400).json({
                  error: "File validation failed",
                  code: "FILE_VALIDATION_ERROR",
                  details: errors,
               });
            }

            next();
         } catch (error) {
            console.error("File validation error:", error);
            return res.status(500).json({
               error: "File validation service error",
               code: "FILE_VALIDATION_SERVICE_ERROR",
            });
         }
      };
   }

   // Core validation method
   validateObject(data, schema) {
      const errors = [];

      for (const [field, rules] of Object.entries(schema)) {
         const value = data[field];
         const fieldErrors = this.validateField(field, value, rules);

         if (fieldErrors.length > 0) {
            errors.push(...fieldErrors);
         }
      }

      return errors;
   }

   // Field validation
   validateField(field, value, rules) {
      const errors = [];

      // Handle nested objects
      if (rules.type === "object" && rules.schema) {
         if (value && typeof value === "object") {
            const nestedErrors = this.validateObject(value, rules.schema);
            errors.push(
               ...nestedErrors.map((error) => ({
                  ...error,
                  field: `${field}.${error.field}`,
               }))
            );
         }
         return errors;
      }

      // Handle arrays
      if (rules.type === "array" && rules.itemSchema) {
         if (Array.isArray(value)) {
            value.forEach((item, index) => {
               const itemErrors = this.validateField(`${field}[${index}]`, item, rules.itemSchema);
               errors.push(...itemErrors);
            });
         }
         return errors;
      }

      // Required validation
      if (rules.required && (value === undefined || value === null || value === "")) {
         errors.push({
            field,
            message: `${field} is required`,
            code: "REQUIRED",
         });
         return errors; // Don't continue validation if required field is missing
      }

      // Skip further validation if value is empty and not required
      if (value === undefined || value === null || value === "") {
         return errors;
      }

      // Type validation
      if (rules.type) {
         const typeError = this.validateType(field, value, rules.type);
         if (typeError) {
            errors.push(typeError);
            return errors; // Don't continue if type is wrong
         }
      }

      // Custom validation rules
      if (rules.custom) {
         const customError = rules.custom(value, field);
         if (customError) {
            errors.push({
               field,
               message: customError,
               code: "CUSTOM_VALIDATION",
            });
         }
      }

      // Built-in validation rules
      if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
         errors.push({
            field,
            message: `${field} must be at least ${rules.minLength} characters long`,
            code: "MIN_LENGTH",
         });
      }

      if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
         errors.push({
            field,
            message: `${field} must be no more than ${rules.maxLength} characters long`,
            code: "MAX_LENGTH",
         });
      }

      if (rules.min && typeof value === "number" && value < rules.min) {
         errors.push({
            field,
            message: `${field} must be at least ${rules.min}`,
            code: "MIN_VALUE",
         });
      }

      if (rules.max && typeof value === "number" && value > rules.max) {
         errors.push({
            field,
            message: `${field} must be no more than ${rules.max}`,
            code: "MAX_VALUE",
         });
      }

      if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
         errors.push({
            field,
            message: `${field} format is invalid`,
            code: "PATTERN_MISMATCH",
         });
      }

      if (rules.enum && !rules.enum.includes(value)) {
         errors.push({
            field,
            message: `${field} must be one of: ${rules.enum.join(", ")}`,
            code: "ENUM_MISMATCH",
         });
      }

      // Special validation rules
      if (rules.email && !this.validationRules.email(value)) {
         errors.push({
            field,
            message: `${field} must be a valid email address`,
            code: "INVALID_EMAIL",
         });
      }

      if (rules.url && !this.validationRules.url(value)) {
         errors.push({
            field,
            message: `${field} must be a valid URL`,
            code: "INVALID_URL",
         });
      }

      if (rules.objectId && !this.validationRules.objectId(value)) {
         errors.push({
            field,
            message: `${field} must be a valid ObjectId`,
            code: "INVALID_OBJECT_ID",
         });
      }

      return errors;
   }

   // Type validation
   validateType(field, value, expectedType) {
      const actualType = Array.isArray(value) ? "array" : typeof value;

      if (expectedType === "string" && actualType !== "string") {
         return {
            field,
            message: `${field} must be a string`,
            code: "TYPE_MISMATCH",
         };
      }

      if (expectedType === "number" && actualType !== "number") {
         return {
            field,
            message: `${field} must be a number`,
            code: "TYPE_MISMATCH",
         };
      }

      if (expectedType === "boolean" && actualType !== "boolean") {
         return {
            field,
            message: `${field} must be a boolean`,
            code: "TYPE_MISMATCH",
         };
      }

      if (expectedType === "array" && !Array.isArray(value)) {
         return {
            field,
            message: `${field} must be an array`,
            code: "TYPE_MISMATCH",
         };
      }

      if (expectedType === "object" && (actualType !== "object" || Array.isArray(value))) {
         return {
            field,
            message: `${field} must be an object`,
            code: "TYPE_MISMATCH",
         };
      }

      return null;
   }

   // Sanitization method
   sanitizeObject(data, fields) {
      const sanitized = { ...data };

      for (const [field, rules] of Object.entries(fields)) {
         if (sanitized[field]) {
            sanitized[field] = this.sanitizeValue(sanitized[field], rules);
         }
      }

      return sanitized;
   }

   // Value sanitization
   sanitizeValue(value, rules) {
      let sanitized = value;

      if (rules.trim && typeof sanitized === "string") {
         sanitized = sanitized.trim();
      }

      if (rules.lowercase && typeof sanitized === "string") {
         sanitized = sanitized.toLowerCase();
      }

      if (rules.uppercase && typeof sanitized === "string") {
         sanitized = sanitized.toUpperCase();
      }

      if (rules.escape) {
         sanitized = this.sanitizationRules.string(sanitized);
      }

      if (rules.email && typeof sanitized === "string") {
         sanitized = this.sanitizationRules.email(sanitized);
      }

      return sanitized;
   }

   // Model-based validation
   async validateAgainstModel(Model, data, operation) {
      const errors = [];

      try {
         // Create a temporary instance to validate
         const tempInstance = new Model(data);

         // Trigger mongoose validation
         await tempInstance.validate();

         // Additional custom validations based on operation
         if (operation === "create") {
            // Check for unique constraints
            const uniqueFields = this.getUniqueFields(Model.schema);
            for (const field of uniqueFields) {
               if (data[field]) {
                  const existing = await Model.findOne({ [field]: data[field] });
                  if (existing) {
                     errors.push({
                        field,
                        message: `${field} already exists`,
                        code: "DUPLICATE_VALUE",
                     });
                  }
               }
            }
         }

         if (operation === "update") {
            // Add update-specific validations
            const immutableFields = this.getImmutableFields(Model.schema);
            for (const field of immutableFields) {
               if (data[field] !== undefined) {
                  errors.push({
                     field,
                     message: `${field} cannot be updated`,
                     code: "IMMUTABLE_FIELD",
                  });
               }
            }
         }
      } catch (mongooseError) {
         // Handle mongoose validation errors
         if (mongooseError.errors) {
            for (const [field, error] of Object.entries(mongooseError.errors)) {
               errors.push({
                  field,
                  message: error.message,
                  code: "MONGOOSE_VALIDATION",
               });
            }
         } else {
            errors.push({
               field: "general",
               message: mongooseError.message,
               code: "MONGOOSE_ERROR",
            });
         }
      }

      return errors;
   }

   // Helper methods for model introspection
   getUniqueFields(schema) {
      const uniqueFields = [];
      schema.eachPath((path, schemaType) => {
         if (schemaType.options.unique) {
            uniqueFields.push(path);
         }
      });
      return uniqueFields;
   }

   getImmutableFields(schema) {
      const immutableFields = [];
      schema.eachPath((path, schemaType) => {
         if (schemaType.options.immutable) {
            immutableFields.push(path);
         }
      });
      return immutableFields;
   }

   // Predefined validation schemas
   get userSchema() {
      return {
         email: { type: "string", required: true, email: true },
         firstName: { type: "string", required: true, minLength: 2, maxLength: 50 },
         lastName: { type: "string", required: true, minLength: 2, maxLength: 50 },
         password: { type: "string", required: true, minLength: 8 },
      };
   }

   get organizationSchema() {
      return {
         name: { type: "string", required: true, minLength: 2, maxLength: 100 },
         domain: { type: "string", required: true },
         description: { type: "string", maxLength: 500 },
      };
   }

   get productSchema() {
      return {
         name: { type: "string", required: true, minLength: 2, maxLength: 200 },
         sku: { type: "string", required: true, minLength: 2, maxLength: 50 },
         price: { type: "number", required: true, min: 0 },
         stockQuantity: { type: "number", required: true, min: 0 },
      };
   }
}

const validationMiddleware = new ValidationMiddleware();

export default validationMiddleware;

// Export individual middleware functions
export const validateBody = validationMiddleware.validateBody.bind(validationMiddleware);
export const validateQuery = validationMiddleware.validateQuery.bind(validationMiddleware);
export const validateParams = validationMiddleware.validateParams.bind(validationMiddleware);
export const validate = validationMiddleware.validate.bind(validationMiddleware);
export const sanitizeBody = validationMiddleware.sanitizeBody.bind(validationMiddleware);
export const validateAndSanitize = validationMiddleware.validateAndSanitize.bind(validationMiddleware);
export const validateModel = validationMiddleware.validateModel.bind(validationMiddleware);
export const validateBusinessRules = validationMiddleware.validateBusinessRules.bind(validationMiddleware);
export const validateFileUpload = validationMiddleware.validateFileUpload.bind(validationMiddleware);
