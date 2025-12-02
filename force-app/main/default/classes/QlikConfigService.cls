/**
 * Service Apex pour récupérer la configuration Qlik depuis Custom Metadata Types
 * Permet de gérer les variables d'environnement sans coder en dur les valeurs
 */
public with sharing class QlikConfigService {
    
    /**
     * Récupère la configuration Qlik active
     * @return QlikConfig__mdt ou null si aucune configuration active
     */
    public static QlikConfig__mdt getActiveConfig() {
        try {
            List<QlikConfig__mdt> configs = [
                SELECT Id, DeveloperName, Host__c, WebIntegrationId__c, 
                       ClientId__c, RedirectUri__c, DefaultAppId__c, IsActive__c
                FROM QlikConfig__mdt
                WHERE IsActive__c = true
                LIMIT 1
            ];
            
            if (!configs.isEmpty()) {
                return configs[0];
            }
            
            // Si aucune config active, retourner la première disponible
            configs = [
                SELECT Id, DeveloperName, Host__c, WebIntegrationId__c, 
                       ClientId__c, RedirectUri__c, DefaultAppId__c, IsActive__c
                FROM QlikConfig__mdt
                LIMIT 1
            ];
            
            return configs.isEmpty() ? null : configs[0];
        } catch (Exception e) {
            System.debug('Error getting Qlik config: ' + e.getMessage());
            return null;
        }
    }
    
    /**
     * Récupère une configuration par son DeveloperName
     * @param developerName Le DeveloperName de la configuration
     * @return QlikConfig__mdt ou null si non trouvée
     */
    public static QlikConfig__mdt getConfigByName(String developerName) {
        try {
            List<QlikConfig__mdt> configs = [
                SELECT Id, DeveloperName, Host__c, WebIntegrationId__c, 
                       ClientId__c, RedirectUri__c, DefaultAppId__c, IsActive__c
                FROM QlikConfig__mdt
                WHERE DeveloperName = :developerName
                LIMIT 1
            ];
            
            return configs.isEmpty() ? null : configs[0];
        } catch (Exception e) {
            System.debug('Error getting Qlik config by name: ' + e.getMessage());
            return null;
        }
    }
    
    /**
     * Méthodes utilitaires pour récupérer des valeurs spécifiques
     */
    @AuraEnabled(cacheable=true)
    public static String getHost() {
        QlikConfig__mdt config = getActiveConfig();
        return config != null ? config.Host__c : null;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getWebIntegrationId() {
        QlikConfig__mdt config = getActiveConfig();
        return config != null ? config.WebIntegrationId__c : null;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getClientId() {
        QlikConfig__mdt config = getActiveConfig();
        return config != null ? config.ClientId__c : null;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getRedirectUri() {
        QlikConfig__mdt config = getActiveConfig();
        return config != null ? config.RedirectUri__c : null;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getDefaultAppId() {
        QlikConfig__mdt config = getActiveConfig();
        return config != null ? config.DefaultAppId__c : null;
    }
    
    /**
     * Récupère toute la configuration en une seule fois
     * @return Map avec toutes les valeurs de configuration
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getConfig() {
        QlikConfig__mdt config = getActiveConfig();
        Map<String, String> configMap = new Map<String, String>();
        
        if (config != null) {
            configMap.put('host', config.Host__c);
            configMap.put('webIntegrationId', config.WebIntegrationId__c);
            configMap.put('clientId', config.ClientId__c);
            configMap.put('redirectUri', config.RedirectUri__c);
            configMap.put('defaultAppId', config.DefaultAppId__c);
        }
        
        return configMap;
    }
}

