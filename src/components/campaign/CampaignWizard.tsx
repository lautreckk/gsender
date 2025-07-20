import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CampaignBasicInfo } from './steps/CampaignBasicInfo';
import { MessageCreation } from './steps/MessageCreation';
import { InstanceSelection } from './steps/InstanceSelection';
import { ContactUpload } from './steps/ContactUpload';
import { GroupSelection } from './steps/GroupSelection';
import { CampaignScheduling } from './steps/CampaignScheduling';
import { CampaignReview } from './steps/CampaignReview';
import { Tables } from '@/integrations/supabase/types';
import { useCampaignSettingsValues } from '@/contexts/SettingsContext';

export interface CampaignData {
  name: string;
  type: 'individual' | 'group';
  messages: MessageData[];
  selectedInstance?: {
    id: string;
    name: string;
    whatsapp_number: string;
    profile_name?: string;
  };
  contacts: ContactData[];
  scheduling: SchedulingData;
}

export interface MessageData {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  content: string; // Texto da mensagem ou legenda para mídia
  order: number;
  // Campos específicos para mídia
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  mediaUrl?: string; // URL do arquivo
  mediaBase64?: string; // Base64 do arquivo
  delay?: number; // Delay customizado para este tipo de mídia
  linkPreview?: boolean; // Para URLs em mensagens
}

export interface ContactData {
  nome: string;
  numero: string;
  tag: string;
}

export interface SchedulingData {
  days: string[];
  startTime: string;
  endTime: string;
  interval: number;
  startDate: string;
  immediate: boolean;
}

const STEPS = [
  { id: 1, title: 'Informações Básicas', description: 'Nome e tipo da campanha' },
  { id: 2, title: 'Mensagens', description: 'Criar mensagens da campanha' },
  { id: 3, title: 'Instância WhatsApp', description: 'Selecionar conexão' },
  { id: 4, title: 'Contatos/Grupos', description: 'Upload de contatos ou seleção de grupos' },
  { id: 5, title: 'Agendamento', description: 'Configurar horários' },
  { id: 6, title: 'Revisão', description: 'Confirmar e finalizar' }
];

interface CampaignWizardProps {
  onCampaignCreated?: () => void;
}

export function CampaignWizard({ onCampaignCreated }: CampaignWizardProps = {}) {
  const campaignSettings = useCampaignSettingsValues();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    type: 'individual',
    messages: [],
    contacts: [],
    scheduling: {
      days: [],
      startTime: '09:00',
      endTime: '18:00',
      interval: campaignSettings.defaultInterval,
      startDate: '',
      immediate: false
    }
  });

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepComplete = (stepData: Partial<CampaignData>) => {
    setCampaignData(prev => ({ ...prev, ...stepData }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name.trim() !== '';
      case 2:
        return campaignData.messages.length > 0 && campaignData.messages.length <= campaignSettings.maxMessagesPerCampaign;
      case 3:
        return campaignData.selectedInstance !== undefined;
      case 4:
        return campaignData.contacts.length > 0 && campaignData.contacts.length <= campaignSettings.maxContactsPerCampaign;
      case 5:
        // Permitir prosseguir se for início rápido OU se dias estiverem selecionados
        return campaignData.scheduling.immediate || campaignData.scheduling.days.length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CampaignBasicInfo
            data={campaignData}
            onUpdate={handleStepComplete}
          />
        );
      case 2:
        return (
          <MessageCreation
            data={campaignData}
            onUpdate={handleStepComplete}
          />
        );
      case 3:
        return (
          <InstanceSelection
            data={campaignData}
            onUpdate={handleStepComplete}
          />
        );
      case 4:
        return campaignData.type === 'individual' ? (
          <ContactUpload
            data={campaignData}
            onUpdate={handleStepComplete}
          />
        ) : (
          <GroupSelection
            data={campaignData}
            onUpdate={handleStepComplete}
          />
        );
      case 5:
        return (
          <CampaignScheduling
            data={campaignData}
            onUpdate={handleStepComplete}
          />
        );
      case 6:
        return (
          <CampaignReview
            data={campaignData}
            onUpdate={handleStepComplete}
            onCampaignCreated={onCampaignCreated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Criar Nova Campanha</span>
            <span className="text-sm text-muted-foreground">
              Passo {currentStep} de {STEPS.length}
            </span>
          </CardTitle>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    step.id === currentStep ? 'text-primary font-medium' : ''
                  } ${step.id < currentStep ? 'text-green-600' : ''}`}
                >
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              {STEPS[currentStep - 1].title}
            </h3>
            <p className="text-muted-foreground">
              {STEPS[currentStep - 1].description}
            </p>
          </div>

          {renderStep()}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || currentStep === STEPS.length}
            >
              {currentStep === STEPS.length ? 'Finalizar' : 'Próximo'}
              {currentStep !== STEPS.length && (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}