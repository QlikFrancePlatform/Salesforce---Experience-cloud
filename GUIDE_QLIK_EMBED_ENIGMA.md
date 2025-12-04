# Guide d'utilisation du composant LWC `qlikEmbedEnigma` dans Experience Cloud

## 📋 Vue d'ensemble

Le composant `qlikEmbedEnigma` est un composant Lightning Web Component (LWC) qui permet d'intégrer des objets Qlik Sense via Enigma.js dans Experience Cloud (Salesforce Sites).

## 🚀 Étapes pour utiliser le composant

### 1. Déployer le composant

Déployez le composant vers votre org Salesforce :

```bash
sf project deploy start --source-dir force-app/main/default/lwc/qlikEmbedEnigma
```

Ou via VS Code avec l'extension Salesforce :
- Clic droit sur le dossier `qlikEmbedEnigma` → **SFDX: Deploy Source to Org**

### 2. Accéder à Experience Builder

1. Allez dans **Setup** → Recherchez **Digital Experiences** → **All Sites**
2. Sélectionnez votre site Experience Cloud
3. Cliquez sur **Builder** pour ouvrir Experience Builder

### 3. Ajouter le composant à une page

1. Dans Experience Builder, ouvrez ou créez une page
2. Dans le panneau de gauche, recherchez **Custom** dans la liste des composants
3. Faites glisser **qlikEmbedEnigma** sur la page
4. Le composant apparaît avec ses valeurs par défaut

### 4. Configurer les propriétés

Cliquez sur le composant pour ouvrir le panneau de propriétés à droite. Vous pouvez configurer :

| Propriété | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| **Qlik Tenant** | URL du tenant Qlik Cloud (sans https://) |
| **Web Integration ID** | ID d'intégration web Qlik |
| **App ID** | ID de l'application Qlik |
| **Object IDs** | Liste des IDs d'objets Qlik (séparés par des virgules) |
| **Identity** | Identité de session | `SalesforcePortal` |
| **Height** | Hauteur du conteneur | `600px` |
| **Show Status** | Afficher les messages de statut | `false` |

### 5. Publier la page

1. Cliquez sur **Publish** en haut à droite
2. Vérifiez que la page est active
3. Testez la page en mode **Preview** ou en accédant à l'URL publique

## 🔧 Configuration CSP (Content Security Policy)

Assurez-vous que les domaines suivants sont autorisés dans les **Trusted Sites** de votre org :

1. Allez dans **Setup** → **CSP Trusted Sites**
2. Ajoutez les sites suivants :
   - **https://<tenant>.eu.qlikcloud.com** (ou votre tenant Qlik)
   - **wss://<tenant>.eu.qlikcloud.com** (pour les WebSockets)
   - **https://cdn.jsdelivr.net** (pour enigma.js)

## 📝 Notes importantes

### Structure du composant

- **Template HTML** : `qlikEmbedEnigma.html` - Structure d'affichage
- **JavaScript** : `qlikEmbedEnigma.js` - Logique métier (Enigma.js, authentification)
- **CSS** : `qlikEmbedEnigma.css` - Styles SLDS
- **Metadata** : `qlikEmbedEnigma.js-meta.xml` - Configuration et exposition

### Types d'objets supportés

Le composant détecte automatiquement le type d'objet Qlik et l'affiche :

- **KPI** : Valeur unique avec label
- **Table** : Tableau avec données structurées
- **List** : Liste de valeurs
- **Error** : Message d'erreur si l'objet ne peut pas être chargé
- **Empty** : Message si aucune donnée n'est disponible

### Authentification

Le composant utilise l'authentification Qlik Cloud avec :
- `qlik-web-integration-id` pour l'authentification
- CSRF token pour les requêtes sécurisées
- WebSocket pour la connexion Enigma.js

## 🐛 Dépannage

### Le composant ne charge pas les données

1. Vérifiez la console du navigateur (F12) pour les erreurs
2. Vérifiez que les CSP Trusted Sites sont configurés
3. Vérifiez que les IDs d'objets sont corrects dans Qlik Sense
4. Activez **Show Status** pour voir les messages de statut

### Erreur d'authentification

1. Vérifiez que le `webIntegrationId` est correct
2. Vérifiez que le tenant Qlik est accessible depuis Salesforce
3. Vérifiez que les cookies tiers sont autorisés dans le navigateur

### Les objets ne s'affichent pas

1. Vérifiez que les `objectIds` sont séparés par des virgules (sans espaces)
2. Vérifiez que les objets existent dans l'application Qlik
3. Vérifiez les permissions d'accès à l'application Qlik

## 📚 Ressources

- [Documentation Salesforce LWC](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
- [Documentation Enigma.js](https://github.com/qlik-oss/enigma.js)
- [Documentation Qlik Cloud](https://qlik.dev/)

