# Configuration Guide - Environment Variables

This project uses **Custom Metadata Types (CMT)** to manage Qlik environment variables. This approach allows you to:

- ✅ Separate configuration from code
- ✅ Manage different configurations (dev, staging, prod)
- ✅ Modify values without deploying code
- ✅ Track changes in version control

## 📋 Structure

### Custom Metadata Type: `QlikConfig__mdt`

The Custom Metadata Type `QlikConfig__mdt` contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `Host__c` | URL | Qlik Cloud tenant URL (e.g., `https://<TENANT_NAME>.eu.qlikcloud.com`) |
| `WebIntegrationId__c` | Text | Qlik web integration ID for authentication |
| `ClientId__c` | Text | Auth0 Client ID for OAuth2 authentication (optional) |
| `RedirectUri__c` | URL | OAuth2 redirect URI (optional) |
| `DefaultAppId__c` | Text | Default Qlik application ID (optional) |
| `IsActive__c` | Checkbox | Indicates if this configuration is active |

### Apex Class: `QlikConfigService`

The `QlikConfigService` class provides methods to retrieve configuration:

- `getActiveConfig()` : Retrieves the active configuration
- `getConfigByName(String)` : Retrieves a configuration by its DeveloperName
- `getHost()` : Retrieves only the host
- `getWebIntegrationId()` : Retrieves only the Web Integration ID
- `getConfig()` : Retrieves the entire configuration as a Map (`@AuraEnabled` method)

## 🚀 Initial Configuration

### 1. Deploy Metadata

```bash
# Deploy the Custom Metadata Type and fields
sf project deploy start --source-dir force-app/main/default/objects/QlikConfig__mdt

# Deploy the Apex class
sf project deploy start --source-dir force-app/main/default/classes/QlikConfigService.cls

# Deploy the default record (optional)
sf project deploy start --source-dir force-app/main/default/customMetadata
```

### 2. Create/Modify a Configuration Record

#### Via Salesforce Interface

1. Go to **Setup** → **Custom Metadata Types**
2. Click **Manage Qlik Configuration Records**
3. Click **New** or modify the existing record
4. Fill in the fields:
   - **Label** : Configuration name (e.g., "Production", "Development")
   - **Host** : Qlik Cloud tenant URL
   - **Web Integration ID** : Web integration ID
   - **Client ID** : (Optional) Auth0 Client ID
   - **Redirect URI** : (Optional) OAuth2 redirect URI
   - **Default App ID** : (Optional) Default application ID
   - **Is Active** : Check to activate this configuration

#### Via Metadata Files

Create a file in `force-app/main/default/customMetadata/QlikConfig__mdt/` with the name `QlikConfig__mdt.{RecordName}.md-meta.xml`:

**Example:** `QlikConfig__mdt.Production.md-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <label>Production</label>
    <protected>false</protected>
    <values>
        <field>Host__c</field>
        <value xsi:type="xsd:string">https://your-tenant.qlikcloud.com</value>
    </values>
    <values>
        <field>WebIntegrationId__c</field>
        <value xsi:type="xsd:string">YOUR_WEB_INTEGRATION_ID</value>
    </values>
    <values>
        <field>IsActive__c</field>
        <value xsi:type="xsd:boolean">true</value>
    </values>
</CustomMetadata>
```

**Important:** The file name must follow the format `{CustomMetadataType}__mdt.{RecordName}.md-meta.xml`

## 🔧 Usage in LWC Components

### Component `qlikEmbed`

The component automatically loads configuration from Custom Metadata Types. Values can be overridden via `@api` attributes:

```html
<!-- Use default configuration -->
<c:qlikEmbed 
    object-id="htaMkv"
    ui="analytics/chart">
</c:qlikEmbed>

<!-- Override configuration -->
<c:qlikEmbed 
    host="https://custom.qlikcloud.com"
    web-integration-id="CUSTOM_ID"
    app-id="custom-app-id"
    object-id="htaMkv">
</c:qlikEmbed>
```

### Component `qlikEmbedEnigma`

Same principle for `qlikEmbedEnigma`:

```html
<!-- Use default configuration -->
<c:qlikEmbedEnigma
    object-ids="htaMkv,YGN"
    auth-type="webIntegration">
</c:qlikEmbedEnigma>

<!-- Override with OAuth2 -->
<c:qlikEmbedEnigma
    tenant="custom.qlikcloud.com"
    client-id="custom-client-id"
    auth-type="oauth2"
    object-ids="htaMkv,YGN">
</c:qlikEmbedEnigma>
```

## 🔄 Managing Multiple Environments

### Scenario: Dev, Staging, Production

1. **Create 3 records** with different DeveloperNames:
   - `QlikConfig__mdt.Development`
   - `QlikConfig__mdt.Staging`
   - `QlikConfig__mdt.Production`

2. **Activate the correct configuration**:
   - In each org, check `IsActive__c = true` for the appropriate configuration
   - Or use `getConfigByName()` in Apex to select a specific configuration

3. **Deploy configurations**:
   ```bash
   # Deploy all configurations
   sf project deploy start --source-dir force-app/main/default/customMetadata
   ```

## 📝 Best Practices

1. **Never commit secrets**: Sensitive values in metadata files must be handled carefully
2. **Use default values**: LWC components have fallback values if configuration fails
3. **Test after modification**: Always test after modifying a configuration
4. **Document changes**: Document the reasons for configuration changes

## 🔍 Troubleshooting

### Configuration Not Loading

1. Verify that a `QlikConfig__mdt` record exists with `IsActive__c = true`
2. Check permissions: the user must have access to the Custom Metadata Type
3. Check Apex logs: `System.debug` in `QlikConfigService`

### Default Values Being Used

If components are using fallback values (hardcoded), this means:
- Configuration could not be loaded
- No active record exists
- An error occurred during loading

Check the browser console for errors.

## 🔐 Security

- Custom Metadata Types are **deployable** but can be **protected** with `protected = true`
- For sensitive secrets, consider using **Named Credentials** or **Protected Custom Settings**
- Never expose configuration values in logs or error messages

