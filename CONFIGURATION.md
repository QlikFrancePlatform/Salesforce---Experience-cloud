# Guide de Configuration - Variables d'Environnement

Ce projet utilise **Custom Metadata Types (CMT)** pour gérer les variables d'environnement Qlik. Cette approche permet de :

- ✅ Séparer la configuration du code
- ✅ Gérer différentes configurations (dev, staging, prod)
- ✅ Modifier les valeurs sans déployer de code
- ✅ Suivre les changements dans le contrôle de version

## 📋 Structure

### Custom Metadata Type : `QlikConfig__mdt`

Le Custom Metadata Type `QlikConfig__mdt` contient les champs suivants :

| Champ | Type | Description |
|-------|------|-------------|
| `Host__c` | URL | URL du tenant Qlik Cloud (ex: `https://<TENANT_NAME>.eu.qlikcloud.com`) |
| `WebIntegrationId__c` | Text | ID d'intégration web Qlik pour l'authentification |
| `ClientId__c` | Text | Client ID Auth0 pour l'authentification OAuth2 (optionnel) |
| `RedirectUri__c` | URL | URI de redirection OAuth2 (optionnel) |
| `DefaultAppId__c` | Text | ID de l'application Qlik par défaut (optionnel) |
| `IsActive__c` | Checkbox | Indique si cette configuration est active |

### Classe Apex : `QlikConfigService`

La classe `QlikConfigService` fournit des méthodes pour récupérer la configuration :

- `getActiveConfig()` : Récupère la configuration active
- `getConfigByName(String)` : Récupère une configuration par son DeveloperName
- `getHost()` : Récupère uniquement le host
- `getWebIntegrationId()` : Récupère uniquement le Web Integration ID
- `getConfig()` : Récupère toute la configuration en une Map (méthode `@AuraEnabled`)

## 🚀 Configuration Initiale

### 1. Déployer les métadonnées

```bash
# Déployer le Custom Metadata Type et les champs
sf project deploy start --source-dir force-app/main/default/objects/QlikConfig__mdt

# Déployer la classe Apex
sf project deploy start --source-dir force-app/main/default/classes/QlikConfigService.cls

# Déployer l'enregistrement par défaut (optionnel)
sf project deploy start --source-dir force-app/main/default/customMetadata
```

### 2. Créer/Modifier un enregistrement de configuration

#### Via l'interface Salesforce

1. Aller dans **Setup** → **Custom Metadata Types**
2. Cliquer sur **Manage Qlik Configuration Records**
3. Cliquer sur **New** ou modifier l'enregistrement existant
4. Remplir les champs :
   - **Label** : Nom de la configuration (ex: "Production", "Development")
   - **Host** : URL du tenant Qlik Cloud
   - **Web Integration ID** : ID d'intégration web
   - **Client ID** : (Optionnel) Client ID Auth0
   - **Redirect URI** : (Optionnel) URI de redirection OAuth2
   - **Default App ID** : (Optionnel) ID de l'application par défaut
   - **Is Active** : Cocher pour activer cette configuration

#### Via les fichiers de métadonnées

Créer un fichier dans `force-app/main/default/customMetadata/QlikConfig__mdt/` avec le nom `QlikConfig__mdt.{RecordName}.md-meta.xml` :

**Exemple :** `QlikConfig__mdt.Production.md-meta.xml`

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

**Important :** Le nom du fichier doit suivre le format `{CustomMetadataType}__mdt.{RecordName}.md-meta.xml`

## 🔧 Utilisation dans les Composants LWC

### Composant `qlikEmbed`

Le composant charge automatiquement la configuration depuis Custom Metadata Types. Les valeurs peuvent être surchargées via les attributs `@api` :

```html
<!-- Utilise la configuration par défaut -->
<c:qlikEmbed 
    object-id="htaMkv"
    ui="analytics/chart">
</c:qlikEmbed>

<!-- Surcharge la configuration -->
<c:qlikEmbed 
    host="https://custom.qlikcloud.com"
    web-integration-id="CUSTOM_ID"
    app-id="custom-app-id"
    object-id="htaMkv">
</c:qlikEmbed>
```

### Composant `qlikEmbedEnigma`

Même principe pour `qlikEmbedEnigma` :

```html
<!-- Utilise la configuration par défaut -->
<c:qlikEmbedEnigma
    object-ids="htaMkv,YGN"
    auth-type="webIntegration">
</c:qlikEmbedEnigma>

<!-- Surcharge avec OAuth2 -->
<c:qlikEmbedEnigma
    tenant="custom.qlikcloud.com"
    client-id="custom-client-id"
    auth-type="oauth2"
    object-ids="htaMkv,YGN">
</c:qlikEmbedEnigma>
```

## 🔄 Gestion de Plusieurs Environnements

### Scénario : Dev, Staging, Production

1. **Créer 3 enregistrements** avec des DeveloperName différents :
   - `QlikConfig__mdt.Development`
   - `QlikConfig__mdt.Staging`
   - `QlikConfig__mdt.Production`

2. **Activer la bonne configuration** :
   - Dans chaque org, cocher `IsActive__c = true` pour la configuration appropriée
   - Ou utiliser `getConfigByName()` dans Apex pour sélectionner une configuration spécifique

3. **Déployer les configurations** :
   ```bash
   # Déployer toutes les configurations
   sf project deploy start --source-dir force-app/main/default/customMetadata
   ```

## 📝 Bonnes Pratiques

1. **Ne jamais commiter de secrets** : Les valeurs sensibles dans les fichiers de métadonnées doivent être gérées avec précaution
2. **Utiliser des valeurs par défaut** : Les composants LWC ont des valeurs de fallback si la configuration échoue
3. **Tester après modification** : Toujours tester après avoir modifié une configuration
4. **Documenter les changements** : Documenter les raisons des changements de configuration

## 🔍 Dépannage

### La configuration n'est pas chargée

1. Vérifier qu'un enregistrement `QlikConfig__mdt` existe avec `IsActive__c = true`
2. Vérifier les permissions : l'utilisateur doit avoir accès au Custom Metadata Type
3. Vérifier les logs Apex : `System.debug` dans `QlikConfigService`

### Valeurs par défaut utilisées

Si les composants utilisent les valeurs de fallback (codées en dur), cela signifie :
- La configuration n'a pas pu être chargée
- Aucun enregistrement actif n'existe
- Une erreur s'est produite lors du chargement

Vérifier la console du navigateur pour les erreurs.

## 🔐 Sécurité

- Les Custom Metadata Types sont **déployables** mais peuvent être **protégés** avec `protected = true`
- Pour les secrets sensibles, considérer l'utilisation de **Named Credentials** ou **Protected Custom Settings**
- Ne jamais exposer les valeurs de configuration dans les logs ou les messages d'erreur

