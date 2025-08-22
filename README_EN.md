# Qlik Embed Salesforce Experience Cloud

This project enables the integration of Qlik Cloud components into Salesforce Experience Cloud using Lightning Web Components (LWC) and Visualforce pages.

## 🎯 Overview

This project solves the integration challenges between Qlik Cloud and Salesforce, including:
- Content Security Policy (CSP) conflicts
- WebAuthn errors
- Secure integration of Qlik components
- OAuth2 authentication management

## 🏗️ Project Architecture

### Main Components

1. **`qlikEmbed` LWC** - Reusable Lightning Web Component
2. **`qlikEmbedPage`** - Visualforce test page with Qlik integration
3. **`oauthCallback`** - OAuth callback page for authentication
4. **`qlikEmbedPageAuth`** - Qlik authentication page

### File Structure

```
force-app/main/default/
├── lwc/
│   └── qlikEmbed/
│       ├── qlikEmbed.js          # Component logic
│       ├── qlikEmbed.html        # HTML template
│       ├── qlikEmbed.css         # CSS styles
│       └── qlikEmbed.js-meta.xml # LWC metadata
├── pages/
│   ├── qlikEmbedPage.page        # Main test page
│   ├── qlikEmbedPage.page-meta.xml
│   ├── oauthCallback.page        # OAuth callback page
│   ├── oauthCallback.page-meta.xml
│   ├── qlikEmbedPageAuth.page    # Authentication page
│   └── qlikEmbedPageAuth.page-meta.xml
└── flexipages/
    └── qlikEmbedTest.flexipage-meta.xml # Lightning test page
```

## 🚀 Installation and Deployment

### Prerequisites

- Salesforce CLI (sf) installed
- Access to a Salesforce Experience Cloud org
- Qlik Cloud account with Web Integration ID

### Deployment Steps

1. **Clone the project**
   ```bash
   git clone <repository-url>
   cd "Salesforce - Experience cloud"
   ```

2. **Salesforce authentication**
   ```bash
   sf org login web --set-default-dev-hub
   ```

3. **Deploy LWC components**
   ```bash
   sf project deploy start --source-dir force-app/main/default/lwc --target-org <your-org-alias>
   ```

4. **Deploy Visualforce pages**
   ```bash
   sf project deploy start --source-dir force-app/main/default/pages --target-org <your-org-alias>
   ```

5. **Deploy Lightning pages**
   ```bash
   sf project deploy start --source-dir force-app/main/default/flexipages --target-org <your-org-alias>
   ```

## ⚙️ Configuration

### Qlik Cloud Configuration

Each component requires the following configuration:

```javascript
// Configuration in Visualforce pages
<script 
    type="text/javascript" 
    src="https://cdn.jsdelivr.net/npm/@qlik/embed-web-components@1/dist/index.min.js"
    data-host="https://your-instance.qlikcloud.com"
    data-web-integration-id="YOUR_WEB_INTEGRATION_ID"
    data-cross-site-cookies="true">
</script>
```

### Environment Variables

- `QLIK_HOST` - URL of your Qlik Cloud instance
- `QLIK_WEB_INTEGRATION_ID` - Qlik web integration ID
- `QLIK_CLIENT_ID` - Qlik Cloud auth CLIENT_ID
- `QLIK_APP_ID` - Qlik application ID
- `QLIK_OBJECT_ID` - Qlik object ID to display

## 🔧 Usage

### LWC Component

```html
<!-- In a Lightning page -->
<c:qlikEmbed 
    app-id="your-app-id"
    object-id="your-object-id"
    ui="analytics/chart">
</c:qlikEmbed>
```

### Visualforce Page

```html
<!-- Direct Qlik component -->
<qlik-embed
    ui="analytics/chart"
    app-id="your-app-id"
    object-id="your-object-id">
</qlik-embed>
```

### OAuth Callback Page

The callback URL must be configured in Qlik Cloud:
```
https://your-org.my.salesforce.com/apex/oauthCallback
```

## 🛠️ Troubleshooting

### CSP (Content Security Policy) Errors

**Problem**: External or inline scripts blocked
**Solution**: Use Visualforce pages with `data-*` attribute configuration

### WebAuthn Errors

**Problem**: Conflicts with browser WebAuthn API
**Solution**: Temporarily disable `navigator.credentials` during loading

### Module Errors

**Problem**: `No MODULE named markup://qlik:embed found`
**Solution**: Dynamically create `<qlik-embed>` elements via JavaScript

## 📱 Testing and Validation

### Test URLs

1. **Main page**: `/apex/qlikEmbedPage`
2. **Authentication page**: `/apex/qlikEmbedPageAuth`
3. **OAuth callback**: `/apex/oauthCallback`
4. **Lightning page**: Use Lightning App Builder

### Verifications

- Browser console without errors
- Qlik component visible and functional
- OAuth authentication working
- No CSP violations

## 🔒 Security

### Best Practices

- Use HTTPS for all communications
- Validate OAuth parameters
- Secure token management
- Respect Salesforce CSP policies

### Authentication

- OAuth2 with Qlik Cloud
- Secure redirect handling
- OAuth state validation
- Authentication error handling

## 📚 Resources

### Official Documentation

- [Salesforce LWC Documentation](https://developer.salesforce.com/docs/component-library/documentation/lwc)
- [Qlik Embed Web Components](https://qlik.dev/apis/embed-web-components/)
- [Salesforce Visualforce](https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_intro.htm)

### Development Tools

- Salesforce CLI
- Salesforce Developer Console
- Lightning App Builder
- Qlik Cloud Console

## 🤝 Contributing

### How to Contribute

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Follow Salesforce conventions
- Comment complex code
- Test before deploying
- Document new features

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📞 Support

For any questions or issues:

- Create an issue on GitHub
- Consult Salesforce documentation
- Contact the development team

## 🔄 Versions

### v1.0.0 (Current)
- qlikEmbed LWC component
- Visualforce test pages
- OAuth callback handling
- WebAuthn conflict resolution
- Salesforce CSP support

### Roadmap
- [ ] Custom theme support
- [ ] Advanced error handling
- [ ] Automated testing
- [ ] API documentation
- [ ] Usage examples

---

**Note**: This project is maintained by [Magik Cypress](https://github.com/magikcypress). For updates and support, regularly consult this README.
