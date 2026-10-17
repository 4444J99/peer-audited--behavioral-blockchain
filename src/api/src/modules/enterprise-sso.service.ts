import { Injectable, Logger, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Pool } from "pg";
import { EmailService } from "./email/email.service";
import { EnterpriseScopeService } from "./b2b/enterprise-scope.service";

export interface EnterpriseSSOConfiguration {
  id: string;
  enterpriseId: string;
  name: string;
  providerType: "SAML" | "OIDC";
  metadataUrl?: string;
  entityId?: string;
  ssoUrl?: string;
  x509Cert?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  requiresUserAttributeMapping: boolean;
  userAttributeMapping?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseSSOConnection {
  id: string;
  enterpriseId: string;
  userId: string;
  email: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "FAILED";
  ssoProvider: string;
  ssoSubject?: string;
  token?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  lastLogin?: string;
  createdAt: string;
}

export interface SAMLRequest {
  id: string;
  enterpriseId: string;
  userId: string;
  response?: string;
  status: "INITIATED" | "SUCCESS" | "FAILED";
  errorMessage?: string;
  idpResponse?: Record<string, unknown>;
  createdAt: string;
}

@Injectable()
export class EnterpriseSSOService {
  private readonly logger = new Logger(EnterpriseSSOService.name);

  constructor(
    private readonly pool: Pool,
    private readonly emailService: EmailService,
    private readonly enterpriseScope: EnterpriseScopeService,
  ) {}

  async setupSSOConfig(
    enterpriseId: string,
    config: EnterpriseSSOConfiguration,
  ): Promise<EnterpriseSSOConfiguration> {
    this.logger.log(
      `Setting up SSO configuration for enterprise ${enterpriseId}`,
    );

    const result = await this.pool.query(
      `INSERT INTO enterprise_sso_credentials
       (enterprise_id, name, provider_type, metadata, signing_cert, client_secret,
        issuer_url, sso_url, public_key, metadata_url, api_key, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING *`,
      [
        enterpriseId,
        config.name,
        config.providerType,
        config.metadata,
        config.x509Cert || null,
        config.clientSecret || null,
        config.issuerUrl || null,
        config.ssoUrl || null,
        config.publicKey || null,
        config.metadataUrl || null,
        config.apiKey || null,
      ],
    );

    const row = result.rows[0];
    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      name: row.name,
      providerType: row.provider_type,
      metadataUrl: row.metadata_url,
      entityId: row.issuer_url,
      ssoUrl: row.sso_url,
      x509Cert: row.signing_cert,
      metadata: row.metadata,
      isActive: !result.rows[0].status || result.rows[0].status === "ACTIVE",
      requiresUserAttributeMapping:
        config.requiresUserAttributeMapping ?? false,
      userAttributeMapping: config.userAttributeMapping,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateSSOConfig(
    configId: string,
    updates: Partial<EnterpriseSSOConfiguration>,
  ): Promise<EnterpriseSSOConfiguration | null> {
    this.logger.log(
      `Updating SSO configuration ${configId}`,
    );

    const result = await this.pool.query(
      `UPDATE enterprise_sso_credentials
       SET name = COALESCE($1, name),
           provider_type = COALESCE($2, provider_type),
           metadata = COALESCE($3, metadata),
           signing_cert = COALESCE($4, signing_cert),
           client_secret = COALESCE($5, client_secret),
           issuer_url = COALESCE($6, issuer_url),
           sso_url = COALESCE($7, sso_url),
           public_key = COALESCE($8, public_key),
           metadata_url = COALESCE($9, metadata_url),
           api_key = COALESCE($10, api_key),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        updates.name || null,
        updates.providerType || null,
        updates.metadata || null,
        updates.x509Cert || null,
        updates.clientSecret || null,
        updates.issuerUrl || null,
        updates.ssoUrl || null,
        updates.publicKey || null,
        updates.metadataUrl || null,
        updates.apiKey || null,
        configId,
      ],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      name: row.name,
      providerType: row.provider_type,
      metadataUrl: row.metadata_url,
      entityId: row.issuer_url,
      ssoUrl: row.sso_url,
      x509Cert: row.signing_cert,
      metadata: row.metadata,
      isActive: !row.status || row.status === "ACTIVE",
      requiresUserAttributeMapping:
        updates.requiresUserAttributeMapping ?? false,
      userAttributeMapping: updates.userAttributeMapping,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getEnterpriseSSOConfigs(
    enterpriseId: string,
  ): Promise<EnterpriseSSOConfiguration[]> {
    const result = await this.pool.query(
      `SELECT * FROM enterprise_sso_credentials
       WHERE enterprise_id = $1
       ORDER BY name`,
      [enterpriseId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      enterpriseId: row.enterprise_id,
      name: row.name,
      providerType: row.provider_type,
      metadataUrl: row.metadata_url,
      entityId: row.issuer_url,
      ssoUrl: row.sso_url,
      x509Cert: row.signing_cert,
      metadata: row.metadata,
      isActive: !row.status || row.status === "ACTIVE",
      requiresUserAttributeMapping: false,
      userAttributeMapping: {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async connectEnterpriseSSO(
    userId: string,
    enterpriseId: string,
    provider: "SAML" | "OIDC",
    credentialId: string,
    token: string,
    metadata?: Record<string, unknown>,
  ): Promise<EnterpriseSSOConnection> {
    this.logger.log(
      `Connecting enterprise SSO for user ${userId} to enterprise ${enterpriseId}`,
    );

    const credential = await this.getSSOConfigById(credentialId);
    if (!credential) {
      throw new NotFoundException(
        `SSO configuration ${credentialId} not found`,
      );
    }

    const user = await this.getUserById(userId);
    if (!user || !user.email) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (user.enterpriseId !== enterpriseId) {
      throw new ForbiddenException(
        "User is not part of this enterprise" +
          "",
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const result = await this.pool.query(
      `INSERT INTO enterprise_sso_connections
       (enterprise_id, user_id, email, status, sso_provider, token,
        expires_at, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        enterpriseId,
        userId,
        user.email,
        "ACTIVE",
        credential.name,
        token,
        expiresAt.toISOString(),
        metadata,
      ],
    );

    const row = result.rows[0];

    await this.updateUserSSOInfo(userId, credential.name, "", expiresAt);

    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      email: row.email,
      status: row.status,
      ssoProvider: row.sso_provider,
      ssoSubject: row.sso_subject,
      token: row.token,
      expiresAt: row.expires_at,
      metadata: row.metadata,
      lastLogin: row.last_login,
      createdAt: row.created_at,
    };
  }

