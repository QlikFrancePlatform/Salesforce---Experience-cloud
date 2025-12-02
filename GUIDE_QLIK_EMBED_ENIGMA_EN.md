# Guide for Using the LWC Component `qlikEmbedEnigma` in Experience Cloud

## 📋 Overview

The `qlikEmbedEnigma` component is a Lightning Web Component (LWC) that allows you to integrate Qlik Sense objects via Enigma.js into Experience Cloud (Salesforce Sites).

## 🚀 Steps to Use the Component

### 1. Deploy the Component

Deploy the component to your Salesforce org:

```bash
sf project deploy start --source-dir force-app/main/default/lwc/qlikEmbedEnigma
```

Or via VS Code with the Salesforce extension:
- Right-click on the `qlikEmbedEnigma` folder → **SFDX: Deploy Source to Org**

### 2. Access Experience Builder

1. Go to **Setup** → Search for **Digital Experiences** → **All Sites**
2. Select your Experience Cloud site
3. Click **Builder** to open Experience Builder

### 3. Add the Component to a Page

1. In Experience Builder, open or create a page
2. In the left panel, search for **Custom** in the component list
3. Drag **qlikEmbedEnigma** onto the page
4. The component appears with its default values

### 4. Configure Properties

Click on the component to open the properties panel on the right. You can configure:

| Property | Description | Default Value |
|----------|-------------|---------------|
| **Qlik Tenant** | Qlik Cloud tenant URL (without https://) |
| **Web Integration ID** | Qlik web integration ID |
| **App ID** | Qlik application ID |
| **Object IDs** | List of Qlik object IDs (comma-separated) |
| **Identity** | Session identity | `SalesforcePortal` |
| **Height** | Container height | `600px` |
| **Show Status** | Display status messages | `false` |

### 5. Publish the Page

1. Click **Publish** in the top right
2. Verify that the page is active
3. Test the page in **Preview** mode or by accessing the public URL

## 🔧 CSP (Content Security Policy) Configuration

Make sure the following domains are allowed in your org's **Trusted Sites**:

1. Go to **Setup** → **CSP Trusted Sites**
2. Add the following sites:
   - **https://qfp.eu.qlikcloud.com** (or your Qlik tenant)
   - **wss://qfp.eu.qlikcloud.com** (for WebSockets)
   - **https://cdn.jsdelivr.net** (for enigma.js)

## 📝 Important Notes

### Component Structure

- **HTML Template** : `qlikEmbedEnigma.html` - Display structure
- **JavaScript** : `qlikEmbedEnigma.js` - Business logic (Enigma.js, authentication)
- **CSS** : `qlikEmbedEnigma.css` - SLDS styles
- **Metadata** : `qlikEmbedEnigma.js-meta.xml` - Configuration and exposure

### Supported Object Types

The component automatically detects the Qlik object type and displays it:

- **KPI** : Single value with label
- **Table** : Table with structured data
- **List** : List of values
- **Error** : Error message if the object cannot be loaded
- **Empty** : Message if no data is available

### Authentication

The component uses Qlik Cloud authentication with:
- `qlik-web-integration-id` for authentication
- CSRF token for secure requests
- WebSocket for Enigma.js connection

## 🐛 Troubleshooting

### Component Not Loading Data

1. Check the browser console (F12) for errors
2. Verify that CSP Trusted Sites are configured
3. Verify that object IDs are correct in Qlik Sense
4. Enable **Show Status** to see status messages

### Authentication Error

1. Verify that the `webIntegrationId` is correct
2. Verify that the Qlik tenant is accessible from Salesforce
3. Verify that third-party cookies are allowed in the browser

### Objects Not Displaying

1. Verify that `objectIds` are separated by commas (no spaces)
2. Verify that objects exist in the Qlik application
3. Verify access permissions to the Qlik application

## 📚 Resources

- [Salesforce LWC Documentation](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
- [Enigma.js Documentation](https://github.com/qlik-oss/enigma.js)
- [Qlik Cloud Documentation](https://qlik.dev/)

