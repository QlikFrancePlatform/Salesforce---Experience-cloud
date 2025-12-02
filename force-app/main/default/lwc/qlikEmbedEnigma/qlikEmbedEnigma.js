import { LightningElement, api, track, wire } from 'lwc';
import getQlikAccessToken from '@salesforce/apex/QlikAuthService.getQlikAccessToken';
import getConfig from '@salesforce/apex/QlikConfigService.getConfig';
import USER_ID from '@salesforce/user/Id';

export default class QlikEmbedEnigma extends LightningElement {
    // Configuration properties
    @api tenant; // Will be set from config if not provided
    @api webIntegrationId; // Will be set from config if not provided
    @api appId; // Will be set from config if not provided
    @api objectIds = 'htaMkv,YGN,mrdwGJ,pwGchT'; // Comma-separated list
    @api identity = 'SalesforcePortal';
    @api height = '600px';
    @api showStatus = false;
    
    // Auth0/OAuth2 properties
    @api authType = 'webIntegration'; // 'webIntegration' or 'oauth2'
    @api clientId; // Will be set from config if not provided
    @api redirectUri; // Will be set from config if not provided
    
    @track statusMessage = '';
    @track statusClass = 'status-info';
    @track isLoading = true;
    @track hasError = false;
    @track indicators = [];
    @track loginUrl = '';
    @track configLoaded = false;
    
    enigmaSession = null;
    enigmaApp = null;
    scriptLoaded = false;
    timeoutId = null;
    
    // Wire service to load configuration from Custom Metadata Types
    @wire(getConfig)
    wiredConfig({ error, data }) {
        if (data) {
            // Extract tenant from host URL (remove https://)
            const hostUrl = data.host || '';
            const tenantValue = hostUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
            
            // Set default values from config if not provided via @api
            if (!this.tenant && tenantValue) {
                this.tenant = tenantValue;
            }
            if (!this.webIntegrationId && data.webIntegrationId) {
                this.webIntegrationId = data.webIntegrationId;
            }
            if (!this.appId && data.defaultAppId) {
                this.appId = data.defaultAppId;
            }
            if (!this.clientId && data.clientId) {
                this.clientId = data.clientId;
            }
            if (!this.redirectUri && data.redirectUri) {
                this.redirectUri = data.redirectUri;
            }
            this.configLoaded = true;
            // Initialize component once config is loaded
            if (!this.scriptLoaded) {
                this.initializeComponent();
            }
        } else if (error) {
            console.error('Error loading Qlik config:', error);
            this.showError('Configuration error: Unable to load Qlik settings. Please configure QlikConfig__mdt Custom Metadata Type.');
            // Don't use fallback values - require configuration
            if (!this.tenant || !this.webIntegrationId) {
                this.showError('Qlik configuration is required. Please set tenant and webIntegrationId properties or configure QlikConfig__mdt.');
                return;
            }
            this.configLoaded = true;
            this.initializeComponent();
        }
    }
    
    connectedCallback() {
        // Wait for config to load before initializing
        if (this.configLoaded || (this.tenant && this.webIntegrationId)) {
            this.initializeComponent();
        }
    }
    
    disconnectedCallback() {
        this.cleanup();
    }
    
    initializeComponent() {
        // Validate required properties
        if (!this.appId || !this.objectIds) {
            this.showError('App ID and Object IDs are required');
            return;
        }
        
        // Auto-detect redirect URI if not provided
        if (this.authType === 'oauth2' && !this.redirectUri) {
            const currentUrl = window.location.origin + window.location.pathname;
            // Try to construct callback URL (typically /apex/oauthCallback)
            this.redirectUri = currentUrl.replace(/\/[^\/]*$/, '/apex/oauthCallback');
        }
        
        this.statusMessage = 'Initializing Enigma.js...';
        this.statusClass = 'status-info';
        this.isLoading = true;
        
        // Load enigma.js script
        this.loadEnigmaScript();
    }
    
    isEnigmaLoaded() {
        return typeof window !== 'undefined' && typeof window.enigma !== 'undefined';
    }
    
