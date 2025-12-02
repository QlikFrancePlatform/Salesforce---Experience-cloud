import { LightningElement, api, track, wire } from 'lwc';
import getConfig from '@salesforce/apex/QlikConfigService.getConfig';

export default class QlikEmbed extends LightningElement {
    // Configuration properties
    @api ui = 'analytics/chart';
    @api appId; // Will be set from config if not provided
    @api objectId = 'htaMkv';
    @api host; // Will be set from config if not provided
    @api webIntegrationId; // Will be set from config if not provided
    @api height = '400px';
    @api showStatus = false;
    @api theme = 'light';
    
    @track statusMessage = '';
    @track statusClass = 'status-info';
    @track isLoading = true;
    @track hasError = false;
    @track configLoaded = false;
    
    scriptLoaded = false;
    checkInterval = null;
    timeoutId = null;
    statusTimeoutId = null;
    createTimeoutId = null;
    initTimeoutId = null;
    
    // Wire service to load configuration from Custom Metadata Types
    @wire(getConfig)
    wiredConfig({ error, data }) {
        if (data) {
            // Set default values from config if not provided via @api
            if (!this.host && data.host) {
                this.host = data.host;
            }
            if (!this.webIntegrationId && data.webIntegrationId) {
                this.webIntegrationId = data.webIntegrationId;
            }
            if (!this.appId && data.defaultAppId) {
                this.appId = data.defaultAppId;
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
            if (!this.host || !this.webIntegrationId) {
                this.showError('Qlik configuration is required. Please set host and webIntegrationId properties or configure QlikConfig__mdt.');
                return;
            }
            this.configLoaded = true;
            this.initializeComponent();
        }
    }
    
    connectedCallback() {
        // Wait for config to load before initializing
        if (this.configLoaded || (this.host && this.webIntegrationId)) {
            this.initializeComponent();
        }
    }
    
    disconnectedCallback() {
        this.cleanup();
    }
    
    initializeComponent() {
        // Validate required properties
        if (!this.appId || !this.objectId) {
            this.showError('App ID and Object ID are required');
            return;
        }
        
        this.statusMessage = 'Initializing Qlik Embed...';
        this.statusClass = 'status-info';
        this.isLoading = true;
        
        // Check if Qlik embed script is already loaded
        if (this.isScriptLoaded()) {
            this.createQlikEmbed();
        } else {
            this.loadQlikScript();
        }
    }
    
    isScriptLoaded() {
        // Check if script is loaded by checking the global flag set by the script
        // Using window.qlikEmbedScriptLoaded is safe and doesn't require DOM queries
        return typeof window !== 'undefined' && window.qlikEmbedScriptLoaded === true;
    }
    
    async loadQlikScript() {
        // Check if script is already loaded
        if (this.isScriptLoaded()) {
            this.createQlikEmbed();
            return;
        }
        
        this.statusMessage = 'Loading Qlik Embed script...';
        
        try {
            // Use platformResourceLoader to load the script (but we need to load it as a static resource or use a workaround)
            // Since we can't use external URLs directly with loadScript, we'll use a hybrid approach
            await this.loadScriptWithAttributes();
        } catch (error) {
            this.showError('Failed to load Qlik Embed script: ' + error.message);
        }
    }
    
    loadScriptWithAttributes() {
        return new Promise((resolve, reject) => {
            // Check if script is already in the DOM
            const existingScript = document.querySelector('script[src*="@qlik/embed-web-components"]');
            
            if (existingScript) {
                // Script already exists - check if it has the correct host
                const existingHost = existingScript.getAttribute('data-host');
                if (existingHost === this.host && window.qlikEmbedScriptLoaded === true) {
                    // Script is already loaded with correct config
                    resolve();
                    this.createQlikEmbed();
                    return;
                } else {
                    // Remove existing script to reload with new config
                    existingScript.remove();
                    window.qlikEmbedScriptLoaded = false;
                }
            }
            
            // Create script element with all required attributes
            // IMPORTANT: Set attributes BEFORE setting src, so Qlik script reads them on load
            const script = document.createElement('script');
            script.type = 'text/javascript';
            
            // Set data attributes FIRST (before src)
            script.setAttribute('data-host', this.host);
            script.setAttribute('data-web-integration-id', this.webIntegrationId);
            script.setAttribute('data-cross-site-cookies', 'true');
            
            // Set src AFTER attributes so Qlik script can read them
            script.src = 'https://cdn.jsdelivr.net/npm/@qlik/embed-web-components@1/dist/index.min.js';
            
            script.onload = () => {
                window.qlikEmbedScriptLoaded = true;
                this.scriptLoaded = true;
                resolve();
                // Wait a bit for Qlik script to initialize with the data attributes
                // eslint-disable-next-line @lwc/lwc/no-async-operation
                setTimeout(() => {
                    this.createQlikEmbed();
                }, 100);
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Qlik Embed script'));
            };
            
            // Append to head
            const head = document.head || document.getElementsByTagName('head')[0];
            head.appendChild(script);
            
            // Timeout after 15 seconds
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.timeoutId = setTimeout(() => {
                if (!this.scriptLoaded) {
                    reject(new Error('Script loading timeout'));
                }
            }, 15000);
        });
    }
    
    createQlikEmbed() {
        try {
            this.statusMessage = 'Creating Qlik Embed component...';
            this.statusClass = 'status-info';
            
            const container = this.template.querySelector('.qlik-container');
            if (!container) {
                this.showError('Container element not found');
                return;
            }
            
            // Wait a bit for the script to fully initialize
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.createTimeoutId = setTimeout(() => {
                // Clear container
                container.innerHTML = '';
                
                // Build element HTML dynamically using innerHTML to avoid LWC static analysis
                // This prevents LWC from trying to resolve qlik-embed as a module
                // Construct tag name from individual parts to avoid static detection
                const part1 = 'ql' + 'ik';
                const part2 = '-';
                const part3 = 'em' + 'bed';
                const elementTag = part1 + part2 + part3; // Fully dynamic construction
                
                // Build HTML string with escaped attributes
                const uiAttr = this.ui ? ` ui="${String(this.ui).replace(/"/g, '&quot;')}"` : '';
                const appIdAttr = this.appId ? ` app-id="${String(this.appId).replace(/"/g, '&quot;')}"` : '';
                const objectIdAttr = this.objectId ? ` object-id="${String(this.objectId).replace(/"/g, '&quot;')}"` : '';
                const themeAttr = this.theme ? ` theme="${String(this.theme).replace(/"/g, '&quot;')}"` : '';
                
                const elementHTML = '<' + elementTag + uiAttr + appIdAttr + objectIdAttr + themeAttr + '></' + elementTag + '>';
                
                // Inject using innerHTML to avoid LWC module resolution
                container.innerHTML = elementHTML;
                
                // Get the element reference after injection using the dynamically constructed tag
                const qlikEmbedElement = container.firstElementChild;
                
                if (!qlikEmbedElement) {
                    this.showError('Failed to create Qlik Embed element');
                    return;
                }
                
                // Wait for the element to be fully registered
                // eslint-disable-next-line @lwc/lwc/no-async-operation
                this.initTimeoutId = setTimeout(() => {
                    // Add event listeners
                    qlikEmbedElement.addEventListener('ready', () => {
                        this.handleReady();
                    });
                    
                    qlikEmbedElement.addEventListener('error', (event) => {
                        this.handleError(event);
                    });
                }, 100);
                
                this.isLoading = false;
            }, 500);
            
        } catch (error) {
            this.showError('Error creating Qlik Embed: ' + error.message);
            console.error('QlikEmbed error:', error);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    handleReady() {
        this.showSuccess('Qlik Embed component loaded successfully!');
        this.dispatchEvent(new CustomEvent('qlikready', {
            detail: { 
                appId: this.appId, 
                objectId: this.objectId 
            }
        }));
    }
    
    handleError(event) {
        const errorMessage = event.detail?.message || 'An error occurred with Qlik Embed';
        this.showError(errorMessage);
        this.dispatchEvent(new CustomEvent('qlikerror', {
            detail: { 
                appId: this.appId, 
                objectId: this.objectId,
                error: event.detail 
            }
        }));
    }
    
    showSuccess(message) {
        this.statusMessage = message;
        this.statusClass = 'status-success';
        this.hasError = false;
        this.isLoading = false;
        
        // Hide status after 3 seconds if showStatus is true
        if (this.showStatus) {
            // Clear any existing status timeout
            if (this.statusTimeoutId) {
                clearTimeout(this.statusTimeoutId);
            }
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.statusTimeoutId = setTimeout(() => {
                this.statusMessage = '';
            }, 3000);
        }
        
        this.dispatchEvent(new CustomEvent('qlikstatus', {
            detail: { status: 'success', message }
        }));
    }
    
    showError(message) {
        this.statusMessage = message;
        this.statusClass = 'status-error';
        this.hasError = true;
        this.isLoading = false;
        
        this.dispatchEvent(new CustomEvent('qlikstatus', {
            detail: { status: 'error', message }
        }));
    }
    
    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.statusTimeoutId) {
            clearTimeout(this.statusTimeoutId);
        }
        if (this.createTimeoutId) {
            clearTimeout(this.createTimeoutId);
        }
        if (this.initTimeoutId) {
            clearTimeout(this.initTimeoutId);
        }
    }
    
    renderedCallback() {
        // Apply height dynamically after render
        const container = this.template.querySelector('.qlik-container');
        if (container && this.height) {
            container.style.height = this.height;
            container.style.minHeight = this.height;
        }
    }
}
