/**
 * Contrôleur Apex pour les pages Visualforce Qlik
 * Expose la configuration Qlik depuis Custom Metadata Types
 */
public with sharing class QlikPageController {
    
    /**
     * Récupère la configuration Qlik active pour les pages Visualforce
     * @return Map avec toutes les valeurs de configuration
     */
    public Map<String, String> getQlikConfig() {
        QlikConfig__mdt config = QlikConfigService.getActiveConfig();
        Map<String, String> configMap = new Map<String, String>();
        
        if (config != null) {
            configMap.put('host', config.Host__c != null ? config.Host__c : '');
            configMap.put('tenant', config.Host__c != null ? config.Host__c.replace('https://', '').replace('http://', '').replace('/', '') : '');
            configMap.put('webIntegrationId', config.WebIntegrationId__c != null ? config.WebIntegrationId__c : '');
            configMap.put('clientId', config.ClientId__c != null ? config.ClientId__c : '');
            configMap.put('redirectUri', config.RedirectUri__c != null ? config.RedirectUri__c : '');
            configMap.put('defaultAppId', config.DefaultAppId__c != null ? config.DefaultAppId__c : '');
        }
        
        return configMap;
    }
    
    /**
     * Propriétés publiques pour accès direct dans Visualforce
     */
    public String qlikHost {
        get {
            QlikConfig__mdt config = QlikConfigService.getActiveConfig();
            return config != null && config.Host__c != null ? config.Host__c : '';
        }
    }
    
    public String qlikTenant {
        get {
            QlikConfig__mdt config = QlikConfigService.getActiveConfig();
            if (config != null && config.Host__c != null) {
                return config.Host__c.replace('https://', '').replace('http://', '').replace('/', '');
            }
            return '';
        }
    }
    
    public String qlikWebIntegrationId {
        get {
            QlikConfig__mdt config = QlikConfigService.getActiveConfig();
            return config != null && config.WebIntegrationId__c != null ? config.WebIntegrationId__c : '';
        }
    }
    
    public String qlikClientId {
        get {
            QlikConfig__mdt config = QlikConfigService.getActiveConfig();
            return config != null && config.ClientId__c != null ? config.ClientId__c : '';
        }
    }
    
    public String qlikRedirectUri {
        get {
            QlikConfig__mdt config = QlikConfigService.getActiveConfig();
            return config != null && config.RedirectUri__c != null ? config.RedirectUri__c : '';
        }
    }
    
    public String qlikDefaultAppId {
        get {
            QlikConfig__mdt config = QlikConfigService.getActiveConfig();
            return config != null && config.DefaultAppId__c != null ? config.DefaultAppId__c : '';
        }
    }
}

