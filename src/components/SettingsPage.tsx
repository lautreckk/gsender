import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiSettings } from './settings/ApiSettings';
import { SecuritySettings } from './settings/SecuritySettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { BackupSettings } from './settings/BackupSettings';
import { CampaignSettings } from './settings/CampaignSettings';
import { WhiteLabelSettings } from './settings/WhiteLabelSettings';

export function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as configurações da sua plataforma
          </p>
        </div>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="whitelabel">White Label</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <ApiSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="backup">
          <BackupSettings />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignSettings />
        </TabsContent>

        <TabsContent value="whitelabel">
          <WhiteLabelSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}