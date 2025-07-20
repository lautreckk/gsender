// Campaign executor implementation
export { CampaignManager } from './CampaignManager';
export type { CampaignExecution } from './CampaignProcessor';

// Default campaign executor instance
import { CampaignManager } from './CampaignManager';
export const campaignExecutor = CampaignManager.getInstance();