  async initSAMLAuthFlow(
    userId: string,
    enterpriseId: string,
  ): Promise<SAMLRequest> {
    const requestId = crypto.randomUUID();

    await this.pool.query(
      `INSERT INTO saml_requests (id, enterprise_id, user_id, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [requestId, enterpriseId, userId, "INITIATED"],
    );

    return {
      id: requestId,
      enterpriseId,
      userId,
      status: "INITIATED",
      createdAt: new Date().toISOString(),
    };
  }

  async completeSAMLAuth(
    requestId: string,
    response?: string,
  ): Promise<SAMLRequest> {
    const result = await this.pool.query(
      `UPDATE saml_requests
       SET response = $1, status = $2, idp_response = $3, created_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [response, "SUCCESS", { response }, requestId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`SAML request ${requestId} not found`);
    }

    const row = result.rows[0];

    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      response: row.response,
      status: row.status,
      errorMessage: row.error_message,
      idpResponse: row.idp_response,
      createdAt: row.created_at,
    };
  }

  async getEnterpriseSSOConnections(
    enterpriseId: string,
  ): Promise<EnterpriseSSOConnection[]> {
    const result = await this.pool.query(
      `SELECT * FROM enterprise_sso_connections
       WHERE enterprise_id = $1
       ORDER BY created_at DESC`,
      [enterpriseId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      email: row.email,
      status: row.status,
      ssoProvider: row.sso_provider,
      ssoSubject: row.sso_subject,
      token: row.token,
      expiresAt: row.expires_at,
      metadata: row.metadata,
      lastLogin: row.last_login,
      createdAt: row.created_at,
    }));
  }

  async disconnectEnterpriseSSO(
    connectionId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Disconnecting enterprise SSO connection ${connectionId} for user ${userId}`,
    );

    const result = await this.pool.query(
      `UPDATE enterprise_sso_connections
       SET status = $1, last_login = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      ["INACTIVE", connectionId, userId],
    );

    return { success: result.rows.length > 0 };
  }

  async getUserEnterpriseSSOStatus(
    userId: string,
  ): Promise<EnterpriseSSOConnection[]> {
    const result = await this.pool.query(
      `SELECT * FROM enterprise_sso_connections
       WHERE user_id = $1 AND status = $2
       ORDER BY created_at DESC`,
      [userId, "ACTIVE"],
    );

    return result.rows.map((row) => ({
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      email: row.email,
      status: row.status,
      ssoProvider: row.sso_provider,
      ssoSubject: row.sso_subject,
      token: row.token,
      expiresAt: row.expires_at,
      metadata: row.metadata,
      lastLogin: row.last_login,
      createdAt: row.created_at,
    }));
  }

  async validateEnterpriseSSOToken(
    token: string,
    enterpriseId: string,
  ): Promise<EnterpriseSSOConnection | null> {
    const result = await this.pool.query(
      `SELECT * FROM enterprise_sso_connections
       WHERE token = $1 AND enterprise_id = $2 AND status = $3
       AND expires_at > NOW()`,
      [token, enterpriseId, "ACTIVE"],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    await this.pool.query(
      `UPDATE enterprise_sso_connections
       SET last_login = NOW()
       WHERE id = $1`,
      [row.id],
    );

    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      userId: row.user_id,
      email: row.email,
      status: row.status,
      ssoProvider: row.sso_provider,
      ssoSubject: row.sso_subject,
      token: row.token,
      expiresAt: row.expires_at,
      metadata: row.metadata,
      lastLogin: new Date().toISOString(),
      createdAt: row.created_at,
    };
  }

  async getSSOConfigById(
    configId: string,
  ): Promise<EnterpriseSSOConfiguration | null> {
    const result = await this.pool.query(
      `SELECT * FROM enterprise_sso_credentials
       WHERE id = $1`,
      [configId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      enterpriseId: row.enterprise_id,
      name: row.name,
      providerType: row.provider_type,
      metadataUrl: row.metadata_url,
      entityId: row.issuer_url,
      ssoUrl: row.sso_url,
      x509Cert: row.signing_cert,
      metadata: row.metadata,
      isActive: !row.status || row.status === "ACTIVE",
      requiresUserAttributeMapping: false,
      userAttributeMapping: {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async getUserById(userId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT id, email, enterprise_id FROM users WHERE id = $1`,
      [userId],
    );

    return result.rows[0];
  }

  private async updateUserSSOInfo(
    userId: string,
    provider: string,
    subject?: string,
    expiresAt?: Date,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET sso_identity_provider = $1,
           sso_subject = $2,
           sso_expires_at = $3
       WHERE id = $4`,
      [provider, subject, expiresAt?.toISOString() || null, userId],
    );
  }
}