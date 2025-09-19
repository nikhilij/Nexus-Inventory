// middleware/TransactionMiddleware.js
import mongoose from "mongoose";

class TransactionMiddleware {
   constructor(options = {}) {
      this.logErrors = options.logErrors !== false;
      this.retryAttempts = options.retryAttempts || 3;
      this.retryDelay = options.retryDelay || 100; // ms
   }

   // Middleware to manage database transactions
   transaction() {
      return async (req, res, next) => {
         const session = await mongoose.startSession();
         req.dbSession = session;

         try {
            await this.executeWithRetry(async () => {
               session.startTransaction();
               await this.executeNext(req, res, next, session);
            }, session);
         } catch (error) {
            if (this.logErrors) {
               console.error("Transaction failed after retries:", error);
            }
            // Ensure transaction is aborted on final failure
            if (session.inTransaction()) {
               await session.abortTransaction();
            }
            session.endSession();
            next(error);
         }
      };
   }

   // Execute the next middleware in the chain and handle transaction commit/abort
   async executeNext(req, res, next, session) {
      const originalEnd = res.end;
      const originalJson = res.json;
      let transactionCommitted = false;

      const commitTransaction = async () => {
         if (session.inTransaction() && !transactionCommitted) {
            await session.commitTransaction();
            transactionCommitted = true;
            session.endSession();
         }
      };

      const abortTransaction = async () => {
         if (session.inTransaction() && !transactionCommitted) {
            await session.abortTransaction();
            transactionCommitted = true;
            session.endSession();
         }
      };

      res.end = async function (...args) {
         if (res.statusCode >= 200 && res.statusCode < 300) {
            await commitTransaction();
         } else {
            await abortTransaction();
         }
         return originalEnd.apply(this, args);
      };

      res.json = async function (...args) {
         if (res.statusCode >= 200 && res.statusCode < 300) {
            await commitTransaction();
         } else {
            await abortTransaction();
         }
         return originalJson.apply(this, args);
      };

      // Handle request closing prematurely
      req.on("close", async () => {
         await abortTransaction();
      });

      next();
   }

   // Retry logic for transient transaction errors
   async executeWithRetry(fn, session) {
      let attempts = 0;
      while (attempts < this.retryAttempts) {
         try {
            await fn();
            return;
         } catch (error) {
            attempts++;
            if (error.hasErrorLabel("TransientTransactionError") && attempts < this.retryAttempts) {
               if (this.logErrors) {
                  console.log(`Transient transaction error. Retrying... (Attempt ${attempts})`);
               }
               if (session.inTransaction()) {
                  await session.abortTransaction();
               }
               await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempts));
            } else {
               throw error;
            }
         }
      }
   }

   // Manual transaction control for specific services
   async withTransaction(callback) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
         const result = await callback(session);
         await session.commitTransaction();
         return result;
      } catch (error) {
         await session.abortTransaction();
         throw error;
      } finally {
         session.endSession();
      }
   }
}

const transactionMiddleware = new TransactionMiddleware({
   retryAttempts: 3,
   retryDelay: 200,
});

export default transactionMiddleware;

// Export individual middleware functions
export const transaction = transactionMiddleware.transaction.bind(transactionMiddleware);
export const withTransaction = transactionMiddleware.withTransaction.bind(transactionMiddleware);
