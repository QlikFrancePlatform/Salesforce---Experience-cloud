# Qlik Embed Salesforce Experience Cloud

[🇬🇧 English version available here](README_EN.md)

Ce projet permet d'intégrer des composants Qlik Cloud dans Salesforce Experience Cloud en utilisant des composants Lightning Web Components (LWC) et des pages Visualforce.

## 🎯 Vue d'ensemble

Ce projet résout les défis d'intégration entre Qlik Cloud et Salesforce, notamment :
- Les conflits Content Security Policy (CSP)
- Les erreurs WebAuthn
- L'intégration sécurisée des composants Qlik
- La gestion de l'authentification OAuth2

## 🏗️ Architecture du projet

### Composants principaux

1. **`qlikEmbed` LWC** - Composant Lightning Web Component réutilisable
2. **`qlikEmbedPage`** - Page Visualforce de test avec intégration Qlik
3. **`oauthCallback`** - Page de callback OAuth pour l'authentification
4. **`qlikEmbedPageAuth`** - Page d'authentification Qlik

### Structure des fichiers

```
force-app/main/default/
├── lwc/
│   └── qlikEmbed/
│       ├── qlikEmbed.js          # Logique du composant
│       ├── qlikEmbed.html        # Template HTML
│       ├── qlikEmbed.css         # Styles CSS
│       └── qlikEmbed.js-meta.xml # Métadonnées LWC
├── pages/
│   ├── qlikEmbedPage.page        # Page principale de test
│   ├── qlikEmbedPage.page-meta.xml
│   ├── oauthCallback.page        # Page de callback OAuth
│   ├── oauthCallback.page-meta.xml
│   ├── qlikEmbedPageAuth.page    # Page d'authentification
│   └── qlikEmbedPageAuth.page-meta.xml
└── flexipages/
    └── qlikEmbedTest.flexipage-meta.xml # Page Lightning de test
```

## 🚀 Installation et déploiement

### Prérequis

- Salesforce CLI (sf) installé
- Accès à un org Salesforce Experience Cloud
- Compte Qlik Cloud avec Web Integration ID

### Étapes de déploiement

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd "Salesforce - Experience cloud"
   ```

2. **Authentification Salesforce**
   ```bash
   sf org login web --set-default-dev-hub
   ```

3. **Déployer les composants LWC**
   ```bash
   sf project deploy start --source-dir force-app/main/default/lwc --target-org <your-org-alias>
   ```

4. **Déployer les pages Visualforce**
   ```bash
   sf project deploy start --source-dir force-app/main/default/pages --target-org <your-org-alias>
   ```

5. **Déployer les pages Lightning**
   ```bash
   sf project deploy start --source-dir force-app/main/default/flexipages --target-org <your-org-alias>
   ```

## ⚙️ Configuration

### Configuration Qlik Cloud

Chaque composant nécessite la configuration suivante :

```javascript
// Configuration dans les pages Visualforce
<script 
    type="text/javascript" 
    src="https://cdn.jsdelivr.net/npm/@qlik/embed-web-components@1/dist/index.min.js"
    data-host="https://your-instance.qlikcloud.com"
    data-web-integration-id="YOUR_WEB_INTEGRATION_ID"
    data-cross-site-cookies="true">
</script>
```

### Variables d'environnement

- `QLIK_HOST` - URL de votre instance Qlik Cloud
- `QLIK_WEB_INTEGRATION_ID` - ID d'intégration web Qlik
- `QLIK_CLIENT_ID` - CLIENT_ID de auht Qlik Cloud
- `QLIK_APP_ID` - ID de l'application Qlik
- `QLIK_OBJECT_ID` - ID de l'objet Qlik à afficher

## 🔧 Utilisation

### Composant LWC

```html
<!-- Dans une page Lightning -->
<c:qlikEmbed 
    app-id="your-app-id"
    object-id="your-object-id"
    ui="analytics/chart">
</c:qlikEmbed>
```

### Page Visualforce

```html
<!-- Composant Qlik direct -->
<qlik-embed
    ui="analytics/chart"
    app-id="your-app-id"
    object-id="your-object-id">
</qlik-embed>
```

### Page de callback OAuth

L'URL de callback doit être configurée dans Qlik Cloud :
```
https://your-org.my.salesforce.com/apex/oauthCallback
```

## 🛠️ Résolution des problèmes

### Erreurs CSP (Content Security Policy)

**Problème** : Blocage des scripts externes ou inline
**Solution** : Utilisation des pages Visualforce avec configuration des attributs `data-*`

### Erreurs WebAuthn

**Problème** : Conflits avec l'API WebAuthn du navigateur
**Solution** : Désactivation temporaire de `navigator.credentials` pendant le chargement

### Erreurs de module

**Problème** : `No MODULE named markup://qlik:embed found`
**Solution** : Création dynamique des éléments `<qlik-embed>` via JavaScript

## 📱 Test et validation

### URLs de test

1. **Page principale** : `/apex/qlikEmbedPage`
2. **Page d'authentification** : `/apex/qlikEmbedPageAuth`
3. **Callback OAuth** : `/apex/oauthCallback`
4. **Page Lightning** : Utiliser Lightning App Builder

### Vérifications

- Console du navigateur sans erreurs
- Composant Qlik visible et fonctionnel
- Authentification OAuth fonctionnelle
- Pas de violations CSP

## 🔒 Sécurité

### Bonnes pratiques

- Utilisation de HTTPS pour toutes les communications
- Validation des paramètres OAuth
- Gestion sécurisée des tokens d'authentification
- Respect des politiques CSP de Salesforce

### Authentification

- OAuth2 avec Qlik Cloud
- Gestion des redirections sécurisées
- Validation des états (state) OAuth
- Gestion des erreurs d'authentification

## 📚 Ressources

### Documentation officielle

- [Salesforce LWC Documentation](https://developer.salesforce.com/docs/component-library/documentation/lwc)
- [Qlik Embed Web Components](https://qlik.dev/apis/embed-web-components/)
- [Salesforce Visualforce](https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_intro.htm)

### Outils de développement

- Salesforce CLI
- Salesforce Developer Console
- Lightning App Builder
- Qlik Cloud Console

## 🤝 Contribution

### Comment contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- Respecter les conventions Salesforce
- Commenter le code complexe
- Tester avant de déployer
- Documenter les nouvelles fonctionnalités

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème :

- Créer une issue sur GitHub
- Consulter la documentation Salesforce
- Contacter l'équipe de développement

## 🔄 Versions

### v1.0.0 (Actuelle)
- Composant LWC qlikEmbed
- Pages Visualforce de test
- Gestion OAuth callback
- Résolution des conflits WebAuthn
- Support CSP Salesforce

### Roadmap
- [ ] Support des thèmes personnalisés
- [ ] Gestion des erreurs avancée
- [ ] Tests automatisés
- [ ] Documentation API
- [ ] Exemples d'utilisation

---

**Note** : Ce projet est maintenu par magikcypress Pour les mises à jour et le support, consultez régulièrement ce README.
