import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Gift, AlertTriangle, Crown } from 'lucide-react';

interface TrialStatusBannerProps {
  isTrialActive: boolean;
  trialDaysRemaining: number;
  subscriptionPlan?: string;
  couponCode?: string | null;
  onUpgrade?: () => void;
}

export const TrialStatusBanner = ({ 
  isTrialActive, 
  trialDaysRemaining, 
  subscriptionPlan = 'trial',
  couponCode,
  onUpgrade 
}: TrialStatusBannerProps) => {
  
  if (subscriptionPlan !== 'trial') {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <Crown className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-700 dark:text-green-300">
              Plano ativo: <strong>{subscriptionPlan}</strong>
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Premium
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isTrialActive) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="text-red-700 dark:text-red-300">
              <strong>Trial expirado</strong> - Faça upgrade para continuar usando todas as funcionalidades
            </span>
          </div>
          {onUpgrade && (
            <Button size="sm" onClick={onUpgrade} className="ml-4">
              Fazer Upgrade
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const getTrialInfo = () => {
    if (trialDaysRemaining > 3) {
      return {
        icon: <Gift className="h-4 w-4 text-blue-600" />,
        color: 'blue',
        urgency: 'normal'
      };
    } else if (trialDaysRemaining > 1) {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-600" />,
        color: 'yellow',
        urgency: 'warning'
      };
    } else {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
        color: 'red',
        urgency: 'urgent'
      };
    }
  };

  const trialInfo = getTrialInfo();
  const isUrgent = trialInfo.urgency === 'urgent';
  const isWarning = trialInfo.urgency === 'warning';

  const alertClasses = isUrgent 
    ? "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
    : isWarning 
    ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800"
    : "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800";

  const textClasses = isUrgent
    ? "text-red-700 dark:text-red-300"
    : isWarning
    ? "text-yellow-700 dark:text-yellow-300" 
    : "text-blue-700 dark:text-blue-300";

  const badgeClasses = isUrgent
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    : isWarning
    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";

  const getTimeText = () => {
    if (trialDaysRemaining === 0) {
      return "menos de 1 dia";
    } else if (trialDaysRemaining === 1) {
      return "1 dia";
    } else {
      return `${trialDaysRemaining} dias`;
    }
  };

  return (
    <Alert className={alertClasses}>
      {trialInfo.icon}
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={textClasses}>
            <strong>Trial ativo</strong> - {getTimeText()} restantes
            {couponCode && couponCode !== 'default' && (
              <span className="ml-2">
                (cupom: {couponCode})
              </span>
            )}
          </span>
          <Badge variant="outline" className={badgeClasses}>
            {getTimeText()}
          </Badge>
        </div>
        {onUpgrade && (isUrgent || isWarning) && (
          <Button 
            size="sm" 
            onClick={onUpgrade} 
            variant={isUrgent ? "default" : "outline"}
            className="ml-4"
          >
            {isUrgent ? "Upgrade Agora" : "Fazer Upgrade"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};