# Exemple de configuration QlikConfig__mdt

⚠️ **Ce fichier est un exemple. Ne commitez JAMAIS de fichiers avec des valeurs réelles.**

## Fichier XML d'exemple

Créez un fichier `QlikConfig__mdt.Default.md-meta.xml` dans :
```
force-app/main/default/customMetadata/QlikConfig__mdt/
```

Avec le contenu suivant (remplacez les valeurs entre `< >`) :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <label>Default Qlik Configuration</label>
    <protected>false</protected>
    <values>
        <field>Host__c</field>
        <value xsi:type="xsd:string">https://VOTRE_TENANT.eu.qlikcloud.com</value>
    </values>
    <values>
        <field>WebIntegrationId__c</field>
        <value xsi:type="xsd:string">VOTRE_WEB_INTEGRATION_ID</value>
    </values>
    <values>
        <field>ClientId__c</field>
        <value xsi:type="xsd:string">VOTRE_CLIENT_ID</value>
    </values>
    <values>
        <field>RedirectUri__c</field>
        <value xsi:type="xsd:string">https://VOTRE_URL_SALESFORCE/apex/oauthCallback</value>
    </values>
    <values>
        <field>DefaultAppId__c</field>
        <value xsi:type="xsd:string">VOTRE_APP_ID</value>
    </values>
    <values>
        <field>IsActive__c</field>
        <value xsi:type="xsd:boolean">true</value>
    </values>
</CustomMetadata>
```

## Où trouver ces valeurs ?

- **Host** : URL de votre instance Qlik Cloud (ex: `https://mon-tenant.eu.qlikcloud.com`)
- **Web Integration ID** : Disponible dans Qlik Cloud Management Console → Web Integrations
- **Client ID** : Disponible dans votre configuration OAuth2 (Auth0, etc.)
- **Redirect URI** : URL de votre org Salesforce + `/apex/oauthCallback`
- **Default App ID** : ID de l'application Qlik que vous souhaitez utiliser par défaut

## Sécurité

Les fichiers Custom Metadata avec des valeurs réelles sont automatiquement ignorés par Git (voir `.gitignore` ligne 46).
Cependant, si vous avez déjà committé des fichiers avec des informations confidentielles, vous devez :

1. Les supprimer de l'historique Git
2. Les remplacer par des placeholders
3. Configurer les vraies valeurs uniquement dans votre environnement Salesforce

