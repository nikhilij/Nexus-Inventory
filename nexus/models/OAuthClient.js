// models/OAuthClient.js
import mongoose from "mongoose";
import crypto from "crypto";

const oauthClientSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
      },
      description: {
         type: String,
         trim: true,
         maxlength: 500,
      },
      clientId: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      clientSecret: {
         type: String,
         required: true,
         trim: true,
      },
      clientSecretHash: {
         type: String,
         required: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      applicationType: {
         type: String,
         enum: ["web", "native", "spa", "service"],
         default: "web",
      },
      grantTypes: [
         {
            type: String,
            enum: ["authorization_code", "implicit", "password", "client_credentials", "refresh_token"],
            required: true,
         },
      ],
      responseTypes: [
         {
            type: String,
            enum: ["code", "token", "id_token"],
            required: true,
         },
      ],
      redirectUris: [
         {
            type: String,
            required: true,
            validate: {
               validator: function (v) {
                  return /^https?:\/\/.+/.test(v);
               },
               message: "Redirect URI must be a valid HTTP/HTTPS URL",
            },
         },
      ],
      postLogoutRedirectUris: [
         {
            type: String,
            validate: {
               validator: function (v) {
                  return /^https?:\/\/.+/.test(v);
               },
               message: "Post logout redirect URI must be a valid HTTP/HTTPS URL",
            },
         },
      ],
      scopes: [
         {
            type: String,
            enum: ["openid", "profile", "email", "address", "phone", "offline_access"],
            trim: true,
         },
      ],
      tokenEndpointAuthMethod: {
         type: String,
         enum: ["client_secret_basic", "client_secret_post", "client_secret_jwt", "private_key_jwt", "none"],
         default: "client_secret_basic",
      },
      jwksUri: String,
      jwks: {
         keys: [
            {
               kty: String,
               use: String,
               kid: String,
               n: String,
               e: String,
            },
         ],
      },
      idTokenSignedResponseAlg: {
         type: String,
         enum: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"],
         default: "RS256",
      },
      userinfoSignedResponseAlg: {
         type: String,
         enum: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"],
         default: "RS256",
      },
      accessTokenLifetime: {
         type: Number,
         default: 3600, // 1 hour
         min: 60,
         max: 86400, // 24 hours
      },
      refreshTokenLifetime: {
         type: Number,
         default: 2592000, // 30 days
         min: 3600,
         max: 31536000, // 1 year
      },
      idTokenLifetime: {
         type: Number,
         default: 3600, // 1 hour
         min: 60,
         max: 86400, // 24 hours
      },
      isActive: {
         type: Boolean,
         default: true,
      },
      isConfidential: {
         type: Boolean,
         default: true,
      },
      logoUri: {
         type: String,
         validate: {
            validator: function (v) {
               return !v || /^https?:\/\/.+/.test(v);
            },
            message: "Logo URI must be a valid HTTP/HTTPS URL",
         },
      },
      clientUri: {
         type: String,
         validate: {
            validator: function (v) {
               return !v || /^https?:\/\/.+/.test(v);
            },
            message: "Client URI must be a valid HTTP/HTTPS URL",
         },
      },
      policyUri: {
         type: String,
         validate: {
            validator: function (v) {
               return !v || /^https?:\/\/.+/.test(v);
            },
            message: "Policy URI must be a valid HTTP/HTTPS URL",
         },
      },
      tosUri: {
         type: String,
         validate: {
            validator: function (v) {
               return !v || /^https?:\/\/.+/.test(v);
            },
            message: "Terms of Service URI must be a valid HTTP/HTTPS URL",
         },
      },
      contacts: [
         {
            type: String,
            validate: {
               validator: function (v) {
                  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
               },
               message: "Contact must be a valid email address",
            },
         },
      ],
      usage: {
         totalTokensIssued: {
            type: Number,
            default: 0,
            min: 0,
         },
         lastUsed: Date,
         activeTokens: {
            type: Number,
            default: 0,
            min: 0,
         },
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
oauthClientSchema.index({ clientId: 1 });
oauthClientSchema.index({ organization: 1 });
oauthClientSchema.index({ createdBy: 1 });
oauthClientSchema.index({ isActive: 1 });
oauthClientSchema.index({ applicationType: 1 });

// Compound indexes
oauthClientSchema.index({ organization: 1, clientId: 1 }, { unique: true });
oauthClientSchema.index({ organization: 1, isActive: 1 });

// Virtuals
oauthClientSchema.virtual("isExpired").get(function () {
   // OAuth clients don't typically expire, but this could be extended
   return false;
});

oauthClientSchema.virtual("isValid").get(function () {
   return this.isActive;
});

// Pre-save middleware
oauthClientSchema.pre("save", function (next) {
   if (this.isModified("clientSecret")) {
      // In a real app, you'd hash the client secret properly
      this.clientSecretHash = crypto.createHash("sha256").update(this.clientSecret).digest("hex");
   }
   next();
});

// Instance methods
oauthClientSchema.methods.hasGrantType = function (grantType) {
   return this.grantTypes.includes(grantType);
};

oauthClientSchema.methods.hasResponseType = function (responseType) {
   return this.responseTypes.includes(responseType);
};

oauthClientSchema.methods.hasScope = function (scope) {
   return this.scopes.includes(scope);
};

oauthClientSchema.methods.isRedirectUriValid = function (uri) {
   return this.redirectUris.includes(uri);
};

oauthClientSchema.methods.recordUsage = function () {
   this.usage.totalTokensIssued += 1;
   this.usage.lastUsed = new Date();
   this.usage.activeTokens += 1;
   return this.save();
};

oauthClientSchema.methods.regenerateSecret = function () {
   const newSecret = crypto.randomBytes(32).toString("hex");
   this.clientSecret = newSecret;
   return this.save();
};

oauthClientSchema.methods.deactivate = function () {
   this.isActive = false;
   return this.save();
};

oauthClientSchema.methods.reactivate = function () {
   this.isActive = true;
   return this.save();
};

// Static methods
oauthClientSchema.statics.findByClientId = function (clientId, organizationId) {
   return this.findOne({
      clientId: clientId,
      organization: organizationId,
      isActive: true,
   });
};

oauthClientSchema.statics.findActiveClients = function (organizationId) {
   return this.find({
      organization: organizationId,
      isActive: true,
   }).populate("createdBy", "name email");
};

oauthClientSchema.statics.findByApplicationType = function (organizationId, applicationType) {
   return this.find({
      organization: organizationId,
      applicationType: applicationType,
      isActive: true,
   });
};

oauthClientSchema.statics.validateClient = function (clientId, clientSecret, organizationId) {
   const secretHash = crypto.createHash("sha256").update(clientSecret).digest("hex");
   return this.findOne({
      clientId: clientId,
      clientSecretHash: secretHash,
      organization: organizationId,
      isActive: true,
   });
};

const OAuthClient = mongoose.model("OAuthClient", oauthClientSchema);

export default OAuthClient;
