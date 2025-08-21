import { LightningElement, api, track } from 'lwc';

export default class QlikEmbed extends LightningElement {
    @api ui = 'analytics/chart';
    @api appId = 'c5370f35-f4fe-40cb-b0b4-d0a7e6dee1ba';
    @api objectId = 'htaMkv';
    
    @track showStatus = false;
    @track statusMessage = '';
    @track statusClass = 'status-info';
    
    connectedCallback() {
        this.showStatus = true;
        this.statusMessage = 'Initializing Qlik Embed...';
        this.statusClass = 'status-info';
        
        // Check if Qlik embed script is already loaded
        if (typeof window !== 'undefined' && window.qlikEmbedScriptLoaded) {
            this.createQlikEmbed();
        } else {
            // Wait for the script to be loaded by other means
            this.waitForQlikScript();
        }
    }
    
    waitForQlikScript() {
        this.statusMessage = 'Waiting for Qlik script to load...';
        this.statusClass = 'status-info';
        
        // Check every 500ms if the script is loaded
        const checkInterval = setInterval(() => {
            if (typeof window !== 'undefined' && window.qlikEmbedScriptLoaded) {
                clearInterval(checkInterval);
                this.createQlikEmbed();
            }
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            this.showError('Qlik Embed script not loaded. Please ensure the script is included in your org.');
        }, 10000);
    }
    
    createQlikEmbed() {
        try {
            this.statusMessage = 'Creating Qlik Embed component...';
            this.statusClass = 'status-info';
            
            const container = this.template.querySelector('.qlik-container');
            if (container && !container.querySelector('qlik-embed')) {
                const qlikEmbed = document.createElement('qlik-embed');
                qlikEmbed.setAttribute('ui', this.ui);
                qlikEmbed.setAttribute('app-id', this.appId);
                qlikEmbed.setAttribute('object-id', this.objectId);

                container.appendChild(qlikEmbed);
                this.showSuccess('Qlik Embed component loaded successfully!');
            }
        } catch (error) {
            this.showError('Error creating Qlik Embed: ' + error.message);
        }
    }
    
    showSuccess(message) {
        this.statusMessage = message;
        this.statusClass = 'status-success';
        this.dispatchEvent(new CustomEvent('qlikstatus', {
            detail: { status: 'success', message }
        }));
    }
    
    showError(message) {
        this.statusMessage = message;
        this.statusClass = 'status-error';
        this.dispatchEvent(new CustomEvent('qlikstatus', {
            detail: { status: 'error', message }
        }));
    }
}