    loadEnigmaScript() {
        // Check if already loaded
        if (this.isEnigmaLoaded()) {
            this.connectWithEnigma();
            return;
        }
        
        // Check if script tag exists
        if (document.querySelector('script[src*="enigma.js"]')) {
            // Wait for it to load
            const checkInterval = setInterval(() => {
                if (this.isEnigmaLoaded()) {
                    clearInterval(checkInterval);
                    this.connectWithEnigma();
                }
            }, 100);
            
            setTimeout(() => clearInterval(checkInterval), 10000);
            return;
        }
        
        this.statusMessage = 'Loading Enigma.js script...';
        
        // Create and load the script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://unpkg.com/enigma.js@2.7.3/enigma.min.js';
        script.setAttribute('data-enigma-script', 'true');
        
        script.onload = () => {
            this.scriptLoaded = true;
            this.connectWithEnigma();
        };
        
        script.onerror = () => {
            this.showError('Failed to load Enigma.js script. Please check your network connection.');
        };
        
        document.head.appendChild(script);
        
        // Timeout after 15 seconds
        this.timeoutId = setTimeout(() => {
            if (!this.scriptLoaded) {
                this.showError('Enigma.js script loading timeout. Please check your network connection.');
            }
        }, 15000);
    }
    
    async connectWithEnigma() {
        try {
            this.statusMessage = 'Connecting to Qlik Cloud...';
            this.statusClass = 'status-info';
            
            // Login to Qlik Cloud
            try {
                const loggedIn = await this.qlikLogin();
                if (!loggedIn) {
                    // Redirect is happening - don't show error, just return
                    this.statusMessage = 'Redirecting to Qlik Cloud for authentication...';
                    this.statusClass = 'status-info';
                    this.isLoading = true;
                    return;
                }
            } catch (error) {
                // Only show error if it's not a redirect (redirect doesn't throw)
                // qlikLogin will have already set the error message and loginUrl
                if (this.loginUrl && !this.hasError) {
                    // This shouldn't happen, but just in case
                    this.showError('Authentication required. Please use the button below.');
                }
                throw error; // Re-throw to be caught by outer catch
            }
            
            // Get authentication headers/token
            this.statusMessage = 'Preparing authentication...';
            let wsUrl;
            
            if (this.authType === 'oauth2') {
                // OAuth2 authentication - use access token
                const accessToken = this.getQlikAccessToken();
                if (!accessToken) {
                    throw new Error('OAuth2 access token not found. Please authenticate via Qlik Embed components first.');
                }
                
                // For OAuth2, include token in WebSocket URL or headers
                const identitySegment = this.identity ? `/identity/${encodeURIComponent(this.identity)}` : '';
                // Qlik Cloud WebSocket with OAuth2 token
                wsUrl = `wss://${this.tenant}/app/${this.appId}${identitySegment}?authorization=Bearer ${encodeURIComponent(accessToken)}`;
            } else {
                // Web Integration ID authentication
                const qcsHeaders = await this.getQCSHeaders();
                const queryParams = this.buildQueryParams(qcsHeaders);
                const identitySegment = this.identity ? `/identity/${encodeURIComponent(this.identity)}` : '';
                wsUrl = `wss://${this.tenant}/app/${this.appId}${identitySegment}?${queryParams}`;
            }
            
            // Load schema
            this.statusMessage = 'Loading Enigma.js schema...';
            const schema = await fetch('https://unpkg.com/enigma.js@2.7.3/schemas/12.612.0.json')
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Error loading schema: ${res.status}`);
                    }
                    return res.json();
                });
            
            // Create Enigma session
            this.statusMessage = 'Creating Enigma session...';
            const session = window.enigma.create({
                schema: schema,
                url: wsUrl
            });
            
            // Listen to events
            session.on('traffic:sent', (data) => console.log('enigma sent:', data));
            session.on('traffic:received', (data) => console.log('enigma received:', data));
            session.on('closed', () => console.log('enigma session closed'));
            
            // Open session
            const global = await session.open();
            this.statusMessage = 'Connected! Opening app...';
            
            // Open app
            const app = await global.openDoc(this.appId);
            this.statusMessage = 'App opened! Fetching data...';
            
            this.enigmaSession = session;
            this.enigmaApp = app;
            
            // Parse object IDs
            const objectIdArray = this.objectIds.split(',').map(id => id.trim()).filter(id => id);
            
            // Fetch data for each object
            this.indicators = [];
            for (let i = 0; i < objectIdArray.length; i++) {
                const objectId = objectIdArray[i];
                try {
                    const obj = await app.getObject(objectId);
                    const layout = await obj.getLayout();
                    
                    // Extract display data
                    const indicatorId = `indicator-${i}`;
                    const displayData = this.extractDisplayData(layout, objectId, indicatorId);
                    
                    this.indicators = [...this.indicators, {
                        id: indicatorId,
                        objectId: objectId,
                        data: displayData,
                        isKpi: displayData.type === 'kpi',
                        isTable: displayData.type === 'table',
                        isList: displayData.type === 'list',
                        isError: displayData.type === 'error',
                        isEmpty: displayData.type === 'empty'
                    }];
                    
                    // Listen for changes
                    obj.on('changed', async () => {
                        const updatedLayout = await obj.getLayout();
                        const updatedData = this.extractDisplayData(updatedLayout, objectId);
                        this.updateIndicator(objectId, updatedData);
                    });
                    
                } catch (error) {
                    console.error(`Error fetching object ${objectId}:`, error);
                    this.indicators = [...this.indicators, {
                        id: `indicator-${i}`,
                        objectId: objectId,
                        data: { type: 'error', message: error.message },
                        isKpi: false,
                        isTable: false,
                        isList: false,
                        isError: true,
                        isEmpty: false
                    }];
                }
            }
            
            this.showSuccess('Data loaded successfully!');
            this.isLoading = false;
            
        } catch (error) {
            // Don't show error if it's just a redirect happening (loginUrl set but no error shown yet)
            // or if qlikLogin already showed the error
            if (error.message && error.message.includes('authentication required') && this.loginUrl) {
                // Authentication error - qlikLogin already handled the UI
                console.log('Authentication required - redirect or manual login needed');
            } else if (!this.loginUrl || this.hasError) {
                // Real error - show it
                this.showError('Error connecting with Enigma.js: ' + error.message);
                console.error('Enigma connection error:', error);
            } else {
                // Redirect in progress - just log
                console.log('Redirecting for authentication...');
            }
        }
    }
    
    async getTokenViaSSO() {
        // Get token via Salesforce SSO using Apex service
        try {
            const token = await getQlikAccessToken({
                tenant: this.tenant,
                clientId: this.clientId,
                redirectUri: this.redirectUri
            });
            return token;
        } catch (error) {
            console.error('Error getting token via SSO:', error);
            // If Apex service fails, try alternative method
            // Use Salesforce user identity directly with Qlik
            return await this.getTokenWithSalesforceIdentity();
        }
    }
    
    async getTokenWithSalesforceIdentity() {
        // Alternative: Use Salesforce user identity directly
        // This requires Qlik Cloud to be configured to accept Salesforce identities
        try {
            // Get current user info from Salesforce
            // In Experience Cloud, we can use the session
            const userInfo = await this.getSalesforceUserInfo();
            
            if (!userInfo) {
                throw new Error('Unable to get Salesforce user information');
            }
            
            // Use the user identity to get a token from Qlik
            // This depends on your Qlik Cloud configuration
            // For Auth0 SSO, you might need to exchange the Salesforce identity
            // for a Qlik token via Auth0
            
            // For now, return null - this needs to be implemented based on
            // your specific Auth0/Qlik configuration
            return null;
        } catch (error) {
            console.error('Error getting token with Salesforce identity:', error);
            return null;
        }
    }
    
    async getSalesforceUserInfo() {
        // Get current user information from Salesforce
        // In LWC, we can use @salesforce/user/Id or make an API call
        try {
            // Use the imported USER_ID
            // For more info, we'd need to query User object via Apex
            return {
                userId: USER_ID,
                // Additional info would come from Apex query
            };
        } catch (error) {
            console.error('Error getting Salesforce user info:', error);
            return null;
        }
    }
    
    getQlikAccessToken() {
        // Qlik Embed Web Components stores access token in sessionStorage
        // The key format is typically: qlik-embed-access-token-{tenant}
        // Or it might be stored by the Qlik Embed library itself
        
        // Try different possible keys
        const possibleKeys = [
            `qlik-embed-access-token-${this.tenant}`,
            `qlik-access-token-${this.tenant}`,
            `qlik-access-token`,
            `qlik_${this.tenant}_access_token`,
            `qlik_access_token`,
            `qlik.embed.accessToken.${this.tenant}`,
            `qlik.embed.accessToken`
        ];
        
        for (const key of possibleKeys) {
            const token = sessionStorage.getItem(key);
            if (token) {
                try {
                    // Token might be stored as JSON string
                    const parsed = JSON.parse(token);
                    if (parsed.access_token || parsed.accessToken) {
                        return parsed.access_token || parsed.accessToken;
                    }
                } catch (e) {
                    // Not JSON, return as is
                    if (token && token.length > 10) {
                        return token;
                    }
                }
            }
        }
        
        // Check all sessionStorage keys for Qlik-related tokens
        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('qlik') || key.includes('access') || key.includes('token'))) {
                    const value = sessionStorage.getItem(key);
                    if (value && value.length > 20) {
                        // Might be a token
                        try {
                            const parsed = JSON.parse(value);
                            if (parsed.access_token || parsed.accessToken || parsed.token) {
                                return parsed.access_token || parsed.accessToken || parsed.token;
                            }
                        } catch (e) {
                            // Not JSON, might be direct token
                            if (value.startsWith('eyJ') || value.length > 50) {
                                // Looks like a JWT or long token
                                return value;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore errors during iteration
        }
        
        return null;
    }
    
    async qlikLogin() {
        try {
            // If using OAuth2, get token via Salesforce SSO
            if (this.authType === 'oauth2') {
                // First, try to get token from sessionStorage (if already authenticated)
                let accessToken = this.getQlikAccessToken();
                
                if (accessToken) {
                    // Verify token is valid
                    try {
                        const response = await fetch(`https://${this.tenant}/api/v1/users/me`, {
                            mode: 'cors',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        });
                        
