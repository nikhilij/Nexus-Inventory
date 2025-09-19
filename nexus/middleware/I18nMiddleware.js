// middleware/I18nMiddleware.js
import { I18n } from "i18n";
import path from "path";

class I18nMiddleware {
   constructor(options = {}) {
      this.i18n = new I18n({
         locales: options.locales || ["en", "es", "fr"],
         defaultLocale: options.defaultLocale || "en",
         directory: options.directory || path.join(process.cwd(), "locales"),
         autoReload: options.autoReload || process.env.NODE_ENV === "development",
         updateFiles: options.updateFiles || false,
         objectNotation: options.objectNotation || true,
         ...options,
      });
   }

   // Middleware to handle internationalization
   handler() {
      return (req, res, next) => {
         this.i18n.init(req, res);
         next();
      };
   }

   // Get translation function for a specific locale
   getTranslator(locale) {
      return this.i18n.__({ phrase: "", locale });
   }

   // Get current locale from request
   getLocale(req) {
      return req.getLocale();
   }

   // Set locale for the response
   setLocale(res, locale) {
      res.setLocale(locale);
   }

   // Get list of available locales
   getLocales() {
      return this.i18n.getLocales();
   }

   // Add a new locale
   addLocale(locale) {
      if (!this.getLocales().includes(locale)) {
         this.i18n.options.locales.push(locale);
      }
   }

   // Remove a locale
   removeLocale(locale) {
      this.i18n.options.locales = this.i18n.options.locales.filter((l) => l !== locale);
   }

   // Translate a phrase
   translate(phrase, locale, ...args) {
      return this.i18n.__({ phrase, locale }, ...args);
   }

   // Pluralization support
   translatePlural(singular, plural, count, locale) {
      return this.i18n.__n({ singular, plural, count, locale });
   }
}

const i18nMiddleware = new I18nMiddleware({
   locales: ["en", "es", "de", "fr"],
   defaultLocale: "en",
   queryParameter: "lang",
   cookie: "locale",
   header: "accept-language",
});

export default i18nMiddleware;

// Export individual middleware functions
export const i18nHandler = i18nMiddleware.handler.bind(i18nMiddleware);
export const getTranslator = i18nMiddleware.getTranslator.bind(i18nMiddleware);
export const getLocale = i18nMiddleware.getLocale.bind(i18nMiddleware);
export const setLocale = i18nMiddleware.setLocale.bind(i18nMiddleware);
export const translate = i18nMiddleware.translate.bind(i18nMiddleware);
export const translatePlural = i18nMiddleware.translatePlural.bind(i18nMiddleware);