                        if (response.status === 200) {
                            sessionStorage.removeItem('tryQlikAuth');
                            this.loginUrl = '';
                            return true;
                        }
                    } catch (e) {
                        // Token might be expired, get new one via SSO
                        console.log('Access token validation failed, getting new token via SSO');
                        accessToken = null;
                    }
                }
                
                // No valid token, get one via Salesforce SSO
                if (!accessToken) {
                    try {
                        this.statusMessage = 'Authenticating via Salesforce SSO...';
                        accessToken = await this.getTokenViaSSO();
                        
                        if (accessToken) {
                            // Store token for future use
                            sessionStorage.setItem(`qlik-access-token-${this.tenant}`, accessToken);
                            
                            // Verify token
                            const response = await fetch(`https://${this.tenant}/api/v1/users/me`, {
                                mode: 'cors',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`
                                }
                            });
                            
                            if (response.status === 200) {
                                sessionStorage.removeItem('tryQlikAuth');
                                this.loginUrl = '';
                                return true;
                            }
                        }
                    } catch (error) {
                        console.error('SSO authentication error:', error);
                        this.showError('SSO authentication failed. Please check your Auth0 configuration.');
                        throw new Error('SSO authentication failed: ' + error.message);
                    }
                }
                
                // If we still don't have a token, show error
                if (!accessToken) {
                    this.showError('OAuth2 authentication failed. Please check your Auth0 SSO configuration.');
                    throw new Error('OAuth2 authentication failed. Unable to get access token via SSO.');
                }
            }
            
            // Web Integration ID authentication (default)
            const response = await fetch(`https://${this.tenant}/api/v1/users/me`, {
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'qlik-web-integration-id': this.webIntegrationId
                }
            });
            
            if (response.status === 200) {
                sessionStorage.removeItem('tryQlikAuth');
                this.loginUrl = ''; // Clear login URL on success
                return true;
            }
            
            // Handle 401 Unauthorized - need to login
            if (response.status === 401) {
                const currentUrl = window.location.href;
                const loginUrl = `https://${this.tenant}/login?qlik-web-integration-id=${this.webIntegrationId}&returnto=${encodeURIComponent(currentUrl)}`;
                this.loginUrl = loginUrl;
                
                // First attempt - try automatic redirect (like Visualforce page)
                if (!sessionStorage.getItem('tryQlikAuth')) {
                    sessionStorage.setItem('tryQlikAuth', '1');
                    
                    // Try to redirect automatically (transparent authentication)
                    try {
                        // In Experience Cloud, try to redirect top window if in iframe
                        if (window.top && window.top !== window && window.top.location) {
                            window.top.location.href = loginUrl;
                        } else {
                            // Direct redirect (will work if cookies are allowed)
                            window.location.href = loginUrl;
                        }
                        // Don't throw error - let the redirect happen
                        return false;
                    } catch (e) {
                        // Cross-origin error - can't redirect automatically
                        // Show message but don't throw yet - will retry
                        this.showInfo('Redirecting to Qlik Cloud for authentication...');
                        // Try opening in same window as fallback
                        setTimeout(() => {
                            window.location.href = loginUrl;
                        }, 100);
                        return false;
                    }
                } else {
                    // Second attempt failed - cookies are likely blocked
                    sessionStorage.removeItem('tryQlikAuth');
                    // Show error with manual authentication option
                    this.showError('Qlik Cloud authentication required. Automatic authentication failed (cookies may be blocked). Please use the button below to authenticate.');
                    throw new Error('Qlik Cloud authentication required. Please authenticate manually.');
                }
            }
            
            // Other error statuses
            throw new Error(`Qlik Cloud authentication failed with status ${response.status}`);
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showError('Network error connecting to Qlik Cloud. Please check your connection and CSP settings.');
                throw new Error('Network error: ' + error.message);
            }
            throw error;
        }
    }
    
    async getQCSHeaders() {
        const response = await fetch(`https://${this.tenant}/api/v1/csrf-token`, {
            mode: 'cors',
            credentials: 'include',
            headers: {
                'qlik-web-integration-id': this.webIntegrationId
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get CSRF token (${response.status}).`);
        }
        
        const csrfToken = response.headers.get('qlik-csrf-token');
        if (!csrfToken) {
            throw new Error('CSRF token missing in Qlik Cloud response.');
        }
        
        return {
            'qlik-web-integration-id': this.webIntegrationId,
            'qlik-csrf-token': csrfToken
        };
    }
    
    buildQueryParams(headers) {
        return Object.entries(headers)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
    
    extractDisplayData(layout, objectId, indicatorId) {
        const qMeta = layout.qMeta || {};
        const title = qMeta.title || `Object ${objectId}`;
        
        // KPI
        if (layout.qkpi) {
            const kpi = layout.qkpi;
            return {
                type: 'kpi',
                value: kpi.qValue?.qText || kpi.qValue?.qNum || 'N/A',
                label: title
            };
        }
        
        // HyperCube
        if (layout.qHyperCube) {
            const hyperCube = layout.qHyperCube;
            if (hyperCube.qDataPages && hyperCube.qDataPages[0]) {
                const matrix = hyperCube.qDataPages[0].qMatrix;
                if (matrix && matrix.length > 0) {
                    if (matrix.length === 1 && matrix[0].length === 1) {
                        return {
                            type: 'kpi',
                            value: matrix[0][0]?.qText || matrix[0][0]?.qNum || 'N/A',
                            label: title
                        };
                    } else {
                        // Add keys to rows and cells
                        // Row is an array of cell objects
                        const dataWithKeys = matrix.slice(0, 10).map((row, rowIdx) => {
                            const rowKey = `${indicatorId}-row-${rowIdx}`;
                            const cells = row.map((cell, cellIdx) => ({
                                qText: cell?.qText || '',
                                qNum: cell?.qNum || null,
                                cellKey: `${indicatorId}-cell-${rowIdx}-${cellIdx}`
                            }));
                            return {
                                rowKey: rowKey,
                                cells: cells
                            };
                        });
                        return {
                            type: 'table',
                            data: dataWithKeys,
                            label: title
                        };
                    }
                }
            }
        }
        
        // ListObject
        if (layout.qListObject) {
            const listObject = layout.qListObject;
            if (listObject.qDataPages && listObject.qDataPages[0]) {
                const matrix = listObject.qDataPages[0].qMatrix;
                if (matrix && matrix.length > 0) {
                    // Add keys to list items
                    // Row is an array of cell objects
                    const dataWithKeys = matrix.slice(0, 10).map((row, rowIdx) => {
                        const rowKey = `${indicatorId}-list-row-${rowIdx}`;
                        const cells = row.map((cell, cellIdx) => ({
                            qText: cell?.qText || '',
                            qNum: cell?.qNum || null,
                            cellKey: `${indicatorId}-list-cell-${rowIdx}-${cellIdx}`
                        }));
                        return {
                            rowKey: rowKey,
                            cells: cells
                        };
                    });
                    return {
                        type: 'list',
                        data: dataWithKeys,
                        label: title
                    };
                }
            }
        }
        
        return { type: 'empty', label: title };
    }
    
    updateIndicator(objectId, newData) {
        const index = this.indicators.findIndex(ind => ind.objectId === objectId);
        if (index !== -1) {
            const indicatorId = this.indicators[index].id;
            
            // Add keys to updated data if it's a table or list
            if (newData.data && Array.isArray(newData.data) && newData.data.length > 0) {
                // Check if first row is already an object with rowKey (already processed)
                // or if it's still a raw array
                if (Array.isArray(newData.data[0])) {
                    // Raw array format - transform it
                    newData.data = newData.data.map((row, rowIdx) => {
                        const rowKey = `${indicatorId}-row-${rowIdx}`;
                        const cells = row.map((cell, cellIdx) => ({
                            qText: cell?.qText || '',
                            qNum: cell?.qNum || null,
                            cellKey: `${indicatorId}-cell-${rowIdx}-${cellIdx}`
                        }));
                        return {
                            rowKey: rowKey,
                            cells: cells
                        };
                    });
                }
            }
            
            this.indicators = [
                ...this.indicators.slice(0, index),
                { 
                    ...this.indicators[index], 
                    data: newData,
                    isKpi: newData.type === 'kpi',
                    isTable: newData.type === 'table',
                    isList: newData.type === 'list',
                    isError: newData.type === 'error',
                    isEmpty: newData.type === 'empty'
                },
                ...this.indicators.slice(index + 1)
            ];
        }
    }
    
    showSuccess(message) {
        this.statusMessage = message;
        this.statusClass = 'status-success';
        this.hasError = false;
        this.isLoading = false;
        this.loginUrl = ''; // Clear login URL on success
        
        if (this.showStatus) {
            setTimeout(() => {
                this.statusMessage = '';
            }, 3000);
        }
    }
    
    showError(message) {
        this.statusMessage = message;
        this.statusClass = 'status-error';
        this.hasError = true;
        this.isLoading = false;
        // Force showStatus to true when there's an error, so user can see it
        if (this.hasError && this.loginUrl) {
            // Error with login URL should always be visible
        }
        // Don't clear loginUrl, keep it for user to click
    }
    
    showInfo(message) {
        this.statusMessage = message;
        this.statusClass = 'status-info';
        this.hasError = false;
        this.isLoading = true;
    }
    
    handleLoginClick() {
        // Try to open in new window, but handle sandboxed iframe restrictions
        if (this.loginUrl) {
            try {
                // First, try to use window.top if we're in an iframe
                if (window.top && window.top !== window) {
                    try {
                        // Try to open in parent window's context
                        window.top.open(this.loginUrl, '_blank', 'noopener,noreferrer');
                        return;
                    } catch (e) {
                        // If that fails, try redirecting parent
                        try {
                            window.top.location.href = this.loginUrl;
                            return;
                        } catch (e2) {
                            // Cross-origin error, fall through to link method
                        }
                    }
                }
                
                // Try standard window.open
                const newWindow = window.open(this.loginUrl, '_blank', 'noopener,noreferrer');
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    // Popup blocked, create a temporary link and click it
                    this.openLinkInNewTab(this.loginUrl);
                }
            } catch (e) {
                // Fallback: create a temporary link and click it
                this.openLinkInNewTab(this.loginUrl);
            }
        }
    }
    
    handleOpenInNewTab() {
        // Same as handleLoginClick
        this.handleLoginClick();
    }
    
    openLinkInNewTab(url) {
        // Create a temporary link element and click it
        // This works better in sandboxed iframes
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    cleanup() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.enigmaSession) {
            this.enigmaSession.close().catch(err => console.error('Error closing session:', err));
        }
    }
    
    renderedCallback() {
        // Apply height dynamically
        const container = this.template.querySelector('.enigma-container');
        if (container && this.height) {
            container.style.height = this.height;
            container.style.minHeight = this.height;
        }
    }
    
    get hasIndicators() {
        return this.indicators && this.indicators.length > 0;
    }
}

